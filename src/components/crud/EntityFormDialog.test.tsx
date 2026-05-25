import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EntityFormDialog, type FieldDef } from './EntityFormDialog';

vi.mock('@/integrations/supabase/client', () => {
  const mockUpload = vi.fn().mockResolvedValue({ data: { path: 'uploads/test_evidence.pdf' }, error: null });
  const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/evidence-files/uploads/test_evidence.pdf' } });
  return {
    supabase: {
      storage: {
        from: () => ({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
    },
  };
});

describe('EntityFormDialog — file field', () => {
  const onOpenChange = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(true);

  const fields: FieldDef[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'file_url', label: 'Attach File', type: 'file' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text and file fields', () => {
    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    expect(screen.getByLabelText((content) => content.startsWith('Title'))).toBeInTheDocument();
    expect(screen.getByLabelText('Attach File')).toBeInTheDocument();
  });

  it('renders a file input element', () => {
    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    const fileInput = screen.getByLabelText('Attach File');
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('submits with file name when a file is selected', async () => {
    const file = new File(['test content'], 'evidence.pdf', { type: 'application/pdf' });

    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText((content) => content.startsWith('Title')), { target: { value: 'My Evidence' } });

    const fileInput = screen.getByLabelText('Attach File') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test_evidence.pdf')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Evidence',
        file_url: 'https://test.supabase.co/storage/v1/object/public/evidence-files/uploads/test_evidence.pdf',
      })
    );
  });

  it('shows error when required text field is empty', () => {
    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    fireEvent.click(screen.getByText('Create'));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not make file field required when not specified', () => {
    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    const fileInput = screen.getByLabelText('Attach File');
    expect(fileInput).not.toHaveAttribute('required');
  });

  it('calls onOpenChange(false) on Cancel', () => {
    render(
      <EntityFormDialog open={true} onOpenChange={onOpenChange} title="Test" fields={fields} onSubmit={onSubmit} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
