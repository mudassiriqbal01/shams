import React, { useState, useCallback, useEffect } from 'react';
import { ColumnDefinition, ColumnType, PermissionType, CreateColumnDto, UpdateColumnDto } from '@shams-vision/shared';
import './ColumnConfigPanel.css';

interface ColumnConfigPanelProps {
  columns: ColumnDefinition[];
  onAddColumn: (column: CreateColumnDto) => void;
  onUpdateColumn: (columnId: string, updates: UpdateColumnDto) => void;
  onDeleteColumn: (columnId: string) => void;
  onReorderColumns: (columns: ColumnDefinition[]) => void;
  userPermissions: PermissionType[];
  disabled?: boolean;
}

export const ColumnConfigPanel: React.FC<ColumnConfigPanelProps> = ({
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onReorderColumns,
  userPermissions,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnDefinition | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Check if user can edit schema
  const canEditSchema = userPermissions.includes(PermissionType.CAN_EDIT_SCHEMA);
  const [newColumn, setNewColumn] = useState<CreateColumnDto>({
    name: '',
    field: '',
    type: ColumnType.TEXT,
    order: columns.length,
  });

  const hasPermission = useCallback((permission: PermissionType, column?: ColumnDefinition): boolean => {
    if (permission === PermissionType.CAN_EDIT_SCHEMA) {
      return canEditSchema;
    }
    
    if (column?.permissions) {
      switch (permission) {
        case PermissionType.CAN_VIEW:
          return !column.permissions.view || column.permissions.view.some(p => userPermissions.includes(p));
        case PermissionType.CAN_EDIT_ROWS:
          return !column.permissions.edit || column.permissions.edit.some(p => userPermissions.includes(p));
        case PermissionType.CAN_EXPORT:
          return !column.permissions.export || column.permissions.export.some(p => userPermissions.includes(p));
        default:
          return true;
      }
    }
    
    return userPermissions.includes(permission);
  }, [userPermissions, canEditSchema]);

  const handleAddColumn = useCallback(() => {
    if (!newColumn.name || !newColumn.field) return;

    onAddColumn(newColumn);
    setNewColumn({
      name: '',
      field: '',
      type: ColumnType.TEXT,
      order: columns.length,
    });
    setShowAddForm(false);
  }, [newColumn, columns.length, onAddColumn]);

  const handleUpdateColumn = useCallback((columnId: string, field: string, value: any) => {
    if (!hasPermission(PermissionType.CAN_EDIT_SCHEMA)) return;

    const column = columns.find(col => col.id === columnId);
    if (!column) return;

    const updates: any = { [field]: value };
    
    if (field === 'name' || field === 'field') {
      updates.version = column.version || 1;
    }

    onUpdateColumn(columnId, updates);
  }, [columns, hasPermission, onUpdateColumn]);

  const handleDeleteColumn = useCallback((columnId: string) => {
    if (!hasPermission(PermissionType.CAN_EDIT_SCHEMA)) return;
    
    if (window.confirm('Are you sure you want to delete this column?')) {
      onDeleteColumn(columnId);
    }
  }, [hasPermission, onDeleteColumn]);

  const moveColumn = useCallback((columnId: string, direction: 'up' | 'down') => {
    if (!hasPermission(PermissionType.CAN_EDIT_SCHEMA)) return;

    const columnIndex = columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) return;

    const newIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(columnIndex, 1);
    newColumns.splice(newIndex, 0, movedColumn);
    
    // Update order values
    const reorderedColumns = newColumns.map((col, index) => ({
      ...col,
      order: index,
    }));

    onReorderColumns(reorderedColumns);
  }, [columns, hasPermission, onReorderColumns]);

  if (!canEditSchema) {
    return null;
  }

  return (
    <>
      <button 
        className="column-config-toggle"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {isOpen ? 'Hide' : 'Show'} Column Configuration
      </button>

      {isOpen && (
        <div className="column-config-panel">
          <div className="config-panel-header">
            <h3>Column Configuration</h3>
            <button 
              className="add-column-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              Add Column
            </button>
          </div>

          {showAddForm && (
            <div className="add-column-form">
              <div className="form-row">
                <label>Column Name:</label>
                <input
                  type="text"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Display name"
                />
              </div>
              <div className="form-row">
                <label>Field Name:</label>
                <input
                  type="text"
                  value={newColumn.field}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, field: e.target.value }))}
                  placeholder="Internal field name"
                />
              </div>
              <div className="form-row">
                <label>Column Type:</label>
                <select
                  value={newColumn.type}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value as ColumnType }))}
                >
                  {Object.values(ColumnType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button onClick={handleAddColumn} disabled={!newColumn.name || !newColumn.field}>
                  Add Column
                </button>
                <button onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="columns-list">
            <h4>Existing Columns ({columns.length})</h4>
            {columns.length === 0 ? (
              <p className="no-columns">No columns configured</p>
            ) : (
              <div className="columns-grid">
                {columns.map((column) => (
                  <div key={column.id} className="column-item">
                    <div className="column-header">
                      <span className="column-name">{column.name}</span>
                      <div className="column-actions">
                        <button 
                          onClick={() => moveColumn(column.id, 'up')}
                          disabled={column.order === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveColumn(column.id, 'down')}
                          disabled={column.order === columns.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => handleDeleteColumn(column.id)}
                          className="delete-btn"
                          title="Delete column"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="column-details">
                      <div className="detail-row">
                        <label>Type:</label>
                        <span>{column.type}</span>
                      </div>
                      <div className="detail-row">
                        <label>Field:</label>
                        <span>{column.field}</span>
                      </div>
                      <div className="detail-row">
                        <label>Width:</label>
                        <span>{column.width || 'Auto'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Required:</label>
                        <span>{column.required ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {/* Permission Settings */}
                    <div className="permission-settings">
                      <h5>Permissions</h5>
                      <div className="permission-checkboxes">
                        <label>
                          <input
                            type="checkbox"
                            checked={hasPermission(PermissionType.CAN_VIEW, column)}
                            disabled={!canEditSchema}
                            onChange={() => {}}
                          />
                          View
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={hasPermission(PermissionType.CAN_EDIT_ROWS, column)}
                            disabled={!canEditSchema}
                            onChange={() => {}}
                          />
                          Edit
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={hasPermission(PermissionType.CAN_EXPORT, column)}
                            disabled={!canEditSchema}
                            onChange={() => {}}
                          />
                          Export
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};