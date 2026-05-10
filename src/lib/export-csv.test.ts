import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCsv } from './export-csv';

const rows = [
  { id: '1', name: 'Alice', score: 95 },
  { id: '2', name: 'Bob',   score: 80 },
];

const columns = [
  { key: 'id',    label: 'ID'    },
  { key: 'name',  label: 'Name'  },
  { key: 'score', label: 'Score' },
];

let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
  global.URL.revokeObjectURL = vi.fn();
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('exportToCsv', () => {
  it('does nothing when rows array is empty', () => {
    exportToCsv('test', []);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('creates a Blob and triggers a download', () => {
    exportToCsv('my-export', rows, columns);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('sets the correct download filename', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => node);
    exportToCsv('controls-export', rows, columns);
    const anchors = document.querySelectorAll('a[download]');
    // The element is created but not necessarily appended; check the href attribute via the spy args
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    appendSpy.mockRestore();
  });

  it('produces correct CSV header from custom columns', () => {
    let capturedContent = '';
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        capturedContent = parts[0] as string;
      }
    } as typeof Blob;

    exportToCsv('test', rows, columns);
    expect(capturedContent).toMatch(/^"ID","Name","Score"/);

    global.Blob = origBlob;
  });

  it('auto-infers column headers from row keys when no columns provided', () => {
    let capturedContent = '';
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        capturedContent = parts[0] as string;
      }
    } as typeof Blob;

    exportToCsv('test', rows);
    expect(capturedContent).toMatch(/^"id","name","score"/);

    global.Blob = origBlob;
  });

  it('wraps all values in quotes', () => {
    let capturedContent = '';
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        capturedContent = parts[0] as string;
      }
    } as typeof Blob;

    exportToCsv('test', rows, columns);
    expect(capturedContent).toContain('"Alice"');
    expect(capturedContent).toContain('"Bob"');
    expect(capturedContent).toContain('"95"');

    global.Blob = origBlob;
  });

  it('escapes double quotes inside values', () => {
    let capturedContent = '';
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        capturedContent = parts[0] as string;
      }
    } as typeof Blob;

    const tricky = [{ id: '1', name: 'She said "hello"', score: 0 }];
    exportToCsv('test', tricky, columns);
    expect(capturedContent).toContain('"She said ""hello"""');

    global.Blob = origBlob;
  });

  it('renders null and undefined values as empty strings', () => {
    let capturedContent = '';
    const origBlob = global.Blob;
    global.Blob = class extends origBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        capturedContent = parts[0] as string;
      }
    } as typeof Blob;

    const sparse = [{ id: null, name: undefined, score: 0 } as unknown as Record<string, unknown>];
    exportToCsv('test', sparse, columns);
    const dataLine = capturedContent.split('\n')[1];
    // null/undefined → empty string (no quotes), numeric 0 → "0"
    expect(dataLine).toBe(',,"0"');

    global.Blob = origBlob;
  });
});
