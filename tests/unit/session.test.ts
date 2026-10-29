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
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'user', status: 'active', plan_id: 'free' },
              error: null,
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      }),
    } as unknown as Awaited<ReturnType<typeof supabaseServer.createClient>>);

    const user = await getUser();
    expect(user).toMatchObject({
      id: 'usr-1234',
      email: 'creator@anyref.app',
      role: 'user',
      status: 'active',
      plan_id: 'free',
    });

    const requiredUser = await requireUser();
    expect(requiredUser).toMatchObject({
      id: 'usr-1234',
      email: 'creator@anyref.app',
      role: 'user',
      status: 'active',
      plan_id: 'free',
    });
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
