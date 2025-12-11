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

export class ConflictError extends Error {
  constructor(public readonly entity: string, public readonly version: number) {
    super(`Conflict on ${entity}. Current version: ${version}`);
    this.name = 'ConflictError';
  }
}
