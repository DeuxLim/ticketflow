import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';

const clearAuthToken = vi.fn();
const getAuthToken = vi.fn(() => null);

vi.mock('@/lib/auth-session', () => ({
  clearAuthToken: () => clearAuthToken(),
  getAuthToken: () => getAuthToken(),
}));

describe('apiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces backend field errors through ApiError', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: 'Validation failed.',
        errors: {
          title: ['The title field is required.'],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      await apiRequest('/workspaces/acme/tickets', { method: 'POST', body: JSON.stringify({}) });
      throw new Error('Expected apiRequest to throw.');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(422);
      expect(apiError.message).toBe('Validation failed.');
      expect(apiError.fieldErrors.title?.[0]).toBe('The title field is required.');
    }
  });

  it('clears auth token on unauthorized response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(clearAuthToken).toHaveBeenCalledTimes(1);
  });
});
