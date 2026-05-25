import { useState, useEffect, lazy, Suspense } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MDEditor = lazy(() => import('@uiw/react-md-editor'));

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.xls', '.xlsx', '.csv', '.txt', '.zip'];

function sanitizeText(value: string): string {
  return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
}

function isAllowedFileType(fileName: string): boolean {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'number' | 'email' | 'markdown' | 'file' | 'date';
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
  entityType?: string;
}

export function EntityFormDialog({ open, onOpenChange, title, fields, initialValues, onSubmit, entityType }: EntityFormDialogProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState<string | null>(null);

  const hasMarkdown = fields.some(f => f.type === 'markdown');

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
      if (f.type === 'text' || f.type === 'textarea' || f.type === 'markdown') {
        const s = String(v ?? '');
        if (f.min !== undefined && s.length < f.min) newErrors[f.name] = `Min ${f.min} characters`;
        if (f.max !== undefined && s.length > f.max) newErrors[f.name] = `Max ${f.max} characters`;
      }
      if (f.type === 'text' || f.type === 'textarea') {
        if (v && /<script[\s>]/i.test(String(v))) newErrors[f.name] = 'HTML tags are not allowed';
      }
      if (f.type === 'email' && v) {
        const email = String(v);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) newErrors[f.name] = 'Invalid email';
      }
      if (f.type === 'number' && v !== undefined && v !== '') {
        const n = Number(v);
        if (isNaN(n)) newErrors[f.name] = 'Must be a number';
        if (f.min !== undefined && n < f.min) newErrors[f.name] = `Min value is ${f.min}`;
        if (f.max !== undefined && n > f.max) newErrors[f.name] = `Max value is ${f.max}`;
      }
      if (f.type === 'select' && v) {
        const validValues = f.options?.map(o => o.value) ?? [];
        if (!validValues.includes(String(v))) newErrors[f.name] = 'Invalid selection';
      }
      if (f.type === 'multi-select' && Array.isArray(v)) {
        const validValues = f.options?.map(o => o.value) ?? [];
        if ((v as string[]).some(s => !validValues.includes(s))) newErrors[f.name] = 'Invalid selection';
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

  const handleFileChange = async (fieldName: string, file: File | undefined) => {
    if (!file) return;
    if (!isAllowedFileType(file.name)) {
      toast.error(`File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10 MB');
      return;
    }
    const folder = entityType ? `${entityType}/` : 'uploads/';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}${Date.now()}_${safeName}`;

    setFileUploading(fieldName);
    try {
      const { data, error } = await supabase.storage
        .from('evidence-files')
        .upload(filePath, file, { upsert: false });

      if (error) {
        if (error.message?.includes('bucket') || error.message?.includes('not found')) {
          setValue(fieldName, file.name);
          toast.warning('Storage not configured, storing filename only');
        } else {
          toast.error('Upload failed: ' + error.message);
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evidence-files')
        .getPublicUrl(data.path);

      setValue(fieldName, publicUrl);
      toast.success('File uploaded');
    } catch {
      setValue(fieldName, file.name);
      toast.warning('Storage unavailable, storing filename only');
    } finally {
      setFileUploading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={hasMarkdown ? 'max-w-3xl max-h-[90vh] overflow-y-auto' : 'max-w-md max-h-[85vh] overflow-y-auto'}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(f => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>
                {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {f.type === 'multi-select' ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-md p-2">
                  {f.options?.map(o => {
                    const selected = Array.isArray(values[f.name]) ? (values[f.name] as string[]) : [];
                    const checked = selected.includes(o.value);
                    return (
                      <label key={o.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-sm">
                        <input type="checkbox" checked={checked} onChange={() => {
                          const next = checked ? selected.filter(v => v !== o.value) : [...selected, o.value];
                          setValue(f.name, next);
                        }} className="rounded border-border" />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              ) : f.type === 'select' ? (
                <Select
                  value={String(values[f.name] ?? '')}
                  onValueChange={v => setValue(f.name, v)}
                >
                  <SelectTrigger id={f.name} className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === 'file' ? (
                <div className="space-y-2">
                  <input
                    id={f.name}
                    type="file"
                    onChange={e => handleFileChange(f.name, e.target.files?.[0])}
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold hover:file:bg-primary/20 cursor-pointer"
                  />
                  {fileUploading === f.name && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </div>
                  )}
                  {typeof values[f.name] === 'string' && values[f.name] ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {(values[f.name] as string).match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? (
                        <img src={values[f.name] as string} alt="preview" className="h-12 w-12 rounded-md object-cover border border-border" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate max-w-[200px]">{(values[f.name] as string).split('/').pop()}</span>
                    </div>
                  ) : null}
                </div>
              ) : f.type === 'markdown' ? (
                <Suspense fallback={<div className="h-64 bg-muted rounded-md animate-pulse" />}>
                  <div data-color-mode="auto">
                    <MDEditor
                      value={String(values[f.name] ?? '')}
                      onChange={(val) => setValue(f.name, val ?? '')}
                      height={350}
                      preview="edit"
                      textareaProps={{ placeholder: f.placeholder }}
                    />
                  </div>
                </Suspense>
              ) : f.type === 'date' ? (
                <Input
                  id={f.name}
                  type="date"
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, e.target.value)}
                />
              ) : f.type === 'textarea' ? (
                <textarea
                  id={f.name}
                  value={String(values[f.name] ?? '')}
                  onChange={e => setValue(f.name, sanitizeText(e.target.value))}
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
                  onChange={e => setValue(f.name, sanitizeText(e.target.value))}
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
