import localforage from 'localforage';

const SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let client: ReturnType<
  typeof window.google.accounts.oauth2.initTokenClient
> | null = null;

let tokenPromise: Promise<GoogleTokens | null> | null = null;

/**
 * Initialize Google Identity Services
 */
export const initializeGoogleAuth = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = async () => {
      try {
        // Initialize the client
        client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          prompt: '', // Empty string to use default prompt for test users
          auto_select: true, // Auto select the test account
          ux_mode: /Mobi|Android/i.test(navigator.userAgent)
            ? 'redirect'
            : 'popup',
          redirect_uri: 'https://chanonanan.github.io/epub-bookshelf/callback',
          callback: (response: TokenResponse) => {
            if (response.error) {
              reject(response.error);
              return;
            }

            // Store tokens
            const tokens: GoogleTokens = {
              access_token: response.access_token,
              expires_at: Date.now() + response.expires_in * 1000,
            };
            localforage.setItem('google_tokens', tokens);
            tokenPromise = Promise.resolve(tokens);
            resolve();
          },
        });

        // Check if we have cached tokens
        const cachedTokens =
          await localforage.getItem<GoogleTokens>('google_tokens');
        if (cachedTokens && cachedTokens.expires_at > Date.now()) {
          tokenPromise = Promise.resolve(cachedTokens);
          resolve();
          return;
        }

        // Request new tokens
        client?.requestAccessToken();
      } catch (err) {
        reject(err);
      }
    };
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

/**
 * Get OAuth tokens, either from cache or by authenticating
 */
export const getTokens = async (): Promise<GoogleTokens | null> => {
  if (!tokenPromise) {
    tokenPromise = _refreshTokens();
  }
  return tokenPromise;
};

let userEmail: string | null = null;

/**
 * Get user's email for cache key
 */
const getUserEmail = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.email;
  } catch (error) {
    console.error('Failed to fetch user email:', error);
    return null;
  }
};

const foldersCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'folders',
});

/**
 * List all EPUB files in user's Drive
 */
export const listEpubFiles = async (
  folderId: string,
  ignoreCache = false,
): Promise<DriveFile[]> => {
  const authTokens = await getTokens();
  if (!authTokens) return [];

  // Get user email if we don't have it
  if (!userEmail) {
    userEmail = await getUserEmail(authTokens.access_token);
  }

  const cacheKey = userEmail
    ? `epubFiles:${userEmail}:${folderId}`
    : `epubFiles:${folderId}`;
  const cachedFiles = await foldersCache.getItem<DriveFile[]>(cacheKey);
  if (cachedFiles && !ignoreCache) return cachedFiles;

  const tokens = await getTokens();
  if (!tokens) return [];

  const allFiles: DriveFile[] = [];

  // helper to list both files & folders inside a parent
  const fetchChildren = async (parentId: string): Promise<void> => {
    let pageToken: string | null = null;

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append(
        'q',
        `'${parentId}' in parents and trashed=false`,
      );
      url.searchParams.append(
        'fields',
        'nextPageToken,files(id,name,mimeType,size)',
      );
      url.searchParams.append('pageSize', '100');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch files:', response.statusText);
        break;
      }

      const data = await response.json();
      const files: DriveFile[] = data.files || [];

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // recurse into subfolder
          await fetchChildren(file.id);
        } else if (file.mimeType === 'application/epub+zip') {
          allFiles.push(file);
        }
      }

      pageToken = data.nextPageToken || null;
    } while (pageToken);
  };

  await fetchChildren(folderId);

  await foldersCache.setItem(cacheKey, allFiles);
  return allFiles;
};

/**
 * Download an EPUB file from Drive (no caching)
 */
export const downloadFile = async (fileId: string): Promise<Blob | null> => {
  try {
    const tokens = await getTokens();
    if (!tokens) {
      console.error('No authentication tokens available');
      return null;
    }

    if (!fileId) {
      console.error('No fileId provided');
      return null;
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    console.log('Attempting to download file:', { fileId, url });

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!response.ok) {
      console.error('Download failed:', {
        status: response.status,
        statusText: response.statusText,
        fileId,
      });
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }

    return response.blob();
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

// Helper functions
export const _refreshTokens = async (): Promise<GoogleTokens | null> => {
  try {
    if (!client) {
      await initializeGoogleAuth();
    }

    // Check cache first
    const cachedTokens =
      await localforage.getItem<GoogleTokens>('google_tokens');
    if (cachedTokens && cachedTokens.expires_at > Date.now()) {
      return cachedTokens;
    }

    // Request new tokens
    return new Promise((resolve) => {
      if (client) {
        client.callback = (response: TokenResponse) => {
          if (response.error) {
            resolve(null);
            return;
          }

          const tokens: GoogleTokens = {
            access_token: response.access_token,
            expires_at: Date.now() + response.expires_in * 1000,
          };
          localforage.setItem('google_tokens', tokens);
          resolve(tokens);
        };
        client.requestAccessToken();
      } else {
        resolve(null);
      }
    });
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    return null;
  }
};
