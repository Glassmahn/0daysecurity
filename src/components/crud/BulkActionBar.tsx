import { useState } from 'react';
import { Trash2, RefreshCw, X, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface StatusOption {
  value: string;
  label: string;
}

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onBulkDelete: () => Promise<boolean>;
  statusOptions?: StatusOption[];
  onBulkStatusUpdate?: (status: string) => Promise<boolean>;
  entityName?: string;
}

export function BulkActionBar({
  count,
  onClear,
  onBulkDelete,
  statusOptions,
  onBulkStatusUpdate,
  entityName = 'record',
}: BulkActionBarProps) {
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  if (count === 0) return null;

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await onBulkDelete();
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (ok) onClear();
  };

  const handleStatusUpdate = async (status: string) => {
    if (!onBulkStatusUpdate) return;
    setUpdating(true);
    const ok = await onBulkStatusUpdate(status);
    setUpdating(false);
    setStatusMenuOpen(false);
    if (ok) onClear();
  };

  const plural = count === 1 ? entityName : `${entityName}s`;

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg animate-slide-in shadow-lg">
        <span className="text-sm font-medium">
          {count} {plural} selected
        </span>
        <div className="flex items-center gap-2">
          {statusOptions && onBulkStatusUpdate && (
            <div className="relative">
              <button
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                disabled={updating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Update Status
              </button>
              {statusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px]">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusUpdate(opt.value)}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors capitalize"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/80 hover:bg-destructive rounded-md text-xs font-medium text-destructive-foreground transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>

          <button onClick={onClear} className="p-1.5 hover:bg-primary-foreground/15 rounded transition-colors" title="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} {plural}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {plural}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Delete {count} {plural}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
