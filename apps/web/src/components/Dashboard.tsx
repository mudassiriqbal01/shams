import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newModuleName, setNewModuleName] = useState('');

  useEffect(() => {
    if (auth.accessToken) {
      loadModules();
    }
  }, [auth.accessToken, auth.user?.activeDepartmentId]);

  const loadModules = async () => {
    setLoading(true);
    setError(null);
    try {
      if (auth.accessToken) {
        const data = await api.getModules(auth.accessToken);
        setModules(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim() || !auth.accessToken) return;

    try {
      const newModule = await api.createModule(auth.accessToken, newModuleName, '', {});
      setModules([newModule, ...modules]);
      setNewModuleName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module');
    }
  };

  const handleSwitchDepartment = async (deptId: string) => {
    try {
      await auth.switchDepartment(deptId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch department');
    }
  };

  if (!auth.isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Shams Vision</h1>
          <p>Core Platform</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <p>
              {auth.user?.firstName} {auth.user?.lastName}
            </p>
            <small>{auth.user?.email}</small>
          </div>
          <button onClick={auth.logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          <h3>Departments</h3>
          <ul>
            {auth.user?.departments.map((dept) => (
              <li
                key={dept.id}
                className={auth.user?.activeDepartmentId === dept.id ? 'active' : ''}
                onClick={() => handleSwitchDepartment(dept.id)}
              >
                {dept.name}
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-content">
          <section className="modules-section">
            <h2>Modules</h2>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCreateModule} className="create-module-form">
              <input
                type="text"
                placeholder="Module name"
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newModuleName.trim()}>
                Create Module
              </button>
            </form>

            {loading ? (
              <p>Loading modules...</p>
            ) : modules.length === 0 ? (
              <p>No modules yet. Create one to get started!</p>
            ) : (
              <div className="modules-grid">
                {modules.map((module) => (
                  <div key={module.id} className="module-card">
                    <h3>{module.name}</h3>
                    {module.description && <p>{module.description}</p>}
                    <small>v{module.version}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
