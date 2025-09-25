import { ThemeProvider } from '@/components/ThemeProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AppContent } from './context/AppContent';
import { LoadingProvider } from './context/LoadingContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter basename="/epub-bookshelf">
        <LoadingProvider>
          <LoadingOverlay />
          <GoogleOAuthProvider clientId={CLIENT_ID}>
            <AppContent />
          </GoogleOAuthProvider>
        </LoadingProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
