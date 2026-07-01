import { PermissionService } from './PermissionService';

describe('PermissionService', () => {
  const pendingEvent = { user_id: 'u1', status: 'pending' } as any;
  const approvedEvent = { user_id: 'u1', status: 'approved' } as any;

  it('allows owner to update pending event', async () => {
    const allowed = await PermissionService.canUpdateEvent(pendingEvent, { id: 'u1', role: 'user' } as any);
    expect(allowed).toBe(true);
  });

  it('blocks owner update on approved event', async () => {
    const allowed = await PermissionService.canUpdateEvent(approvedEvent, { id: 'u1', role: 'user' } as any);
    expect(allowed).toBe(false);
  });

  it('allows super_user to delete any event', async () => {
    const allowed = await PermissionService.canDeleteEvent(approvedEvent, { id: 'admin', role: 'super_user' } as any);
    expect(allowed).toBe(true);
  });

  it('resolves curator role hierarchy correctly', () => {
    expect(PermissionService.hasRole({ id: 'u2', role: 'curator' } as any, 'user')).toBe(true);
    expect(PermissionService.hasRole({ id: 'u2', role: 'curator' } as any, 'curator')).toBe(true);
    expect(PermissionService.hasRole({ id: 'u2', role: 'curator' } as any, 'super_user')).toBe(false);
  });
});
