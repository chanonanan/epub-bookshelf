/**
 * Helper functions for Google Drive API authentication and file operations
 */
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

/**
 * List all EPUB files in user's Drive
 */
export const listEpubFiles = async (folderId: string): Promise<DriveFile[]> => {
  const tokens = await getTokens();
  if (!tokens) return [];

  const query = `'${folderId}' in parents and mimeType='application/epub+zip'`;
  const fields = 'nextPageToken,files(id,name,mimeType,size)';
  let allFiles: DriveFile[] = [];
  let pageToken: string | null = null;

  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.append('q', query);
    url.searchParams.append('fields', fields);
    url.searchParams.append('pageSize', '100'); // Get maximum items per request
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
    allFiles = allFiles.concat(data.files || []);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return allFiles;
};

/**
 * Download an EPUB file from Drive (no caching)
 */
export const downloadFile = async (fileId: string): Promise<Blob | null> => {
  const tokens = await getTokens();
  if (!tokens) return null;

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  if (!response.ok) return null;

  return response.blob();
};

// Private helper functions
const _refreshTokens = async (): Promise<GoogleTokens | null> => {
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
