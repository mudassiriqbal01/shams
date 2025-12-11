import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModuleGrid } from '../hooks/useModuleGrid';
import { api } from '../api';
import SmartGrid from './SmartGrid';
import { ColumnConfigPanel } from './ColumnConfigPanel';
import { CreateColumnDto, UpdateColumnDto, ColumnDefinition, GridColumnConfig, PermissionType } from '@shams-vision/shared';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const auth = useAuth();
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Mock permissions for demo - in real app, get from user context
  const userPermissions: PermissionType[] = [
    PermissionType.CAN_VIEW,
    PermissionType.CAN_EDIT_ROWS,
    PermissionType.CAN_EDIT_SCHEMA,
    PermissionType.CAN_EXPORT,
    PermissionType.ROW_LEVEL_SECURITY,
  ];

  const gridHook = useModuleGrid(selectedModule, auth.accessToken);

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

  const handleModuleSelect = (module: any) => {
    setSelectedModule(module);
  };

  const handleAddColumn = async (column: CreateColumnDto) => {
    try {
      await gridHook.addColumn(column);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    }
  };

  const handleUpdateColumn = async (columnId: string, updates: UpdateColumnDto) => {
    try {
      await gridHook.updateColumn(columnId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await gridHook.removeColumn(columnId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column');
    }
  };

  const handleReorderColumns = async (columns: ColumnDefinition[]) => {
    try {
      await gridHook.reorderColumns(columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder columns');
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    <div className={`dashboard-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
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
            <div className="section-header">
              <h2>Modules</h2>
              <button onClick={handleToggleTheme} className="theme-toggle">
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
              </button>
            </div>

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
                  <div 
                    key={module.id} 
                    className={`module-card ${selectedModule?.id === module.id ? 'selected' : ''}`}
                    onClick={() => handleModuleSelect(module)}
                  >
                    <h3>{module.name}</h3>
                    {module.description && <p>{module.description}</p>}
                    <small>v{module.version}</small>
                    {selectedModule?.id === module.id && (
                      <div className="selected-indicator">Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedModule && (
            <section className="grid-section">
              <h2>Smart Grid: {selectedModule.name}</h2>
              
              <ColumnConfigPanel
                columns={gridHook.gridConfig?.columns || []}
                onAddColumn={handleAddColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                onReorderColumns={handleReorderColumns}
                userPermissions={userPermissions}
                disabled={gridHook.loading}
              />

              {gridHook.error && <div className="error-message">{gridHook.error}</div>}

              {gridHook.loading ? (
                <p>Loading grid configuration...</p>
              ) : (
                <SmartGrid
                  module={selectedModule}
                  gridConfig={gridHook.gridConfig}
                  user={auth.user}
                  userPermissions={userPermissions}
                  theme={theme}
                  onColumnConfigChanged={gridHook.reloadConfig}
                />
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
