import { AuthResponse, UserDto, CreateColumnDto, UpdateColumnDto, GridColumnConfig } from '@shams-vision/shared';

const API_BASE_URL = 'http://localhost:3000';

export interface ApiError {
  message: string;
  statusCode: number;
}

export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  async register(
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    departmentId: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        password,
        departmentId,
      }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  async switchDepartment(
    accessToken: string,
    departmentId: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/switch-department`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ departmentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to switch department');
    }

    return response.json();
  },

  async getMe(accessToken: string): Promise<UserDto> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  },

  async getModules(accessToken: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch modules');
    }

    return response.json();
  },

  async createModule(
    accessToken: string,
    name: string,
    description: string,
    metadata: Record<string, unknown>,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, description, metadata }),
    });

    if (!response.ok) {
      throw new Error('Failed to create module');
    }

    return response.json();
  },

  // Column management APIs
  async addColumn(
    accessToken: string,
    moduleId: string,
    column: CreateColumnDto,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/columns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(column),
    });

    if (!response.ok) {
      throw new Error('Failed to add column');
    }

    return response.json();
  },

  async updateColumn(
    accessToken: string,
    moduleId: string,
    columnId: string,
    updates: UpdateColumnDto,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/columns/${columnId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update column');
    }

    return response.json();
  },

  async removeColumn(
    accessToken: string,
    moduleId: string,
    columnId: string,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/columns/${columnId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to remove column');
    }

    return response.json();
  },

  async getColumnConfig(
    accessToken: string,
    moduleId: string,
  ): Promise<GridColumnConfig | null> {
    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/columns`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get column configuration');
    }

    return response.json();
  },

  async getModuleData(
    accessToken: string,
    moduleId: string,
    filters?: Record<string, unknown>,
    pagination?: { page: number; size: number },
  ): Promise<{ data: any[]; total: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      params.append('filters', JSON.stringify(filters));
    }
    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('size', pagination.size.toString());
    }

    const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/data?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get module data');
    }

    return response.json();
  },
};
