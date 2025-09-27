import { Link, useLocation } from 'react-router-dom';
import { Code2, Upload, Search } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EngiVerse
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              to="/browse"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive('/browse')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Browse Projects</span>
            </Link>
            
            <Link
              to="/upload"
              className={`flex items-center space-x-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive('/upload')
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Project</span>
            </Link>

            {/* Auth Section */}
            <div className="flex items-center space-x-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-blue-200">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md">Sign Up</button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;