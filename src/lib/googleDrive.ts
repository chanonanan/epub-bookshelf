import localforage from 'localforage';
import { fetchWithCache } from './fetchUtil';

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
      const response = await fetchWithCache(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
        24 * 60 * 60 * 1000, // cache for 24 hours
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

export class FileUtil {
  static async getMetadataById(fileId: string): Promise<DriveFile | null> {
    try {
      const token = await GoogleTokenUtil.getToken();
      if (!token) return null;

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`;
      const response = await fetchWithCache(
        url,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
        60 * 60 * 1000, // cache for 1 hour
      );

      if (!response.ok) {
        console.error('Failed to fetch file metadata:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data as DriveFile;
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      return null;
    }
  }

  static async getFileById(fileId: string): Promise<Blob | null> {
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

      const response = await fetchWithCache(
        url,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
        60 * 60 * 1000, // cache for 1 hour
      );

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
  }
}

export class FolderUtil {
  private static folderCache = localforage.createInstance({
    name: 'epubBookshelf',
    storeName: 'folders',
  });

  static async createFolder(folder: DriveFile): Promise<void> {
    await FolderUtil.folderCache.setItem(folder.id, {
      ...folder,
      lastUpdate: Date.now(),
      files: [],
    });
  }

  static async getFolder(id: string): Promise<DriveFolder | null> {
    const folderAccess = await this.checkFolderAccess(id);
    if (!folderAccess) {
      return null;
    }

    const folder = await FolderUtil.folderCache.getItem<DriveFolder>(id);

    if (!folder) return null;

    if (!folder.files.length) {
      folder.files = await FolderUtil.fetchChildren(id);
      folder.lastUpdate = Date.now();
      await FolderUtil.folderCache.setItem(id, folder);
    }

    return folder;
  }

  static async getAllFolders(): Promise<DriveFolder[]> {
    const folders: DriveFolder[] = [];
    const folderIds: string[] = [];
    await FolderUtil.folderCache.iterate((_, key: string) => {
      folderIds.push(key);
    });

    for (const id of folderIds) {
      const folder = await this.getFolder(id);
      if (folder) {
        folders.push(folder);
      }
    }

    folders.sort((a, b) => b.lastUpdate - a.lastUpdate);
    return folders;
  }

  static async deleteFolder(id: string): Promise<void> {
    await FolderUtil.folderCache.removeItem(id);
  }

  static async checkFolderAccess(folderId: string): Promise<boolean> {
    try {
      if (!folderId) return false;

      const token = await GoogleTokenUtil.getToken();
      if (!token) return false;

      const resp = await fetchWithCache(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
        5 * 60 * 1000, // cache for 5 minutes
      );

      return resp.ok;
    } catch (error) {
      return false;
    }
  }

  static async loadFilesInFolder(folderId: string): Promise<void> {
    const folder = await FolderUtil.getFolder(folderId);
    if (!folder) throw new Error('Folder not found');

    folder.files = await FolderUtil.fetchChildren(folderId);
  }

  private static async fetchChildren(folderId: string): Promise<DriveFile[]> {
    const token = await GoogleTokenUtil.getToken();
    if (!token) throw new Error('No authentication token available');

    let pageToken: string | null = null;
    const allFiles: DriveFile[] = [];

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append(
        'q',
        `'${folderId}' in parents and trashed=false`,
      );
      url.searchParams.append(
        'fields',
        'nextPageToken,files(id,name,mimeType,size)',
      );
      url.searchParams.append('pageSize', '100');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetchWithCache(
        url.toString(),
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
          },
        },
        60 * 60 * 1000, // cache for 1 hour
      );

      if (!response.ok) {
        console.error('Failed to fetch files:', response.statusText);
        break;
      }

      const data = await response.json();
      const files: DriveFile[] = data.files || [];

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // recurse into subfolder
          await FolderUtil.fetchChildren(file.id);
        } else if (file.mimeType === 'application/epub+zip') {
          allFiles.push(file);
        }
      }

      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allFiles;
  }
}
