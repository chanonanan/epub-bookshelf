import { useAuth } from '@/auth/AuthProvider';
import { useFolders } from '@/hooks';
import { FolderUtil } from '@/lib/googleDrive';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../types/google.d';
import { Button, type ButtonProps } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface FolderPickerProps {
  className?: string;
  variant?: ButtonProps['variant'];
}

const getGooglePicker = (): GooglePickerNamespace => {
  // Type assertion to handle the GoogleIdentityServices intersection
  return (window.google as unknown as { picker: GooglePickerNamespace }).picker;
};

const FolderPicker: React.FC<FolderPickerProps> = ({ className, variant }) => {
  const navigate = useNavigate();
  const [isPickerLoaded, setIsPickerLoaded] = useState(false);
  const { allFolders, currentFolder } = useFolders();
  const { token } = useAuth();

  const loadPicker = useCallback(() => {
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

  const onFolderSelect = useCallback(
    async (folder: DriveFile) => {
      await FolderUtil.createFolder(folder);
      navigate(`/bookshelf/${folder.id}`);
    },
    [navigate],
  );

  // Load the picker when the component mounts
  useEffect(() => {
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

    try {
      // First ensure we have valid token
      if (!token) {
        console.error('No access token available');
        return;
      }

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
        .setOAuthToken(token.access_token)
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setCallback((data: GooglePickerResponse) => {
          console.log('Picker callback:', data);
          if (data.action === picker.Action.PICKED && data.docs?.length) {
            const folder = data.docs[0];
            console.log('Selected folder:', folder);
            onFolderSelect(folder);
          }
        })
        .build();

      console.log('Showing picker...');
      pickerInstance.setVisible(true);
    } catch (error) {
      console.error('Error showing picker:', error);
    }
  }, [isPickerLoaded, onFolderSelect, token]);

  return (
    <>
      {allFolders.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant || 'ghost'} className={className}>
              {currentFolder?.name || 'Select Folder'}{' '}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            {allFolders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onFolderSelect(folder)}
                className="justify-between"
              >
                <span className="truncate">{folder.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(folder.lastUpdate).toLocaleDateString()}
                </span>
              </DropdownMenuItem>
            ))}
            {allFolders.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={showPicker}>
              Select Another Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant={variant || 'ghost'}
          className={className}
          onClick={showPicker}
        >
          Select Folder
        </Button>
      )}
    </>
  );
};

export default FolderPicker;
