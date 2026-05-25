import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/hooks/compliance-snapshot')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (!token) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabase = createClient(supabaseUrl!, token, {
          auth: { autoRefreshToken: false, persistSession: false },
        })

        // Fetch all controls
        const { data: controls, error: cErr } = await supabase
          .from('controls')
          .select('status, framework_id')
        if (cErr) {
          return new Response(JSON.stringify({ error: cErr.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // Group controls by framework
        const byFramework = new Map<string, {
          total: number; implemented: number; in_progress: number; failing: number; not_started: number
        }>()

        for (const ctrl of controls ?? []) {
          if (!byFramework.has(ctrl.framework_id)) {
            byFramework.set(ctrl.framework_id, {
              total: 0, implemented: 0, in_progress: 0, failing: 0, not_started: 0,
            })
          }
          const bucket = byFramework.get(ctrl.framework_id)!
          bucket.total++
          const s = ctrl.status ?? 'not_started'
          if (s === 'implemented') bucket.implemented++
          else if (s === 'in_progress') bucket.in_progress++
          else if (s === 'failing') bucket.failing++
          else bucket.not_started++
        }

        // Fetch framework names
        const { data: frameworks } = await supabase
          .from('frameworks')
          .select('id, name')

        const fwName = new Map((frameworks ?? []).map(f => [f.id, f.name]))

        const today = new Date().toISOString().split('T')[0]
        const rows = [...byFramework.entries()].map(([fwId, b]) => ({
          snapshot_date: today,
          framework: fwName.get(fwId) ?? fwId,
          total_controls: b.total,
          implemented: b.implemented,
          in_progress: b.in_progress,
          failing: b.failing,
          not_started: b.not_started,
          score_pct: b.total > 0
            ? Math.round((b.implemented / b.total) * 10000) / 100
            : 0,
        }))

        const { error: upsertErr } = await supabase
          .from('compliance_snapshots')
          .upsert(rows, { onConflict: 'snapshot_date,framework' })

        if (upsertErr) {
          return new Response(JSON.stringify({ error: upsertErr.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(
          JSON.stringify({
            success: true,
            snapshot: { snapshot_date: today, frameworks: rows.length },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      },
    },
  },
})
