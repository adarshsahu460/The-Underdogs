import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

// Retrieve the Clerk publishable key from Vite environment variables.
// Ensure you have defined VITE_CLERK_PUBLISHABLE_KEY in an untracked .env.local file.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
