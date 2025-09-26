import localforage from 'localforage';

const foldersCache = localforage.createInstance({
  name: 'epubBookshelf',
  storeName: 'folders',
});

export class GoogleTokenUtil {
  private static tokenCache = localforage.createInstance({
    name: 'epubBookshelf',
    storeName: 'google_token',
  });

  static async setToken(resp: TokenResponse | null) {
    if (resp) {
      const expires_at = Date.now() + resp.expires_in * 1000;
      const userinfo = await this.getUserinfo(resp.access_token);
      const token: GoogleToken = {
        access_token: resp.access_token,
        expires_at,
        user_info: userinfo,
      };

      await GoogleTokenUtil.tokenCache.setItem('google_token', token);
      return token;
    } else {
      await GoogleTokenUtil.tokenCache.removeItem('google_token');
      return null;
    }
  }

  static async getToken(): Promise<GoogleToken | null> {
    const token =
      await GoogleTokenUtil.tokenCache.getItem<GoogleToken>('google_token');
    if (token && token.expires_at > Date.now()) {
      return token;
    }
    return null;
  }

  private static async getUserinfo(access_token: string) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      if (!response.ok) return null;
      const data = await response.json();
      console.log('User info:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }
}

export const listEpubFiles = async (
  folderId: string,
  ignoreCache = false,
): Promise<DriveFile[]> => {
  const token = await GoogleTokenUtil.getToken();
  if (!token) return [];

  const userEmail = token.user_info?.email;

  const cacheKey = userEmail
    ? `epubFiles:${userEmail}:${folderId}`
    : `epubFiles:${folderId}`;
  const cachedFiles = await foldersCache.getItem<DriveFile[]>(cacheKey);
  if (cachedFiles && !ignoreCache) return cachedFiles;

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
          Authorization: `Bearer ${token.access_token}`,
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

export const downloadFile = async (fileId: string): Promise<Blob | null> => {
  try {
    const token = await GoogleTokenUtil.getToken();
    if (!token) {
      console.error('No authentication token available');
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
        Authorization: `Bearer ${token.access_token}`,
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

export async function checkFolderAccess(folderId: string): Promise<boolean> {
  try {
    const token = await GoogleTokenUtil.getToken();
    if (!token) return false;
    if (!folderId) return false;

    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    );

    return resp.ok;
  } catch (error) {
    return false;
  }
}
