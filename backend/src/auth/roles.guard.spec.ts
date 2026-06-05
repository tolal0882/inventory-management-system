import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

// ── Helpers ───────────────────────────────────────────────────
function makeContext(userRole: string): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass:   () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: userRole } }),
    }),
  } as any;
}

// ── Suite ─────────────────────────────────────────────────────
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required (public route)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(makeContext('Inventory_Staff'))).toBe(true);
  });

  it('allows access when user role is in the required roles list', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin', 'Warehouse_Manager']);

    expect(guard.canActivate(makeContext('Admin'))).toBe(true);
    expect(guard.canActivate(makeContext('Warehouse_Manager'))).toBe(true);
  });

  it('denies access when user role is NOT in the required roles list', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);

    expect(guard.canActivate(makeContext('Inventory_Staff'))).toBe(false);
    expect(guard.canActivate(makeContext('Auditor'))).toBe(false);
  });

  it('denies access when required roles is an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    // No role satisfies empty required-roles list
    expect(guard.canActivate(makeContext('Admin'))).toBe(false);
  });

  it('is case-sensitive for role matching', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']); // lowercase

    expect(guard.canActivate(makeContext('Admin'))).toBe(false); // "Admin" !== "admin"
  });
});
