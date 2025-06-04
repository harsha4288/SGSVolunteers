import { describe, it, expect, vi } from 'vitest';
import {
  checkAccess,
  assignVolunteerToTask,
  removeVolunteerAssignment,
  updateCheckInStatus,
  fetchVolunteers,
} from '../actions';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerActionClient } from '@/lib/supabase/server-actions';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock @/lib/supabase/server-actions
vi.mock('@/lib/supabase/server-actions', () => ({
  createSupabaseServerActionClient: vi.fn(),
}));

describe('Assignments Actions', () => {
  describe('checkAccess', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (createSupabaseServerActionClient as vi.Mock).mockReturnValue(mockSupabase);
    });

    it('should allow access for admin role', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'admin' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ success: true });
      expect(mockSupabase.from).toHaveBeenCalledWith('user_roles');
      expect(mockSupabase.select).toHaveBeenCalledWith('role');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', undefined); // Assuming getSessionUser fails to get user
    });

    it('should allow access for event_manager role', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'event_manager' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ success: true });
    });

    it('should deny access for volunteer role', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'volunteer' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should deny access if no roles are found', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should return an error if there is a database error', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
      const result = await checkAccess();
      expect(result).toEqual({ error: 'Database error' });
    });

     it('should allow access if one of the roles is admin', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'volunteer' }, { role: 'admin' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ success: true });
    });

    it('should allow access if one of the roles is event_manager', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'volunteer' }, { role: 'event_manager' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ success: true });
    });

    it('should deny access if roles are volunteer and other non-privileged', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: 'volunteer' }, { role: 'another_role' }], error: null });
      const result = await checkAccess();
      expect(result).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('assignVolunteerToTask', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    const volunteerId = 'user-123';
    const taskId = 'task-abc';

    beforeEach(() => {
      vi.clearAllMocks();
      (createSupabaseServerActionClient as vi.Mock).mockReturnValue(mockSupabase);
      // Default to authorized access for these tests, can be overridden per test
      vi.mocked(checkAccess).mockResolvedValue({ success: true });
    });

    it('should return error if access is denied', async () => {
      vi.mocked(checkAccess).mockResolvedValueOnce({ error: 'Unauthorized' });
      const result = await assignVolunteerToTask(volunteerId, taskId);
      expect(result).toEqual({ error: 'Unauthorized' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should create a new assignment if one does not exist', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // No existing assignment
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await assignVolunteerToTask(volunteerId, taskId);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', volunteerId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('task_id', taskId);
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ user_id: volunteerId, task_id: taskId, status: 'Pending' }]);
      expect(revalidatePath).toHaveBeenCalledWith('/assignments');
      expect(result).toEqual({ success: true });
    });

    it('should update an existing assignment if one exists', async () => {
      const existingAssignmentId = 'assign-789';
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: existingAssignmentId }], error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: null });

      const result = await assignVolunteerToTask(volunteerId, taskId);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'Pending', task_id: taskId }); // task_id is updated too
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', existingAssignmentId);
      expect(revalidatePath).toHaveBeenCalledWith('/assignments');
      expect(result).toEqual({ success: true });
    });

    it('should return error if database select fails', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: 'DB select error' } });
      const result = await assignVolunteerToTask(volunteerId, taskId);
      expect(result).toEqual({ error: 'DB select error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if database insert fails', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // No existing assignment
      mockSupabase.insert.mockResolvedValueOnce({ error: { message: 'DB insert error' } });
      const result = await assignVolunteerToTask(volunteerId, taskId);
      expect(result).toEqual({ error: 'DB insert error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if database update fails', async () => {
      const existingAssignmentId = 'assign-789';
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: existingAssignmentId }], error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: { message: 'DB update error' } });
      const result = await assignVolunteerToTask(volunteerId, taskId);
      expect(result).toEqual({ error: 'DB update error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('removeVolunteerAssignment', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn(),
    };
    const assignmentId = 'assign-456';

    beforeEach(() => {
      vi.clearAllMocks();
      (createSupabaseServerActionClient as vi.Mock).mockReturnValue(mockSupabase);
      vi.mocked(checkAccess).mockResolvedValue({ success: true }); // Default to authorized
    });

    it('should return error if access is denied', async () => {
      vi.mocked(checkAccess).mockResolvedValueOnce({ error: 'Unauthorized' });
      const result = await removeVolunteerAssignment(assignmentId);
      expect(result).toEqual({ error: 'Unauthorized' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should successfully remove an assignment', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null }); // delete().eq() promise

      const result = await removeVolunteerAssignment(assignmentId);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('assignments');
      expect(mockSupabase.delete).toHaveBeenCalledTimes(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', assignmentId);
      expect(revalidatePath).toHaveBeenCalledWith('/assignments');
      expect(result).toEqual({ success: true });
    });

    it('should return error if database delete fails', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: { message: 'DB delete error' } });
      const result = await removeVolunteerAssignment(assignmentId);
      expect(result).toEqual({ error: 'DB delete error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('updateCheckInStatus', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    const assignmentId = 'assign-789';
    const checkedIn = true;

    beforeEach(() => {
      vi.clearAllMocks();
      (createSupabaseServerActionClient as vi.Mock).mockReturnValue(mockSupabase);
      vi.mocked(checkAccess).mockResolvedValue({ success: true }); // Default to authorized
    });

    it('should return error if access is denied', async () => {
      vi.mocked(checkAccess).mockResolvedValueOnce({ error: 'Unauthorized' });
      const result = await updateCheckInStatus(assignmentId, checkedIn);
      expect(result).toEqual({ error: 'Unauthorized' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should create a new check-in if one does not exist', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // No existing check-in
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await updateCheckInStatus(assignmentId, checkedIn);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('check_ins');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('assignment_id', assignmentId);
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ assignment_id: assignmentId, checked_in: checkedIn }]);
      expect(revalidatePath).toHaveBeenCalledWith('/assignments');
      expect(result).toEqual({ success: true });
    });

    it('should update an existing check-in if one exists', async () => {
      const existingCheckInId = 'checkin-xyz';
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: existingCheckInId }], error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: null });

      const result = await updateCheckInStatus(assignmentId, checkedIn);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('check_ins'); // Called for select
      expect(mockSupabase.from).toHaveBeenCalledWith('check_ins'); // Called for update
      expect(mockSupabase.update).toHaveBeenCalledWith({ checked_in: checkedIn });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', existingCheckInId); // For the update's eq
      expect(revalidatePath).toHaveBeenCalledWith('/assignments');
      expect(result).toEqual({ success: true });
    });

    it('should return error if database select fails', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: null, error: { message: 'DB select error' } });
      const result = await updateCheckInStatus(assignmentId, checkedIn);
      expect(result).toEqual({ error: 'DB select error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if database insert fails', async () => {
      mockSupabase.select.mockResolvedValueOnce({ data: [], error: null }); // No existing check-in
      mockSupabase.insert.mockResolvedValueOnce({ error: { message: 'DB insert error' } });
      const result = await updateCheckInStatus(assignmentId, checkedIn);
      expect(result).toEqual({ error: 'DB insert error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return error if database update fails', async () => {
      const existingCheckInId = 'checkin-xyz';
      mockSupabase.select.mockResolvedValueOnce({ data: [{ id: existingCheckInId }], error: null });
      mockSupabase.update.mockResolvedValueOnce({ error: { message: 'DB update error' } });
      const result = await updateCheckInStatus(assignmentId, checkedIn);
      expect(result).toEqual({ error: 'DB update error' });
      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('fetchVolunteers', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (createSupabaseServerActionClient as vi.Mock).mockReturnValue(mockSupabase);
      vi.mocked(checkAccess).mockResolvedValue({ success: true }); // Default to authorized
    });

    it('should return error if access is denied', async () => {
      vi.mocked(checkAccess).mockResolvedValueOnce({ error: 'Unauthorized' });
      const result = await fetchVolunteers('test');
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should fetch volunteers with a search query', async () => {
      const mockVolunteers = [{ id: '1', name: 'Test Volunteer' }];
      mockSupabase.order.mockResolvedValueOnce({ data: mockVolunteers, error: null });
      const searchQuery = 'Test';

      const result = await fetchVolunteers(searchQuery);

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id, name:full_name, email'));
      expect(mockSupabase.or).toHaveBeenCalledWith(
        `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
      );
      expect(mockSupabase.order).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(result).toEqual({ success: true, data: mockVolunteers });
    });

    it('should fetch volunteers without a search query', async () => {
      const mockVolunteers = [{ id: '2', name: 'Another Volunteer' }];
      mockSupabase.order.mockResolvedValueOnce({ data: mockVolunteers, error: null });

      const result = await fetchVolunteers(''); // Empty search query

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id, name:full_name, email'));
      expect(mockSupabase.or).not.toHaveBeenCalled();
      expect(mockSupabase.order).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(result).toEqual({ success: true, data: mockVolunteers });
    });

    it('should fetch volunteers without a search query when query is null', async () => {
      const mockVolunteers = [{ id: '2', name: 'Another Volunteer' }];
      mockSupabase.order.mockResolvedValueOnce({ data: mockVolunteers, error: null });

      const result = await fetchVolunteers(null); // null search query

      expect(checkAccess).toHaveBeenCalledTimes(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('id, name:full_name, email'));
      expect(mockSupabase.or).not.toHaveBeenCalled();
      expect(mockSupabase.order).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(result).toEqual({ success: true, data: mockVolunteers });
    });


    it('should return error if database fetch fails', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: null, error: { message: 'DB fetch error' } });
      const result = await fetchVolunteers('test');
      expect(result).toEqual({ error: 'DB fetch error' });
    });
  });
});
