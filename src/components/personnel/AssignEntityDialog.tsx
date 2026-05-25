import { useState, useEffect } from 'react';
import { X, Loader2, Search, Check, Shield, AlertTriangle, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';

interface AssignEntityDialogProps {
  personId: string;
  personName: string;
  onClose: () => void;
  onSaved: () => void;
}

const entityTypes = [
  { key: 'control', label: 'Control', icon: Shield, field: 'owner_id' },
  { key: 'risk', label: 'Risk', icon: AlertTriangle, field: 'owner_id' },
  { key: 'audit', label: 'Audit', icon: ClipboardList, field: 'lead_auditor_id' },
];

export function AssignEntityDialog({ personId, personName, onClose, onSaved }: AssignEntityDialogProps) {
  const [step, setStep] = useState<'choose' | 'select' | 'confirm'>('choose');
  const [entityType, setEntityType] = useState<typeof entityTypes[0] | null>(null);
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (step !== 'select' || !entityType) return;
    setLoading(true);
    const table = entityType.key === 'audit' ? 'audits' : `${entityType.key}s`;
    supabase.from(table).select('id, title').eq('org_id', 'all').order('title').then(({ data, error }) => {
      if (!error && data) setEntities(data as Record<string, unknown>[]);
      setLoading(false);
    });
  }, [step, entityType]);

  const filtered = entities.filter(e =>
    String(e.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  async function handleAssign() {
    if (!entityType || !selectedId) return;
    setSaving(true);

    const table = entityType.key === 'audit' ? 'audits' : `${entityType.key}s`;
    const { error } = await supabase.from(table).update({
      [entityType.field]: personId,
    }).eq('id', selectedId);

    if (error) {
      toast.error(`Failed to assign: ${error.message}`);
      setSaving(false);
      return;
    }

    logAudit({
      action: 'assign_personnel',
      entity_type: table,
      entity_id: selectedId,
      details: { personId, personName, entityType: entityType.key, entityTitle: selectedTitle },
    });

    toast.success(`${personName} assigned to "${selectedTitle}"`);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {step === 'choose' && 'Assign to Entity'}
              {step === 'select' && `Select ${entityType?.label}`}
              {step === 'confirm' && 'Confirm Assignment'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {step === 'choose' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">Choose what to assign this person to:</p>
            {entityTypes.map(et => {
              const EIcon = et.icon;
              return (
                <button key={et.key} onClick={() => { setEntityType(et); setStep('select'); }}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 transition-colors">
                  <EIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{et.label}</p>
                    <p className="text-xs text-muted-foreground">Updates {et.field} field</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {step === 'select' && (
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${entityType?.label.toLowerCase()}s...`}
                className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground" />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {filtered.map(e => (
                  <button key={String(e.id)} onClick={() => { setSelectedId(String(e.id)); setSelectedTitle(String(e.title ?? '')); setStep('confirm'); }}
                    className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                    <div className="flex-1 text-sm text-foreground truncate">{String(e.title ?? 'Untitled')}</div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No {entityType?.label.toLowerCase()}s found</p>
                )}
              </div>
            )}
            <button onClick={() => setStep('choose')} className="mt-3 text-xs text-primary hover:underline cursor-pointer">Back to entity types</button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Person</span>
                <span className="font-medium text-foreground">{personName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entity Type</span>
                <span className="font-medium text-foreground">{entityType?.label}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entity</span>
                <span className="font-medium text-foreground">{selectedTitle}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('select')}
                className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">Back</button>
              <button onClick={handleAssign} disabled={saving}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
