import { useLoading } from '@/hooks/useLoading';

export const LoadingOverlay = () => {
  const { loading, message } = useLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/65 z-[9999]">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {/* Message */}
        {message && <p className="text-white text-lg">{message}</p>}
      </div>
    </div>
  );
};
