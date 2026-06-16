import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem('admin_session');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
    
    // Wait for Firebase auth state to resolve
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('admin_session', 'true');
    setIsAuthenticated(true);
    window.history.pushState({}, '', '/admin/dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    setIsAuthenticated(false);
    window.history.pushState({}, '', '/admin');
  };

  if (!authReady) {
    return <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center text-white">Loading Auth...</div>;
  }

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center text-white flex-col gap-4">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-white/50 mb-6 text-sm">Please log into the main Savdolab application first before accessing the Admin Dashboard. Your Firebase Auth session is required.</p>
          <a href="/" className="px-6 py-2.5 bg-[#1497F3] rounded-xl font-bold hover:bg-[#2081C3] transition-colors inline-block">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0D12] text-white">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}
