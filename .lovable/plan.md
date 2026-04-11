

# Plan: Deep Research & Enrich Test Library with Framework-Mapped Test Controls

## Summary

The current test library contains only 8 generic test templates in `TestsPage.tsx` (which appears unused — the live page at `/tests` uses `tests.index.tsx` backed by the database). The enriched controls catalog (`framework-catalog.ts`) has 45 controls across 13 categories, each with cross-framework mappings, but there is no formal test-to-control mapping or a rich test library data structure.

This plan creates a comprehensive, framework-aware test library with 40+ test definitions mapped to all 45 enriched controls across SOC 2, HIPAA, ISO 27001, PCI DSS, NIST 800-53, NIST CSF, GDPR, and CCPA.

## What Changes

### 1. Create `src/lib/test-library-catalog.ts` — Enriched Test Library

A new data file containing 40+ test definitions, each with:
- **Control mappings**: Which enriched controls (AC-1 through HP-2) the test validates
- **Framework coverage**: Which frameworks the test satisfies
- **Test metadata**: Category, method (automated/manual/hybrid), frequency, estimated duration, complexity, prerequisites
- **Test steps**: Ordered checklist of what each test verifies
- **Expected evidence**: What artifacts the test produces
- **Suggested tools**: Integration points (Okta, AWS, GitHub, etc.)

Categories will cover all 13 control families: Access Control, Cryptography, Network Security, Incident Response, Data Protection, Audit & Accountability, Awareness & Training, Contingency Planning, System Integrity, Privacy, Personnel Security, Supply Chain, Configuration Management, System Acquisition & Development.

### 2. Update `src/components/tests/TestsPage.tsx` — Replace Mock Data

Replace the 8 hardcoded `testLibrary` entries with the new catalog. The Test Library tab will show:
- Framework filter chips (SOC 2, HIPAA, ISO 27001, etc.)
- Category grouping
- Control coverage count per test
- Method badges (automated/manual/hybrid)
- Complexity indicator
- Estimated duration

### 3. Update `src/routes/tests.index.tsx` — Add Test Library Tab

The current CRUD-only page will gain a second tab or section showing the enriched test library catalog, letting admins browse available test templates and instantiate them as live tests in the database.

### 4. Update `src/components/tests/TestDetailView.tsx` — Enrich Detail View

Add a "Control Mappings" section showing which enriched controls and frameworks a test covers, with links back to the control detail pages.

## Technical Details

**New test library structure:**
```typescript
interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  method: 'automated' | 'manual' | 'hybrid';
  frequency: string;
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
  controlRefs: string[];        // e.g. ['AC-1', 'AC-2', 'AC-5']
  frameworks: string[];         // e.g. ['SOC2', 'HIPAA', 'ISO27001']
  steps: string[];
  expectedEvidence: string[];
  suggestedTools: string[];
  prerequisites: string[];
}
```

**~40 test templates** organized by category:
- Access Control: 8 tests (logical access review, MFA validation, RBAC audit, user access review, provisioning/deprovisioning, privileged access monitoring, SSO config validation, session management)
- Cryptography: 5 tests (encryption at rest, encryption in transit, key rotation, certificate lifecycle, crypto algorithm compliance)
- Network Security: 4 tests (segmentation validation, firewall rule review, IDS/IPS effectiveness, DDoS resilience)
- Incident Response: 4 tests (tabletop exercise, breach notification drill, SIEM alert validation, forensic readiness)
- Data Protection: 4 tests (classification audit, DLP effectiveness, retention compliance, backup integrity)
- Audit & Accountability: 3 tests (log completeness, log retention, anomaly detection)
- Awareness & Training: 2 tests (phishing simulation, security awareness assessment)
- Contingency Planning: 3 tests (BCP walkthrough, DR failover, backup restore)
- System Integrity: 3 tests (vulnerability scan, patch compliance, endpoint protection)
- Privacy: 3 tests (DPIA review, consent mechanism, data subject rights)
- Personnel Security: 2 tests (background check, onboarding/offboarding)
- Supply Chain: 2 tests (vendor assessment, subprocessor review)
- Configuration & Development: 3 tests (baseline config, change management, SAST/code review)

## Files Modified
- **New**: `src/lib/test-library-catalog.ts`
- **Edit**: `src/components/tests/TestsPage.tsx` — replace mock testLibrary
- **Edit**: `src/routes/tests.index.tsx` — add library browsing with framework filters
- **Edit**: `src/components/tests/TestDetailView.tsx` — add control mapping section

