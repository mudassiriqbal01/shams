// Types and constants shared across the platform

export enum PermissionType {
  CAN_VIEW = 'CAN_VIEW',
  CAN_EDIT_ROWS = 'CAN_EDIT_ROWS',
  CAN_EDIT_SCHEMA = 'CAN_EDIT_SCHEMA',
  CAN_EXPORT = 'CAN_EXPORT',
  ROW_LEVEL_SECURITY = 'ROW_LEVEL_SECURITY',
}

export interface JwtPayload {
  userId: string;
  email: string;
  activeDepartmentId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  activeDepartmentId: string;
  departments: DepartmentDto[];
}

export interface DepartmentDto {
  id: string;
  name: string;
  description?: string;
}

export interface ModuleDto {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ModulePermissionDto {
  id: string;
  moduleId: string;
  roleId: string;
  permissions: PermissionType[];
}

export interface RoleDto {
  id: string;
  name: string;
  departmentId: string;
  permissions: PermissionType[];
}

export interface AuditLogDto {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  departmentId: string;
  changes: Record<string, unknown>;
  createdAt: Date;
}

// Grid and Column Management Types
export enum ColumnType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  EMAIL = 'EMAIL',
  URL = 'URL',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
}

export interface ColumnDefinition {
  id: string;
  name: string;
  field: string;
  type: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: 'left' | 'right' | null;
  editable?: boolean;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ label: string; value: unknown }>;
  permissions?: {
    view?: PermissionType[];
    edit?: PermissionType[];
    export?: PermissionType[];
  };
  order: number;
  hidden?: boolean;
  headerName?: string;
  description?: string;
}

export interface CreateColumnDto {
  name: string;
  field: string;
  type: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: 'left' | 'right' | null;
  editable?: boolean;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ label: string; value: unknown }>;
  permissions?: {
    view?: PermissionType[];
    edit?: PermissionType[];
    export?: PermissionType[];
  };
  order: number;
  hidden?: boolean;
  headerName?: string;
  description?: string;
}

export interface UpdateColumnDto {
  name?: string;
  field?: string;
  type?: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  pinned?: 'left' | 'right' | null;
  editable?: boolean;
  required?: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{ label: string; value: unknown }>;
  permissions?: {
    view?: PermissionType[];
    edit?: PermissionType[];
    export?: PermissionType[];
  };
  order?: number;
  hidden?: boolean;
  headerName?: string;
  description?: string;
  version?: number;
}

export interface GridData {
  [key: string]: unknown;
}

export interface GridRow {
  id: string;
  data: GridData;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridColumnConfig {
  columns: ColumnDefinition[];
  version: number;
  lastModified: Date;
}

export interface GridSettings {
  pagination?: boolean;
  pageSize?: number;
  serverSidePagination?: boolean;
  virtualScrolling?: boolean;
  rowBuffer?: number;
  rowHeight?: number;
  headerHeight?: number;
  theme?: 'light' | 'dark';
  showRowNumbers?: boolean;
  allowColumnReorder?: boolean;
  allowColumnResize?: boolean;
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
}

export interface ModuleGridDto extends ModuleDto {
  gridConfig?: GridColumnConfig;
  gridSettings?: GridSettings;
  rowCount?: number;
}

export class ConflictError extends Error {
  constructor(public readonly entity: string, public readonly version: number) {
    super(`Conflict on ${entity}. Current version: ${version}`);
    this.name = 'ConflictError';
  }
}
