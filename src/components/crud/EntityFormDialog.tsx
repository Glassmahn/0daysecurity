import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'email';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface EntityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldDef[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<boolean>;
}

export function EntityFormDialog({ open, onOpenChange, title, fields, initialValues, onSubmit }: EntityFormDialogProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? {});
      setErrors({});
    }
  }, [open, initialValues]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.required && (v === undefined || v === null || v === '')) {
        newErrors[f.name] = `${f.label} is required`;
      }
      if (f.type === 'text' || f.type === 'textarea') {
        const s = String(v ?? '');
        if (f.max && s.length > f.max) newErrors[f.name] = `Max ${f.max} characters`;
      }
      if (f.type === 'email' && v) {
        const email = String(v);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors[f.name] = 'Invalid email';
      }
      if (f.type === 'number' && v !== undefined && v !== '') {
        const n = Number(v);
        if (isNaN(n)) newErrors[f.name] = 'Must be a number';
        if (f.min !== undefined && n < f.min) newErrors[f.name] = `Min value is ${f.min}`;
        if (f.max !== undefined && n > f.max) newErrors[f.name] = `Max value is ${f.max}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const ok = await onSubmit(values);
    setSubmitting(false);
    if (ok) onOpenChange(false);
  };

  const setValue = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(f => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>
                {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {f.type === 'select' ? (
                <select
                  id={f.name}
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, e.target.value)}
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select...</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  id={f.name}
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              ) : f.type === 'number' ? (
                <Input
                  id={f.name}
                  type="number"
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={f.placeholder}
                  min={f.min}
                  max={f.max}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type === 'email' ? 'email' : 'text'}
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
              {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {initialValues ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
