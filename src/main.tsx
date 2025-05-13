import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';
// Import our custom wallet adapter style overrides
import './styles/wallet-adapter-override.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
