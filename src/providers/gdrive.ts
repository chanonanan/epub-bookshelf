import type { File, Folder } from '@/types/models';
import type { StorageProvider } from './storageProvider';

export class GoogleProvider implements StorageProvider {
  private accessToken: string | null = null;

  constructor() {
    window.gapi.load('picker', () => {
      console.log('Picker API loaded successfully');
    });
  }

  getToken(): string | null {
    if (this.accessToken) {
      return this.accessToken;
    }

    const token = localStorage.getItem('google_token');
    const expires_at = localStorage.getItem('google_token_expires_at');
    if (token && expires_at && Date.now() < parseInt(expires_at)) {
      this.accessToken = token;
      return this.accessToken;
    }
    return null;
  }

  setToken(token: string | null, expires_at?: number): void {
    if (!token) {
      this.accessToken = null;
      localStorage.removeItem('google_token');
      localStorage.removeItem('google_token_expires_at');
      return;
    }

    localStorage.setItem('google_token_expires_at', expires_at!.toString());
    localStorage.setItem('google_token', token || '');
    this.accessToken = token;
  }

  async login(): Promise<boolean> {
    // Using Google Identity Services
    return new Promise((resolve) => {
      window.google.accounts.oauth2
        .initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (response) => {
            if (response.access_token) {
              console.log('Google OAuth Response:', response);
              this.setToken(
                response.access_token,
                Date.now() + (response.expires_in || 3600) * 1000,
              );
              resolve(true);
            } else {
              console.error('Google OAuth failed:', response);
              this.setToken(null);
              resolve(false);
            }
          },
          error_callback: (err) => {
            console.error('Google OAuth Error', err);
            resolve(false);
          },
        })
        .requestAccessToken();
    });
  }

  logout(): void {
    this.accessToken = null;
    // Optionally revoke token
  }

  async openPicker(): Promise<Folder | null> {
    return new Promise((resolve) => {
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setSelectFolderEnabled(true);

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(this.accessToken!)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setCallback((data) => {
          if (
            data.docs?.length &&
            data.action === window.google.picker.Action.PICKED
          ) {
            const folder = data.docs[0];
            resolve({
              id: folder.id,
              provider: 'gdrive',
              name: folder.name,
              parentId: folder.parentId,
              cachedAt: Date.now(),
              lastModifiedAt: Date.now(),
              fileIds: [],
            });
          } else if (data.action === window.google.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();

      picker.setVisible(true);
    });
  }

  async listFolders(rootId: string = 'root') {
    let pageToken: string | undefined = undefined;
    let results: any[] = [];

    do {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set(
        'q',
        `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      );
      url.searchParams.set(
        'fields',
        'nextPageToken, files(id, name, mimeType)',
      );
      url.searchParams.set('pageSize', '1000'); // max allowed by Drive API
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), { headers: this.headers() });
      if (!res.ok) throw new Error(`Drive API error: ${res.statusText}`);

      const data = await res.json();
      results = results.concat(data.files ?? []);
      pageToken = data.nextPageToken;
    } while (pageToken);

    return results;
  }

  async listFiles(folderId: string): Promise<File[]> {
    let results: DriveFile[] = await this.getDriveFiles(folderId);

    return results.map((r) => ({
      id: r.id,
      provider: 'gdrive',
      folderId,
      name: r.name,
      mimeType: r.mimeType,
      size: Number(r.size),
      modifiedAt: new Date(r.modifiedTime).getTime(),
      status: 'pending',
    }));
  }

  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: this.headers() },
    );
    return await res.arrayBuffer();
  }

  async uploadFile(
    folderId: string,
    name: string,
    data: Blob | ArrayBuffer,
  ): Promise<void> {
    const metadata = {
      name,
      parents: [folderId],
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', data as Blob);

    await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
        body: form,
      },
    );
  }

  private async getDriveFiles(folderId: string): Promise<DriveFile[]> {
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
        'nextPageToken, files(id,name,mimeType,size,modifiedTime)',
      );
      url.searchParams.append('pageSize', '100');
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), { headers: this.headers() });

      if (!response.ok) {
        console.error('Failed to fetch files:', response.statusText);
        break;
      }

      const data = await response.json();
      const files: DriveFile[] = data.files || [];

      for (const file of files) {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          // recurse into subfolder
          const subFiles = await this.getDriveFiles(file.id);
          allFiles.push(...subFiles);
        } else if (file.mimeType === 'application/epub+zip') {
          allFiles.push(file);
        }
      }

      pageToken = data.nextPageToken || null;
    } while (pageToken);

    return allFiles;
  }

  private headers() {
    return { Authorization: `Bearer ${this.accessToken}` };
  }
}
