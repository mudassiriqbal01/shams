import { useState, useCallback, useEffect } from 'react';
import { api } from '../api';
import { ModuleDto, GridColumnConfig, CreateColumnDto, UpdateColumnDto } from '@shams-vision/shared';

export const useModuleGrid = (module: ModuleDto | null, accessToken: string | null) => {
  const [gridConfig, setGridConfig] = useState<GridColumnConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load column configuration
  const loadColumnConfig = useCallback(async () => {
    if (!module || !accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const config = await api.getColumnConfig(accessToken, module.id);
      setGridConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load column configuration');
    } finally {
      setLoading(false);
    }
  }, [module, accessToken]);

  useEffect(() => {
    loadColumnConfig();
  }, [loadColumnConfig]);

  // Add a new column
  const addColumn = useCallback(async (column: CreateColumnDto) => {
    if (!module || !accessToken) return;

    try {
      const updatedModule = await api.addColumn(accessToken, module.id, column);
      await loadColumnConfig(); // Reload config
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
      throw err;
    }
  }, [module, accessToken, loadColumnConfig]);

  // Update an existing column
  const updateColumn = useCallback(async (columnId: string, updates: UpdateColumnDto) => {
    if (!module || !accessToken) return;

    try {
      const updatedModule = await api.updateColumn(accessToken, module.id, columnId, updates);
      await loadColumnConfig(); // Reload config
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update column');
      throw err;
    }
  }, [module, accessToken, loadColumnConfig]);

  // Remove a column
  const removeColumn = useCallback(async (columnId: string) => {
    if (!module || !accessToken) return;

    try {
      const updatedModule = await api.removeColumn(accessToken, module.id, columnId);
      await loadColumnConfig(); // Reload config
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove column');
      throw err;
    }
  }, [module, accessToken, loadColumnConfig]);

  // Reorder columns
  const reorderColumns = useCallback(async (reorderedColumns: any[]) => {
    if (!module || !accessToken) return;

    try {
      const updates = reorderedColumns.map((column, index) => 
        updateColumn(column.id, { order: index, version: gridConfig?.version || 1 })
      );

      await Promise.all(updates);
      await loadColumnConfig(); // Reload config
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder columns');
      throw err;
    }
  }, [module, accessToken, gridConfig?.version, updateColumn, loadColumnConfig]);

  return {
    gridConfig,
    loading,
    error,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    reloadConfig: loadColumnConfig,
  };
};