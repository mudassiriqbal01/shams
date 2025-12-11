import { AuthResponse, UserDto } from '@shams-vision/shared';

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
};
