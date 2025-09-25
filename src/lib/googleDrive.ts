import localforage from 'localforage';

export const setTokens = async (tokenResponse: TokenResponse) => {
  const tokens: GoogleTokens = {
    access_token: tokenResponse.access_token!,
    expires_at: Date.now() + tokenResponse.expires_in * 1000,
  };

  await localforage.setItem('google_tokens', tokens);
};

export const getTokens = async (): Promise<GoogleTokens | null> => {
  const cachedTokens = await localforage.getItem<GoogleTokens>('google_tokens');
  if (cachedTokens && cachedTokens.expires_at > Date.now()) {
    return cachedTokens;
  }

  return null;
};

export const clearTokens = async () => {
  await localforage.removeItem('google_tokens');
};

let userEmail: string | null = null;

/**
 * Get user's email for cache key
 */
const getUserEmail = async (): Promise<string | null> => {
  try {
    const tokens = await getTokens();
    if (!tokens) return null;

    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
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
    userEmail = await getUserEmail();
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
