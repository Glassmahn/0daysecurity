SELECT 'policy_acknowledgments' as tbl, count(*) as cnt FROM public.policy_acknowledgments
UNION ALL SELECT 'vendor_assessments', count(*) FROM public.vendor_assessments
UNION ALL SELECT 'access_review_campaigns', count(*) FROM public.access_review_campaigns
UNION ALL SELECT 'access_review_assignments', count(*) FROM public.access_review_assignments
UNION ALL SELECT 'audits', count(*) FROM public.audits
UNION ALL SELECT 'audit_findings', count(*) FROM public.audit_findings
UNION ALL SELECT 'audit_evidence_requests', count(*) FROM public.audit_evidence_requests
UNION ALL SELECT 'report_schedules', count(*) FROM public.report_schedules
UNION ALL SELECT 'sso_configurations', count(*) FROM public.sso_configurations
UNION ALL SELECT 'custom_field_definitions', count(*) FROM public.custom_field_definitions
UNION ALL SELECT 'custom_field_values', count(*) FROM public.custom_field_values
UNION ALL SELECT 'trust_portal_shares', count(*) FROM public.trust_portal_shares
UNION ALL SELECT 'training_assignments', count(*) FROM public.training_assignments
ORDER BY tbl;
