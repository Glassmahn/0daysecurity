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

        const totalControls = controls?.length || 1
        const passingControls = controls?.filter(
          (c) => c.status === 'implemented'
        ).length || 0
        const controlsPct = Math.round((passingControls / totalControls) * 100)

        // Fetch evidence stats
        const { count: totalEvidence } = await supabase
          .from('evidence')
          .select('id', { count: 'exact', head: true })
        const { count: validEvidence } = await supabase
          .from('evidence')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'valid')
        const evidencePct = totalEvidence
          ? Math.round(((validEvidence || 0) / totalEvidence) * 100)
          : 0

        // Overall score
        const overallScore = Math.round((controlsPct + evidencePct) / 2)

        // Per-framework breakdown
        const { data: frameworks } = await supabase
          .from('frameworks')
          .select('id, name, score, enabled')
          .eq('enabled', true)
        const frameworksData = (frameworks || []).map((fw) => {
          const fwControls = controls?.filter(
            (c) => c.framework_id === fw.id
          ) || []
          const fwTotal = fwControls.length || 1
          const fwPassing = fwControls.filter(
            (c) => c.status === 'implemented'
          ).length
          return {
            id: fw.id,
            name: fw.name,
            score: fw.score,
            controlsPct: Math.round((fwPassing / fwTotal) * 100),
          }
        })

        // Upsert snapshot for today
        const { error: insertErr } = await supabase
          .from('compliance_snapshots')
          .upsert(
            {
              snapshot_date: new Date().toISOString().split('T')[0],
              overall_score: overallScore,
              controls_passing_pct: controlsPct,
              evidence_valid_pct: evidencePct,
              frameworks_data: frameworksData,
            },
            { onConflict: 'snapshot_date' }
          )

        if (insertErr) {
          return new Response(JSON.stringify({ error: insertErr.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(
          JSON.stringify({
            success: true,
            snapshot: {
              overall_score: overallScore,
              controls_passing_pct: controlsPct,
              evidence_valid_pct: evidencePct,
            },
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      },
    },
  },
})
