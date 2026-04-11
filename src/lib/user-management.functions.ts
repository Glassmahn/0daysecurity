import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const inviteSchema = z.object({
  email: z.string().email().max(255),
  displayName: z.string().min(1).max(255),
  role: z.enum(['admin', 'analyst', 'auditor', 'viewer']),
});

const deactivateSchema = z.object({
  userId: z.string().uuid(),
});

const reactivateSchema = z.object({
  userId: z.string().uuid(),
});

async function assertAdmin(callerUserId: string) {
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerUserId)
    .maybeSingle();
  if (data?.role !== 'admin') {
    throw new Error('Only admins can manage users');
  }
}

export const inviteUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof inviteSchema>) => inviteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Create user with a random password — they'll reset via email
    const tempPassword = crypto.randomUUID() + 'Aa1!';
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.displayName },
    });

    if (createErr) {
      if (createErr.message?.includes('already been registered')) {
        throw new Error('A user with this email already exists');
      }
      throw new Error(`Failed to create user: ${createErr.message}`);
    }

    if (!newUser?.user) {
      throw new Error('Failed to create user');
    }

    // The handle_new_user trigger creates profile + default 'viewer' role.
    // If requested role differs, update it.
    if (data.role !== 'viewer') {
      await supabaseAdmin
        .from('user_roles')
        .update({ role: data.role })
        .eq('user_id', newUser.user.id);
    }

    // Update display name in profile if trigger used email as fallback
    await supabaseAdmin
      .from('profiles')
      .update({ display_name: data.displayName })
      .eq('user_id', newUser.user.id);

    // Audit log
    await supabaseAdmin.from('audit_logs').insert([{
      action: 'create',
      entity_type: 'user',
      entity_id: newUser.user.id,
      user_id: context.userId,
      details: { email: data.email, role: data.role } as any,
    }]);

    return { success: true, userId: newUser.user.id };
  });

export const deactivateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof deactivateSchema>) => deactivateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    if (data.userId === context.userId) {
      throw new Error('You cannot deactivate your own account');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: '876000h', // ~100 years
    });

    if (error) throw new Error(`Failed to deactivate: ${error.message}`);

    await supabaseAdmin.from('audit_logs').insert([{
      action: 'update',
      entity_type: 'user',
      entity_id: data.userId,
      user_id: context.userId,
      details: { action: 'deactivated' } as any,
    }]);

    return { success: true };
  });

export const reactivateUser = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof reactivateSchema>) => reactivateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: 'none',
    });

    if (error) throw new Error(`Failed to reactivate: ${error.message}`);

    await supabaseAdmin.from('audit_logs').insert([{
      action: 'update',
      entity_type: 'user',
      entity_id: data.userId,
      user_id: context.userId,
      details: { action: 'reactivated' } as any,
    }]);

    return { success: true };
  });

export const listUsers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, display_name, department, job_title');
    const { data: roles } = await supabaseAdmin.from('user_roles').select('user_id, role');

    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
    const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]));

    return users.map(u => ({
      id: u.id,
      email: u.email ?? '',
      displayName: profileMap.get(u.id)?.display_name ?? u.email ?? 'Unknown',
      department: profileMap.get(u.id)?.department ?? null,
      jobTitle: profileMap.get(u.id)?.job_title ?? null,
      role: roleMap.get(u.id) ?? 'viewer',
      status: u.banned_until ? 'deactivated' : (u.email_confirmed_at ? 'active' : 'invited'),
      lastSignIn: u.last_sign_in_at ?? null,
      createdAt: u.created_at,
    }));
  });
