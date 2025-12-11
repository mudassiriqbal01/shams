import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const auth = useAuth();
  const [key, setKey] = useState(0);

  const handleLoginSuccess = () => {
    // Force re-render to ensure auth state is properly initialized
    setKey((k) => k + 1);
  };

  return (
    <div className="app" key={key}>
      {!auth.isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;
