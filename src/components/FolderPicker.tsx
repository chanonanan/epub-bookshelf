import { getTokens } from '@/lib/googleDrive';
import React, { useCallback, useEffect, useState } from 'react';
import '../types/google.d';
import { Button } from './ui/button';

interface FolderPickerProps {
  onFolderSelect: (folderId: string, folderName: string) => void;
  apiKey: string;
}

const getGooglePicker = (): GooglePickerNamespace => {
  // Type assertion to handle the GoogleIdentityServices intersection
  return (window.google as unknown as { picker: GooglePickerNamespace }).picker;
};

const FolderPicker: React.FC<FolderPickerProps> = ({
  onFolderSelect,
  apiKey,
}) => {
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadPicker = useCallback(() => {
    console.log('Attempting to load picker...');
    if (!window.gapi) {
      console.error('Google API client not loaded, waiting...');
      // Try again in 1 second
      setTimeout(loadPicker, 1000);
      return;
    }

    window.gapi.load('picker', () => {
      console.log('Picker API loaded successfully');
      setIsPickerLoaded(true);
    });
  }, []);

  // Load the picker when the component mounts
  useEffect(() => {
    console.log('FolderPicker mounted, initializing...');
    loadPicker();

    // Cleanup function
    return () => {
      console.log('FolderPicker unmounted');
    };
  }, [loadPicker]);

  const showPicker = useCallback(async () => {
    if (!isPickerLoaded) {
      console.error('Picker not loaded yet');
      return;
    }

    setIsLoading(true);
    try {
      // First ensure we have valid tokens
      const tokens = await getTokens();
      if (!tokens) {
        console.error('No access token available');
        return;
      }

      console.log('Got access token, creating picker...', tokens);

      const picker = getGooglePicker();
      if (!picker) {
        console.error('Failed to get picker instance');
        return;
      }

      const view = new picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setSelectFolderEnabled(true);

      console.log('Created picker view, building picker...');

      const pickerInstance = new picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(tokens.access_token)
        .setDeveloperKey(apiKey)
        .setCallback((data: GooglePickerResponse) => {
          console.log('Picker callback:', data);
          if (data.action === picker.Action.PICKED && data.docs?.length) {
            const folder = data.docs[0];
            console.log('Selected folder:', folder);
            onFolderSelect(folder.id, folder.name);
          }
        })
        .build();

      console.log('Showing picker...');
      pickerInstance.setVisible(true);
    } catch (error) {
      console.error('Error showing picker:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isPickerLoaded, onFolderSelect]);

  return (
    <Button
      onClick={showPicker}
      variant="outline"
      disabled={!isPickerLoaded || isLoading}
    >
      {isLoading ? 'Loading...' : 'Select EPUB Folder'}
    </Button>
  );
};

export default FolderPicker;
