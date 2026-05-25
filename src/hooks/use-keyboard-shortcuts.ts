import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

const SHORTCUTS: Shortcut[] = [
  { key: 'g d', description: 'Go to Dashboard', action: () => {} },
  { key: 'g r', description: 'Go to Risk Register', action: () => {} },
  { key: 'g c', description: 'Go to Controls', action: () => {} },
  { key: 'g i', description: 'Go to Incidents', action: () => {} },
  { key: 'g a', description: 'Go to Assets', action: () => {} },
  { key: 'g p', description: 'Go to Policies', action: () => {} },
  { key: 'g v', description: 'Go to Vendors', action: () => {} },
  { key: 'g e', description: 'Go to Evidence', action: () => {} },
  { key: 'g t', description: 'Go to Training', action: () => {} },
  { key: 'g k', description: 'Go to Knowledge Base', action: () => {} },
  { key: '?', description: 'Toggle this help', action: () => {} },
];

export function useKeyboardShortcuts(
  navigate: ReturnType<typeof useNavigate>,
  onToggleHelp: () => void
) {
  useEffect(() => {
    const buffer: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      buffer.push(e.key.toLowerCase());
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { buffer.length = 0; }, 1000);

      const seq = buffer.join(' ');
      switch (seq) {
        case 'g d': buffer.length = 0; navigate({ to: '/dashboard' }); break;
        case 'g r': buffer.length = 0; navigate({ to: '/risk-register' }); break;
        case 'g c': buffer.length = 0; navigate({ to: '/controls' }); break;
        case 'g i': buffer.length = 0; navigate({ to: '/incidents' }); break;
        case 'g a': buffer.length = 0; navigate({ to: '/assets' }); break;
        case 'g p': buffer.length = 0; navigate({ to: '/policies' }); break;
        case 'g v': buffer.length = 0; navigate({ to: '/vendors' }); break;
        case 'g e': buffer.length = 0; navigate({ to: '/evidence' }); break;
        case 'g t': buffer.length = 0; navigate({ to: '/training' }); break;
        case 'g k': buffer.length = 0; navigate({ to: '/knowledge-base' }); break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onToggleHelp]);
}

export const SHORTCUTS_LIST = SHORTCUTS;
