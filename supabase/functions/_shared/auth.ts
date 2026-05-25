import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, errorResponse } from './cors.ts';

export interface AuthResult {
  user?: { id: string; email?: string };
  isServiceRole: boolean;
}

export async function authenticateRequest(
  req: Request,
  supabaseUrl: string,
  supabaseAnonKey: string,
  serviceRoleKey: string,
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get('Authorization') ?? '';

  if (!authHeader) {
    return errorResponse('Missing Authorization header', 401);
  }

  if (authHeader === `Bearer ${serviceRoleKey}`) {
    return { isServiceRole: true };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw error ?? new Error('No user');
    return { user: { id: data.user.id, email: data.user.email }, isServiceRole: false };
  } catch {
    return errorResponse('Unauthorized', 401);
  }
}

export function requireServiceRole(result: AuthResult | Response): Response | AuthResult {
  if (result instanceof Response) return result;
  if (!result.isServiceRole) {
    return errorResponse('Forbidden', 403);
  }
  return result;
}

export async function requireRole(
  result: AuthResult | Response,
  allowedRoles: string[],
  supabaseUrl?: string,
  supabaseServiceKey?: string,
): Promise<Response | AuthResult> {
  if (result instanceof Response) return result;
  if (result.isServiceRole) return result;
  if (!result.user || !supabaseUrl || !supabaseServiceKey) {
    return result;
  }
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', result.user.id);
    if (error) throw error;
    const userRoles = (roles ?? []).map((r: { role: string }) => r.role);
    const hasRole = allowedRoles.some(r => userRoles.includes(r));
    if (!hasRole) {
      return errorResponse('Forbidden: insufficient role', 403);
    }
    return result;
  } catch {
    return errorResponse('Forbidden', 403);
  }
}
