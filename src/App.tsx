import { ThemeProvider } from '@/components/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { LoadingOverlay } from './components/LoadingOverlay';
import { AppContent } from './context/AppContent';
import { LoadingProvider } from './context/LoadingContext';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <LoadingProvider>
          <LoadingOverlay />
          <AppContent />
        </LoadingProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
