import { type FC } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { Reader } from './Reader';

interface ReaderDialogProps {
  bookId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReaderDialog: FC<ReaderDialogProps> = ({
  bookId,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl max-h-[90vh] h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <div className="flex justify-end p-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Reader bookId={bookId} onClose={onClose} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};