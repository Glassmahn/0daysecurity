import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, GripVertical, MoveUp, MoveDown, Image, Video, FileText, HelpCircle } from 'lucide-react';

interface Slide {
  type: 'text' | 'image' | 'video' | 'quiz_question';
  body?: string;
  url?: string;
  embed_url?: string;
  question_id?: string;
}

interface Section {
  title: string;
  content?: string;
  slides: Slide[];
}

interface CourseContent {
  sections: Section[];
}

interface CourseEditorProps {
  courseId: string;
  initialContent: CourseContent;
  onSaved: () => void;
}

const slideIcons: Record<string, React.ElementType> = {
  text: FileText, image: Image, video: Video, quiz_question: HelpCircle,
};

export function CourseEditor({ courseId, initialContent, onSaved }: CourseEditorProps) {
  const [content, setContent] = useState<CourseContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  function addSection() {
    setContent(c => ({ sections: [...c.sections, { title: 'New Section', slides: [] }] }));
    setExpandedSection(content.sections.length);
  }

  function removeSection(idx: number) {
    setContent(c => ({ sections: c.sections.filter((_, i) => i !== idx) }));
    if (expandedSection === idx) setExpandedSection(null);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const newSections = [...content.sections];
    const target = idx + dir;
    if (target < 0 || target >= newSections.length) return;
    [newSections[idx], newSections[target]] = [newSections[target], newSections[idx]];
    setContent(() => ({ sections: newSections }));
    setExpandedSection(target);
  }

  function addSlide(sectionIdx: number, type: Slide['type']) {
    setContent(c => {
      const sections = [...c.sections];
      sections[sectionIdx] = { ...sections[sectionIdx], slides: [...sections[sectionIdx].slides, { type }] };
      return { sections };
    });
  }

  function removeSlide(sectionIdx: number, slideIdx: number) {
    setContent(c => {
      const sections = [...c.sections];
      sections[sectionIdx] = { ...sections[sectionIdx], slides: sections[sectionIdx].slides.filter((_, i) => i !== slideIdx) };
      return { sections };
    });
  }

  function updateSlide(sectionIdx: number, slideIdx: number, field: string, value: string) {
    setContent(c => {
      const sections = [...c.sections];
      const slides = [...sections[sectionIdx].slides];
      slides[slideIdx] = { ...slides[slideIdx], [field]: value };
      sections[sectionIdx] = { ...sections[sectionIdx], slides };
      return { sections };
    });
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await (supabase as any).from('training_courses').update({ content }).eq('id', courseId);
    if (error) { toast.error('Failed to save: ' + error.message); } else { toast.success('Course content saved'); onSaved(); }
    setSaving(false);
  }

  function SectionEditor({ section, idx }: { section: Section; idx: number }) {
    const isExpanded = expandedSection === idx;
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-3 bg-surface/50 cursor-pointer" onClick={() => setExpandedSection(isExpanded ? null : idx)}>
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <input className="flex-1 bg-transparent text-sm font-medium text-foreground border-none focus:outline-none" placeholder="Section title" value={section.title}
            onClick={e => e.stopPropagation()}
            onChange={e => {
              const sections = [...content.sections];
              sections[idx] = { ...sections[idx], title: e.target.value };
               setContent(() => ({ sections }));
            }} />
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); moveSection(idx, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveUp className="h-3.5 w-3.5" /></button>
            <button onClick={e => { e.stopPropagation(); moveSection(idx, 1); }} disabled={idx === content.sections.length - 1} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30"><MoveDown className="h-3.5 w-3.5" /></button>
            <button onClick={e => { e.stopPropagation(); removeSection(idx); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-border space-y-3">
            <textarea className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" rows={2} placeholder="Section description / content (HTML supported)" value={section.content ?? ''}
              onChange={e => {
                const sections = [...content.sections];
                sections[idx] = { ...sections[idx], content: e.target.value };
                setContent(() => ({ sections }));
              }} />
            <div className="space-y-2">
              {section.slides.map((slide, si) => {
                const SlideIcon = slideIcons[slide.type] ?? FileText;
                return (
                  <div key={si} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card">
                    <SlideIcon className="h-4 w-4 text-muted-foreground mt-2 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <select className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground" value={slide.type} onChange={e => updateSlide(idx, si, 'type', e.target.value)}>
                        <option value="text">Text</option><option value="image">Image</option><option value="video">Video</option><option value="quiz_question">Quiz Question</option>
                      </select>
                      {slide.type === 'text' && <textarea className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground" rows={3} placeholder="Slide content (HTML supported)" value={slide.body ?? ''} onChange={e => updateSlide(idx, si, 'body', e.target.value)} />}
                      {slide.type === 'image' && <input className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground font-mono" placeholder="Image URL" value={slide.url ?? ''} onChange={e => updateSlide(idx, si, 'url', e.target.value)} />}
                      {slide.type === 'video' && <input className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground font-mono" placeholder="Embed URL (YouTube, Vimeo)" value={slide.embed_url ?? ''} onChange={e => updateSlide(idx, si, 'embed_url', e.target.value)} />}
                      {slide.type === 'quiz_question' && <input className="w-full bg-input border border-border rounded px-2 py-1 text-xs text-foreground font-mono" placeholder="Quiz Question ID" value={slide.question_id ?? ''} onChange={e => updateSlide(idx, si, 'question_id', e.target.value)} />}
                    </div>
                    <button onClick={() => removeSlide(idx, si)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive mt-1"><Trash2 className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {(['text', 'image', 'video', 'quiz_question'] as const).map(type => {
                const Icon = slideIcons[type];
                return (
                  <button key={type} onClick={() => addSlide(idx, type)} className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <Icon className="h-3 w-3" /> {type.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Course Content Editor</h3>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Build your course by adding sections with text, images, videos, and quiz questions.</p>

      <div className="space-y-3">
        {content.sections.map((section, idx) => (
          <SectionEditor key={idx} section={section} idx={idx} />
        ))}
      </div>

      <button onClick={addSection} className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors w-full justify-center">
        <Plus className="h-3.5 w-3.5" /> Add Section
      </button>
    </div>
  );
}
