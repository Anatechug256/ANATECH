import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { offlineSyncService } from './services/offlineSyncService';

// Initialize Service Worker for offline asset & data caching
offlineSyncService.registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
