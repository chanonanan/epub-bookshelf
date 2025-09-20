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
    setCallback: (callback: (data: GooglePickerResponse) => void) => GooglePickerBuilder;
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