import { useRecentFolders } from '@/hooks/useRecentFolders';
import { getTokens } from '@/lib/googleDrive';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const [currentFolderId, setCurrentFolderId] = useState<string>();
  const { currentFolder, addRecentFolder } = useRecentFolders(currentFolderId);
  const { recentFolders } = useRecentFolders(); // Get all recent folders for the dropdown

  // Extract folderId from path
  useEffect(() => {
    // Match both /bookshelf/:folderId and /book/:folderId routes
    const match = location.pathname.match(/\/(bookshelf|book)\/([^\/]+)/);
    setCurrentFolderId(match ? match[2] : undefined);
  }, [location]);

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

  const onFolderSelect = useCallback(
    async (id: string, name: string) => {
      await addRecentFolder(id, name);
      navigate(`/bookshelf/${id}`);
    },
    [navigate],
  );

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
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
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
    }
  }, [isPickerLoaded, onFolderSelect]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant || 'ghost'} className={className}>
          {currentFolder?.name || 'Select Folder'}{' '}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {recentFolders.map((folder) => (
          <DropdownMenuItem
            key={folder.id}
            onClick={() => onFolderSelect(folder.id, folder.name)}
            className="justify-between"
          >
            <span className="truncate">{folder.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(folder.lastUpdate).toLocaleDateString()}
            </span>
          </DropdownMenuItem>
        ))}
        {recentFolders.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={showPicker}>
          Select Another Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FolderPicker;
