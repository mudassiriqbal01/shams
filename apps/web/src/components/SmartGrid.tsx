import React, { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ColumnResizedEvent, SortChangedEvent } from 'ag-grid-community';
import { ModuleDto, ColumnDefinition, GridColumnConfig, PermissionType, UserDto } from '@shams-vision/shared';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import './SmartGrid.css';

interface SmartGridProps {
  module: ModuleDto;
  gridConfig?: GridColumnConfig | null;
  user: UserDto | null;
  userPermissions: PermissionType[];
  onGridReady?: (params: any) => void;
  onColumnResized?: (columnId: string, width: number) => void;
  onSortChanged?: (columnId: string, sort: string) => void;
  onColumnConfigChanged?: () => void;
  theme?: 'light' | 'dark';
}

const SmartGrid: React.FC<SmartGridProps> = ({
  module,
  gridConfig,
  user,
  userPermissions,
  onGridReady,
  onColumnResized,
  onSortChanged,
  onColumnConfigChanged,
  theme = 'dark',
}) => {
  const gridRef = useRef<AgGridReact>(null);

  // Check if user has specific permission for column operations
  const hasPermission = useCallback((permission: PermissionType): boolean => {
    return userPermissions.includes(permission);
  }, [userPermissions]);

  // Filter columns based on user permissions
  const getFilteredColumns = useCallback((columns: ColumnDefinition[]): ColumnDefinition[] => {
    return columns.filter(column => {
      if (!column.permissions?.view) return true;
      return column.permissions.view.some(perm => hasPermission(perm));
    });
  }, [hasPermission]);

  // Convert ColumnDefinition to AG-Grid ColDef
  const createColumnDefs = useCallback((columns: ColumnDefinition[]): ColDef[] => {
    const filteredColumns = getFilteredColumns(columns);
    
    return filteredColumns.map((column): ColDef => ({
      field: column.field,
      headerName: column.headerName || column.name,
      width: column.width,
      minWidth: column.minWidth,
      maxWidth: column.maxWidth,
      resizable: column.resizable && hasPermission(PermissionType.CAN_EDIT_SCHEMA),
      sortable: column.sortable,
      filter: column.filterable,
      pinned: column.pinned,
      editable: column.editable && hasPermission(PermissionType.CAN_EDIT_ROWS),
      hide: column.hidden,
      cellStyle: (params) => {
        // Custom styling based on column type
        switch (column.type) {
          case 'NUMBER':
          case 'CURRENCY':
          case 'PERCENTAGE':
            return { textAlign: 'right' };
          case 'DATE':
            return { textAlign: 'center' };
          default:
            return {};
        }
      },
      valueFormatter: (params) => {
        // Format values based on column type
        if (params.value == null) return '';
        
        switch (column.type) {
          case 'CURRENCY':
            return new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD' 
            }).format(Number(params.value));
          case 'PERCENTAGE':
            return `${params.value}%`;
          case 'DATE':
            return new Date(params.value).toLocaleDateString();
          default:
            return params.value;
        }
      },
    }));
  }, [getFilteredColumns, hasPermission]);

  // Generate mock data for demo - in real app, this would come from API
  const rowData = useMemo(() => {
    if (!gridConfig?.columns) return [];
    
    const columns = getFilteredColumns(gridConfig.columns);
    const dataLength = 50000; // Demo with 50k rows
    
    return Array.from({ length: dataLength }, (_, index) => {
      const row: Record<string, any> = { id: `row-${index}` };
      
      columns.forEach(column => {
        switch (column.type) {
          case 'TEXT':
          case 'EMAIL':
          case 'URL':
            row[column.field] = `${column.field}_value_${index}`;
            break;
          case 'NUMBER':
            row[column.field] = Math.floor(Math.random() * 1000);
            break;
          case 'CURRENCY':
            row[column.field] = Math.random() * 10000;
            break;
          case 'PERCENTAGE':
            row[column.field] = Math.floor(Math.random() * 100);
            break;
          case 'BOOLEAN':
            row[column.field] = Math.random() > 0.5;
            break;
          case 'DATE':
            row[column.field] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
            break;
          case 'SELECT':
            if (column.options?.length) {
              const option = column.options[Math.floor(Math.random() * column.options.length)];
              row[column.field] = option.value;
            }
            break;
          default:
            row[column.field] = `value_${index}`;
        }
      });
      
      return row;
    });
  }, [gridConfig?.columns, getFilteredColumns]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  }), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Configure for 50k rows with smooth scrolling
    const { api } = params;
    
    // Enable server-side pagination if needed
    if (rowData.length > 10000) {
      api.setServerSideDatasource({
        getRows: (request) => {
          // In real implementation, this would make API call
          console.log('Server-side pagination request:', request);
          request.successCallback(rowData, -1);
        }
      });
    }

    // Configure virtualization settings for smooth scrolling
    const cacheOverflowSize = 2;
    const maxConcurrentDatasourceRequests = 2;
    const infiniteInitialRowCount = 1000;
    const cacheBlockSize = 100;
    const maxBlocksInCache = 10;

    api.setGridOption('infiniteInitialRowCount', infiniteInitialRowCount);
    api.setGridOption('cacheBlockSize', cacheBlockSize);
    api.setGridOption('maxBlocksInCache', maxBlocksInCache);

    if (onGridReady) {
      onGridReady(params);
    }
  }, [rowData, onGridReady]);

  const onColumnResized = useCallback((event: ColumnResizedEvent) => {
    if (event.column && event.finished) {
      const columnDef = event.column.getColDef();
      const originalColumn = gridConfig?.columns?.find(col => col.field === columnDef.field);
      
      if (originalColumn && onColumnResized) {
        onColumnResized(originalColumn.id, event.column.getActualWidth());
      }
    }
  }, [gridConfig?.columns, onColumnResized]);

  const onSortChanged = useCallback((event: SortChangedEvent) => {
    const column = event.columnApi.getDisplayNameForColumn(event.column, null);
    const sort = event.columnApi.getColumnState();
    
    if (sort[0] && onSortChanged) {
      onColumnConfigChanged?.();
    }
  }, [onColumnConfigChanged]);

  // Theme-specific class names
  const themeClass = theme === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';

  if (!gridConfig?.columns || gridConfig.columns.length === 0) {
    return (
      <div className="smart-grid-empty">
        <p>No columns configured for this module.</p>
        <p>Add columns to start working with your data.</p>
      </div>
    );
  }

  return (
    <div className={`smart-grid-container ${themeClass}`} style={{ height: '600px', width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={createColumnDefs(gridConfig.columns)}
        defaultColDef={defaultColDef}
        rowData={rowData}
        onGridReady={onGridReady}
        onColumnResized={onColumnResized}
        onSortChanged={onSortChanged}
        
        // Virtual scrolling configuration for 50k rows
        rowBuffer={50}
        rowSelection="multiple"
        animateRows={true}
        pagination={false}
        
        // Performance optimizations
        suppressColumnVirtualisation={false}
        suppressRowClickSelection={true}
        suppressRowHoverHighlight={false}
        
        // Enable export if user has permission
        enableRangeSelection={hasPermission(PermissionType.CAN_EXPORT)}
        
        // Server-side configuration
        serverSideInfiniteScrolling={rowData.length > 10000}
        
        // Dark mode specific styling
        rowClassRules={{
          'row-even': (params) => params.node.rowIndex! % 2 === 0,
          'row-odd': (params) => params.node.rowIndex! % 2 === 1,
        }}
      />
    </div>
  );
};

export default SmartGrid;