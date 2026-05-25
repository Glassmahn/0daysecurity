import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/functions/v1/scim-v2', '');

    const db = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return scimError(401, 'Missing authorization header');
    }

    const { data: config } = await db.from('sso_configurations').select('*').eq('status', 'active').maybeSingle();
    if (!config) {
      return scimError(401, 'No active SSO configuration');
    }

    // ── /Schemas ────────────────────────────────────────────────
    if (path === '/Schemas' && req.method === 'GET') {
      return scimJson({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 3,
        Resources: [
          {
            id: 'urn:ietf:params:scim:schemas:core:2.0:User',
            name: 'User',
            description: 'User Account',
            attributes: [
              { name: 'userName', type: 'string', multiValued: false, required: true, caseExact: false, mutability: 'readWrite', returned: 'default', uniqueness: 'server' },
              { name: 'name', type: 'complex', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
              { name: 'title', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
              { name: 'active', type: 'boolean', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
              { name: 'emails', type: 'complex', multiValued: true, required: false, mutability: 'readWrite', returned: 'default' },
            ],
            meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User` },
          },
          {
            id: 'urn:ietf:params:scim:schemas:core:2.0:Group',
            name: 'Group',
            description: 'Group',
            attributes: [
              { name: 'displayName', type: 'string', multiValued: false, required: true, caseExact: false, mutability: 'readWrite', returned: 'default' },
              { name: 'members', type: 'complex', multiValued: true, required: false, mutability: 'readWrite', returned: 'default' },
            ],
            meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group` },
          },
          {
            id: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig',
            name: 'ServiceProviderConfig',
            description: 'Service Provider Configuration',
            attributes: [],
            meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig` },
          },
        ],
      });
    }

    // ── /Schemas/{id} ───────────────────────────────────────────
    if (path.startsWith('/Schemas/') && req.method === 'GET') {
      const schemaId = decodeURIComponent(path.split('/')[2]);
      const schemaMap: Record<string, unknown> = {
        'urn:ietf:params:scim:schemas:core:2.0:User': {
          id: 'urn:ietf:params:scim:schemas:core:2.0:User', name: 'User', description: 'User Account',
          attributes: [
            { name: 'userName', type: 'string', multiValued: false, required: true, caseExact: false, mutability: 'readWrite', returned: 'default', uniqueness: 'server' },
            { name: 'name', type: 'complex', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
            { name: 'title', type: 'string', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
            { name: 'active', type: 'boolean', multiValued: false, required: false, mutability: 'readWrite', returned: 'default' },
            { name: 'emails', type: 'complex', multiValued: true, required: false, mutability: 'readWrite', returned: 'default' },
          ],
          meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User` },
        },
        'urn:ietf:params:scim:schemas:core:2.0:Group': {
          id: 'urn:ietf:params:scim:schemas:core:2.0:Group', name: 'Group', description: 'Group',
          attributes: [
            { name: 'displayName', type: 'string', multiValued: false, required: true, caseExact: false, mutability: 'readWrite', returned: 'default' },
            { name: 'members', type: 'complex', multiValued: true, required: false, mutability: 'readWrite', returned: 'default' },
          ],
          meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group` },
        },
        'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig': {
          id: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig', name: 'ServiceProviderConfig', description: 'Service Provider Configuration',
          attributes: [],
          meta: { resourceType: 'Schema', location: `${url.origin}/functions/v1/scim-v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig` },
        },
      };
      const schema = schemaMap[schemaId];
      if (!schema) return scimError(404, 'Schema not found');
      return scimJson({ schemas: [schemaId], ...schema as Record<string, unknown> });
    }

    // ── /ResourceTypes ──────────────────────────────────────────
    if (path === '/ResourceTypes' && req.method === 'GET') {
      return scimJson({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: 3,
        Resources: [
          {
            id: 'User', name: 'User', endpoint: '/Users',
            schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
            schemaExtensions: [],
            meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/User` },
          },
          {
            id: 'Group', name: 'Group', endpoint: '/Groups',
            schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
            schemaExtensions: [],
            meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/Group` },
          },
          {
            id: 'ServiceProviderConfig', name: 'ServiceProviderConfig', endpoint: '/ServiceProviderConfig',
            schema: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig',
            schemaExtensions: [],
            meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/ServiceProviderConfig` },
          },
        ],
      });
    }

    // ── /ResourceTypes/{id} ─────────────────────────────────────
    if (path.startsWith('/ResourceTypes/') && req.method === 'GET') {
      const rtId = path.split('/')[2];
      const rtMap: Record<string, unknown> = {
        User: {
          id: 'User', name: 'User', endpoint: '/Users',
          schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
          schemaExtensions: [],
          meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/User` },
        },
        Group: {
          id: 'Group', name: 'Group', endpoint: '/Groups',
          schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
          schemaExtensions: [],
          meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/Group` },
        },
        ServiceProviderConfig: {
          id: 'ServiceProviderConfig', name: 'ServiceProviderConfig', endpoint: '/ServiceProviderConfig',
          schema: 'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig',
          schemaExtensions: [],
          meta: { resourceType: 'ResourceType', location: `${url.origin}/functions/v1/scim-v2/ResourceTypes/ServiceProviderConfig` },
        },
      };
      const rt = rtMap[rtId];
      if (!rt) return scimError(404, 'ResourceType not found');
      return scimJson({ schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'], ...rt as Record<string, unknown> });
    }

    // ── /ServiceProviderConfig ───────────────────────────────────
    if (path === '/ServiceProviderConfig' && req.method === 'GET') {
      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
        patch: { supported: true },
        bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
        filter: { supported: true, maxResults: 100 },
        changePassword: { supported: false },
        authenticationSchemes: [{ name: 'OAuth Bearer Token', description: 'Bearer token', specUri: 'https://tools.ietf.org/html/rfc6750', type: 'oauthbearertoken', primary: true }],
        meta: { resourceType: 'ServiceProviderConfig', location: `${url.origin}/functions/v1/scim-v2/ServiceProviderConfig` },
      });
    }

    const safeJson = async (): Promise<Record<string, unknown>> => {
      try { return await req.json(); }
      catch { return {}; }
    };

    if (path === '/Users' && req.method === 'GET') {
      const { data: users } = await db.from('profiles').select('user_id, display_name, job_title, department, email').limit(100);
      const scimUsers = (users ?? []).map((u: Record<string, unknown>) => ({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: u.user_id,
        userName: u.email ?? u.user_id,
        name: { givenName: u.display_name ?? '', familyName: '' },
        title: u.job_title ?? '',
        active: true,
        meta: { resourceType: 'User', location: `${url.origin}/functions/v1/scim-v2/Users/${u.user_id}` },
      }));
      return scimJson({ schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'], totalResults: scimUsers.length, Resources: scimUsers });
    }

    if (path === '/Users' && req.method === 'POST') {
      const body = await safeJson();
      if (!body.userName) return scimError(400, 'userName is required');
      const { data: user, error } = await db.auth.admin.createUser({ email: body.userName as string, email_confirm: true });
      if (error) return scimError(400, error.message);

      const displayName = body.name && typeof body.name === 'object'
        ? `${(body.name as Record<string, unknown>).givenName ?? ''} ${(body.name as Record<string, unknown>).familyName ?? ''}`.trim()
        : null;
      await db.from('profiles').upsert({
        user_id: user.user.id,
        display_name: displayName,
        job_title: body.title ?? null,
      });

      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: user.user.id,
        userName: user.user.email,
        name: { givenName: displayName ?? '', familyName: '' },
        title: body.title ?? '',
        active: true,
        meta: { resourceType: 'User', location: `${url.origin}/functions/v1/scim-v2/Users/${user.user.id}` },
      }, 201);
    }

    if (path.startsWith('/Users/') && req.method === 'GET') {
      const userId = path.split('/')[2];
      const { data: u } = await db.from('profiles').select('user_id, display_name, job_title, department, email').eq('user_id', userId).single();
      if (!u) return scimError(404, 'User not found');
      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: u.user_id,
        userName: u.email ?? u.user_id,
        name: { givenName: u.display_name ?? '', familyName: '' },
        title: u.job_title ?? '',
        active: true,
        meta: { resourceType: 'User', location: `${url.origin}/functions/v1/scim-v2/Users/${u.user_id}` },
      });
    }

    if (path.startsWith('/Users/') && (req.method === 'PUT' || req.method === 'PATCH')) {
      const userId = path.split('/')[2];
      const { data: existing } = await db.from('profiles').select('user_id').eq('user_id', userId).single();
      if (!existing) return scimError(404, 'User not found');

      const body = await safeJson();
      const updates: Record<string, unknown> = {};
      if (body.name && typeof body.name === 'object') {
        const given = (body.name as Record<string, unknown>).givenName;
        const family = (body.name as Record<string, unknown>).familyName;
        if (given || family) updates.display_name = `${given ?? ''} ${family ?? ''}`.trim();
      }
      if (body.title !== undefined) updates.job_title = body.title;
      if (body.active === false) {
        await db.auth.admin.updateUserById(userId, { ban_duration: '24h' });
      }

      if (Object.keys(updates).length > 0) {
        await db.from('profiles').update(updates).eq('user_id', userId);
      }

      const { data: u } = await db.from('profiles').select('user_id, display_name, job_title, department, email').eq('user_id', userId).single();
      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
        id: u!.user_id,
        userName: u!.email ?? u!.user_id,
        name: { givenName: u!.display_name ?? '', familyName: '' },
        title: u!.job_title ?? '',
        active: body.active !== false,
        meta: { resourceType: 'User', location: `${url.origin}/functions/v1/scim-v2/Users/${u!.user_id}` },
      });
    }

    if (path.startsWith('/Users/') && req.method === 'DELETE') {
      const userId = path.split('/')[2];
      const { data: existing } = await db.from('profiles').select('user_id').eq('user_id', userId).single();
      if (!existing) return scimError(404, 'User not found');

      await db.auth.admin.updateUserById(userId, { ban_duration: '24h' });
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (path === '/Groups' && req.method === 'GET') {
      const { data: profiles } = await db.from('profiles').select('user_id, department, display_name, email');
      const deptMap = new Map<string, { id: string; displayName: string; members: { value: string; display: string }[] }>();

      for (const p of (profiles ?? [])) {
        const dept = p.department ?? 'Default';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { id: dept.toLowerCase().replace(/\s+/g, '-'), displayName: dept, members: [] });
        }
        deptMap.get(dept)!.members.push({ value: p.user_id, display: p.display_name ?? p.email ?? p.user_id });
      }

      const groups = Array.from(deptMap.values()).map(g => ({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: g.id,
        displayName: g.displayName,
        members: g.members,
        meta: { resourceType: 'Group', location: `${url.origin}/functions/v1/scim-v2/Groups/${g.id}` },
      }));

      return scimJson({ schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'], totalResults: groups.length, Resources: groups });
    }

    if (path === '/Groups' && req.method === 'POST') {
      const body = await safeJson();
      const deptName = body.displayName as string | undefined;
      if (!deptName) return scimError(400, 'displayName required');

      const groupId = deptName.toLowerCase().replace(/\s+/g, '-');

      if (body.members && Array.isArray(body.members)) {
        for (const m of body.members) {
          await db.from('profiles').update({ department: deptName }).eq('user_id', (m as Record<string, unknown>).value);
        }
      }

      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: groupId,
        displayName: deptName,
        members: body.members ?? [],
        meta: { resourceType: 'Group', location: `${url.origin}/functions/v1/scim-v2/Groups/${groupId}` },
      }, 201);
    }

    if (path.startsWith('/Groups/') && req.method === 'GET') {
      const groupId = path.split('/')[2];
      const deptName = groupId.replace(/-/g, ' ');

      const { data: members } = await db.from('profiles').select('user_id, display_name, email').eq('department', deptName);
      if (!members || members.length === 0) {
        return scimError(404, 'Group not found');
      }

      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: groupId,
        displayName: deptName,
        members: members.map(m => ({ value: m.user_id, display: m.display_name ?? m.email ?? m.user_id })),
        meta: { resourceType: 'Group', location: `${url.origin}/functions/v1/scim-v2/Groups/${groupId}` },
      });
    }

    if (path.startsWith('/Groups/') && (req.method === 'PUT' || req.method === 'PATCH')) {
      const groupId = path.split('/')[2];
      const currentDeptName = groupId.replace(/-/g, ' ');
      const body = await safeJson();
      const newDeptName = (body.displayName as string) ?? currentDeptName;
      const newGroupId = newDeptName.toLowerCase().replace(/\s+/g, '-');

      if (body.members && Array.isArray(body.members)) {
        const currentMemberIds = (await db.from('profiles').select('user_id').eq('department', currentDeptName)).data ?? [];
        for (const m of currentMemberIds) {
          await db.from('profiles').update({ department: null }).eq('user_id', (m as Record<string, unknown>).user_id);
        }
        for (const m of body.members) {
          await db.from('profiles').update({ department: newDeptName }).eq('user_id', (m as Record<string, unknown>).value);
        }
      } else if (newDeptName !== currentDeptName) {
        const { data: currentMembers } = await db.from('profiles').select('user_id').eq('department', currentDeptName);
        for (const m of (currentMembers ?? [])) {
          await db.from('profiles').update({ department: newDeptName }).eq('user_id', m.user_id);
        }
      }

      const { data: members } = await db.from('profiles').select('user_id, display_name, email').eq('department', newDeptName);
      return scimJson({
        schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
        id: newGroupId,
        displayName: newDeptName,
        members: (members ?? []).map(m => ({ value: m.user_id, display: m.display_name ?? m.email ?? m.user_id })),
        meta: { resourceType: 'Group', location: `${url.origin}/functions/v1/scim-v2/Groups/${newGroupId}` },
      });
    }

    if (path.startsWith('/Groups/') && req.method === 'DELETE') {
      const groupId = path.split('/')[2];
      const deptName = groupId.replace(/-/g, ' ');
      const { data: members } = await db.from('profiles').select('user_id').eq('department', deptName);
      for (const m of (members ?? [])) {
        await db.from('profiles').update({ department: null }).eq('user_id', m.user_id);
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return scimError(404, 'Not found');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('scim-v2 unhandled error:', message);
    return scimError(500, 'Internal server error');
  }
});

function scimJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' },
  });
}

function scimError(status: number, detail: string): Response {
  return new Response(JSON.stringify({
    status,
    schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
    detail,
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/scim+json' },
  });
}
