import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import BrowseProjects from './pages/BrowseProjects';
import UploadProject from './pages/UploadProject';
import ProjectDetail from './pages/ProjectDetail';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import { useUser } from '@clerk/clerk-react';

// Redirect root: if signed in -> LandingPage; else -> /sign-in
function RootGate() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null; // could add a spinner
  return isSignedIn ? <LandingPage /> : <Navigate to="/sign-in" replace />;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  return isSignedIn ? children : <Navigate to="/sign-in" replace />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<RootGate />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/browse" element={<BrowseProjects />} />
          <Route path="/upload" element={<ProtectedRoute><UploadProject /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;