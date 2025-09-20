import { type FC, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { BookDetails } from './BookDetails';
import { type BookMetadata } from '../epubUtils';
import { downloadFile } from '../googleDrive';

interface BookDetailsDialogProps {
  book: BookMetadata | null;
  isOpen: boolean;
  onClose: () => void;
  onRead: (bookId: string) => void;
}

export const BookDetailsDialog: FC<BookDetailsDialogProps> = ({
  book,
  isOpen,
  onClose,
  onRead,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!book) return;
    setDownloading(true);
    try {
      // Get the file directly from Google Drive
      await downloadFile(book.id);
    } catch (error) {
      console.error('Failed to download book:', error);
    }
    setDownloading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        {book && (
          <BookDetails
            book={book}
            onRead={() => onRead(book.id)}
            onDownload={handleDownload}
            downloading={downloading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};