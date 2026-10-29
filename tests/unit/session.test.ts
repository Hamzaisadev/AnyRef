import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireUser, getUser } from '@/services/session';
import { UnauthorizedError } from '@/lib/errors';
import * as supabaseServer from '@/lib/supabaseServer';

describe('Seam 5: Session Service (session.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns user when authenticated session exists', async () => {
    const mockUser = { id: 'usr-1234', email: 'creator@anyref.app' };

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>);

    const user = await getUser();
    expect(user).toEqual(mockUser);

    const requiredUser = await requireUser();
    expect(requiredUser).toEqual(mockUser);
  });

  it('getUser returns null and does not throw when unauthenticated', async () => {
    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' },
        }),
      },
    } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>);

    const user = await getUser();
    expect(user).toBeNull();
  });

  it('requireUser throws UnauthorizedError when unauthenticated', async () => {
    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'No session' },
        }),
      },
    } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>);

    await expect(requireUser()).rejects.toThrow(UnauthorizedError);
  });
});
