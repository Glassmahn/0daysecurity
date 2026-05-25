import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

interface QuizPlayerProps {
  courseId: string;
  assignmentId: string;
  onComplete: (score: number, passed: boolean) => void;
}

export function QuizPlayer({ courseId, assignmentId, onComplete }: QuizPlayerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    supabase.from('training_quiz_questions').select('id, question, options, correct_index, explanation').eq('course_id', courseId).then(({ data }) => {
      setQuestions((data ?? []) as QuizQuestion[]);
      setLoading(false);
    });
  }, [courseId]);

  function handleAnswer(qIdx: number, aIdx: number) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  }

  function handleSubmit() {
    const correct = questions.filter((q, i) => answers[i] === q.correct_index).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    (supabase as any).from('training_quiz_attempts').insert({
      assignment_id: assignmentId,
      answers,
      score: pct,
      passed: pct >= 70,
      completed_at: new Date().toISOString(),
    }).then(() => {
      onComplete(pct, pct >= 70);
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No quiz questions available for this course.</p>;
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Course Quiz ({questions.length} questions)</h3>
        <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</span>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{qi + 1}. {q.question}</p>
          <div className="space-y-1.5">
            {(q.options as string[]).map((opt, oi) => {
              const selected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.correct_index;
              const isWrong = submitted && selected && oi !== q.correct_index;
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(qi, oi)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    isCorrect ? 'border-status-passing bg-status-passing/10 text-status-passing' :
                    isWrong ? 'border-destructive bg-destructive/10 text-destructive' :
                    selected ? 'border-primary bg-primary/10 text-foreground' :
                    'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isCorrect && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                    {isWrong && <XCircle className="h-4 w-4 flex-shrink-0" />}
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && (
            <p className="text-xs text-muted-foreground mt-1">{q.explanation}</p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={answeredCount < questions.length}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Submit Quiz ({answeredCount}/{questions.length} answered)
        </button>
      ) : (
        <div className={`text-center p-4 rounded-lg ${score >= 70 ? 'bg-status-passing/10 border border-status-passing/30' : 'bg-destructive/10 border border-destructive/30'}`}>
          <p className={`text-lg font-bold ${score >= 70 ? 'text-status-passing' : 'text-destructive'}`}>
            {score >= 70 ? 'Passed!' : 'Not Passed'} — {score}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {score >= 70 ? 'Congratulations! You have completed this course.' : 'You need 70% to pass. Review the material and try again.'}
          </p>
        </div>
      )}
    </div>
  );
}
