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

  interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
  }

  interface GoogleToken {
    access_token: string;
    expires_at: number;
    user_info: GoogleUserInfo | null;
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

  interface NonOAuthError {
    /**
     * Some non-OAuth errors, such as the popup window is failed to open;
     * or closed before an OAuth response is returned.
     * https://developers.google.com/identity/oauth2/web/reference/js-reference#TokenClientConfig
     * https://developers.google.com/identity/oauth2/web/reference/js-reference#CodeClientConfig
     */
    type: 'popup_failed_to_open' | 'popup_closed' | 'unknown';
  }

  interface GoogleIdentityServices {
    accounts: {
      oauth2: {
        initTokenClient(config: {
          client_id: string;
          scope: string;
          callback: (response: TokenResponse) => void;
          error_callback?: (error: NonOAuthError) => void;
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
