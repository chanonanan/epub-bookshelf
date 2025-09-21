import { ThemeProvider } from '@/components/ThemeProvider';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import { AppContent } from './AppContent';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
