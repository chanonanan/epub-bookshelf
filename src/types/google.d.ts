declare global {
  interface GooglePickerAction {
    PICKED: 'picked';
  }

  interface GoogleDocsView {
    setIncludeFolders: (include: boolean) => GoogleDocsView;
    setMimeTypes: (mimeTypes: string) => GoogleDocsView;
    setSelectFolderEnabled: (enabled: boolean) => GoogleDocsView;
  }

  interface GooglePickerBuilder {
    addView: (view: GoogleDocsView) => GooglePickerBuilder;
    setOAuthToken: (token: string) => GooglePickerBuilder;
    setDeveloperKey: (key: string) => GooglePickerBuilder;
    setCallback: (
      callback: (data: GooglePickerResponse) => void,
    ) => GooglePickerBuilder;
    build: () => GooglePicker;
  }

  interface GooglePicker {
    setVisible: (visible: boolean) => void;
  }

  interface GooglePickerResponse {
    action: string;
    docs?: Array<{
      id: string;
      name: string;
    }>;
  }

  interface GooglePickerNamespace {
    DocsView: new () => GoogleDocsView;
    PickerBuilder: new () => GooglePickerBuilder;
    Action: GooglePickerAction;
  }

  interface GoogleTokens {
    access_token: string;
    expires_at: number;
  }

  interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size: string;
  }

  interface TokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
  }

  interface GoogleIdentityServices {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: TokenResponse) => void;
          prompt?: string;
          auto_select?: boolean;
          ux_mode?: 'popup' | 'redirect';
          redirect_uri?: string;
        }): {
          requestAccessToken(): void;
          callback: (response: TokenResponse) => void;
        };
      };
    };
  }

  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      picker: GooglePickerNamespace;
    } & GoogleIdentityServices;
  }
}

export {};
