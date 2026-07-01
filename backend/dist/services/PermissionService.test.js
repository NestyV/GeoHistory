"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PermissionService_1 = require("./PermissionService");
describe('PermissionService', () => {
    const pendingEvent = { user_id: 'u1', status: 'pending' };
    const approvedEvent = { user_id: 'u1', status: 'approved' };
    it('allows owner to update pending event', async () => {
        const allowed = await PermissionService_1.PermissionService.canUpdateEvent(pendingEvent, { id: 'u1', role: 'user' });
        expect(allowed).toBe(true);
    });
    it('blocks owner update on approved event', async () => {
        const allowed = await PermissionService_1.PermissionService.canUpdateEvent(approvedEvent, { id: 'u1', role: 'user' });
        expect(allowed).toBe(false);
    });
    it('allows super_user to delete any event', async () => {
        const allowed = await PermissionService_1.PermissionService.canDeleteEvent(approvedEvent, { id: 'admin', role: 'super_user' });
        expect(allowed).toBe(true);
    });
    it('resolves curator role hierarchy correctly', () => {
        expect(PermissionService_1.PermissionService.hasRole({ id: 'u2', role: 'curator' }, 'user')).toBe(true);
        expect(PermissionService_1.PermissionService.hasRole({ id: 'u2', role: 'curator' }, 'curator')).toBe(true);
        expect(PermissionService_1.PermissionService.hasRole({ id: 'u2', role: 'curator' }, 'super_user')).toBe(false);
    });
});
//# sourceMappingURL=PermissionService.test.js.map