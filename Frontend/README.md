## Authentication (Clerk Integration)

Follow the official Clerk React Quickstart: https://clerk.com/docs/quickstarts/react

1. Install dependency:
	 ```bash
	 npm install @clerk/clerk-react@latest
	 ```
2. Create `Frontend/.env.local` (this file is gitignored) and add:
	 ```bash
	 VITE_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
	 ```
3. Ensure `main.tsx` wraps the app:
	 ```tsx
	 import { StrictMode } from 'react';
	 import { createRoot } from 'react-dom/client';
	 import App from './App';
	 import { ClerkProvider } from '@clerk/clerk-react';

	 const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
	 if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk Publishable Key');

	 createRoot(document.getElementById('root')!).render(
		 <StrictMode>
			 <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
				 <App />
			 </ClerkProvider>
		 </StrictMode>
	 );
	 ```
4. Example usage in a component:
	 ```tsx
	 import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

	 export function AuthHeader() {
		 return (
			 <header>
				 <SignedOut>
					 <SignInButton />
					 <SignUpButton />
				 </SignedOut>
				 <SignedIn>
					 <UserButton afterSignOutUrl="/" />
				 </SignedIn>
			 </header>
		 );
	 }
	 ```

Do not commit real API keys. Use only the `VITE_CLERK_PUBLISHABLE_KEY` variable with a placeholder in tracked code.
