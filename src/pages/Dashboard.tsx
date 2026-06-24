import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, Send, Sparkles, Target, Award, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore, DEMO_USER_ID, type UserProfile } from '../lib/store';
import { GlassCard, Button, Spinner, Badge, ProgressBar } from '../components/ui';
import { renderMarkdown } from '../lib/markdown';

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

export default function Dashboard() {
  const { profile, goals } = useStore();
  const [mode, setMode] = useState<'chat' | 'interview'>('chat');

  const profileCompletion = profile.completed ? 100 : Math.round(
    [profile.name, profile.email, profile.role, profile.experience, profile.target_role, profile.career_goal]
      .filter(Boolean).length / 6 * 100
  );
  const goalsProgress = goals.length > 0
    ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / goals.length)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back{profile.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-slate-400 text-sm">Your AI career mentor is ready. Chat for advice or practice with a mock interview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Sparkles} label="Profile Completion" value={`${profileCompletion}%`} color="electric" progress={profileCompletion} />
        <StatCard icon={Target} label="Goals Progress" value={`${goalsProgress}%`} color="purple" progress={goalsProgress} />
        <StatCard icon={Award} label="Active Goals" value={`${goals.length}`} color="green" />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4 p-1 glass rounded-xl w-fit">
        <button onClick={() => setMode('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'chat' ? 'bg-gradient-to-r from-electric-600 to-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <MessageSquare className="w-4 h-4" /> Mentor Chat
        </button>
        <button onClick={() => setMode('interview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'interview' ? 'bg-gradient-to-r from-electric-600 to-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
          <Mic className="w-4 h-4" /> Mock Interview
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {mode === 'chat' ? <MentorChat profile={profile} /> : <MockInterview profile={profile} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, progress }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string; progress?: number }) {
  const colors: Record<string, string> = {
    electric: 'from-electric-500/20 to-electric-500/5 text-electric-400 border-electric-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    green: 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/20',
  };
  return (
    <GlassCard className={`p-5 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-sm text-slate-300">{label}</p>
      {progress !== undefined && <ProgressBar value={progress} className="mt-3" />}
    </GlassCard>
  );
}

function MentorChat({ profile }: { profile: UserProfile }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: `Hello${profile.name ? ` ${profile.name.split(' ')[0]}` : ''}! I'm your AI Career Mentor. I can help with resume tips, interview prep, skill roadmaps, salary negotiation, and career transitions. What would you like to work on today?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/mentor-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, profile, user_id: DEMO_USER_ID }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not generate a response.' }]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?' }]);
    fetch('/api/mentor-chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: DEMO_USER_ID }) });
  };

  const suggestions = ['How do I improve my resume?', 'Tips for interview prep', 'Create a learning roadmap', 'How to negotiate salary?'];

  return (
    <GlassCard className="flex flex-col h-[560px]" glow="glow-blue">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
          <div>
            <p className="text-sm font-semibold text-white">AI Career Mentor</p>
            <p className="text-[11px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online</p>
          </div>
        </div>
        <button onClick={clearChat} className="text-slate-500 hover:text-red-400 p-2" title="Clear chat"><Trash2 className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-charcoal-700' : 'bg-gradient-to-br from-electric-500 to-purple-600'}`}>
              {m.role === 'user' ? <span className="text-xs font-bold text-slate-300">You</span> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm chat-content ${m.role === 'user' ? 'bg-electric-600/20 text-slate-100 rounded-tr-sm' : 'glass text-slate-200 rounded-tl-sm'}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4 text-white" /></div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-electric-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-5 pb-2 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/10 text-xs hover:border-electric-500/40 hover:text-electric-300 transition-all">{s}</button>
          ))}
        </div>
      )}

      <div className="px-5 py-4 border-t border-white/5 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask your mentor anything..." disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-800/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-electric-500/60 disabled:opacity-50" />
        <Button onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
      </div>
    </GlassCard>
  );
}

interface InterviewQ { id: number; question: string; category: string; }
interface Evaluation { score: number; feedback: string; strengths: string[]; improvements: string[]; }

function MockInterview({ profile }: { profile: UserProfile }) {
  const [stage, setStage] = useState<'setup' | 'active' | 'result'>('setup');
  const [questions, setQuestions] = useState<InterviewQ[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  const targetRole = profile.target_role || 'Software Engineer';

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_questions', role: targetRole, user_id: DEMO_USER_ID }),
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrent(0);
      setScores([]);
      setEvalResult(null);
      setAnswer('');
      setStage('active');
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/mock-interview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate', role: targetRole, question: questions[current].question, answer }),
      });
      const data: Evaluation = await res.json();
      setEvalResult(data);
      setScores(prev => [...prev, data.score]);
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally { setLoading(false); }
  };

  const nextQ = () => {
    setEvalResult(null);
    setAnswer('');
    if (current < questions.length - 1) setCurrent(c => c + 1);
    else setStage('result');
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (stage === 'setup') {
    return (
      <GlassCard className="p-8 text-center" glow="glow-purple">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center mx-auto mb-4 glow-blue">
          <Mic className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Mock Interview Mode</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Practice with AI-generated interview questions tailored to your target role: <span className="text-electric-400 font-medium">{targetRole}</span>. Get instant feedback on each answer.
        </p>
        <Button onClick={start} disabled={loading}>
          {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Generating questions...</span> : 'Start Mock Interview'}
        </Button>
      </GlassCard>
    );
  }

  if (stage === 'result') {
    return (
      <GlassCard className="p-8" glow="glow-purple">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-electric-600 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Interview Complete!</h2>
          <p className="text-slate-400 text-sm">You answered {scores.length} questions</p>
        </div>
        <div className="flex flex-col items-center mb-6">
          <div className="text-5xl font-bold text-gradient mb-1">{avgScore}</div>
          <p className="text-sm text-slate-400">Average Score</p>
          <div className="w-full max-w-xs mt-3"><ProgressBar value={avgScore} /></div>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {scores.map((s, i) => (
            <div key={i} className="glass rounded-lg p-2 text-center">
              <p className="text-[10px] text-slate-500">Q{i + 1}</p>
              <p className={`text-lg font-bold ${s >= 75 ? 'text-green-400' : s >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{s}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={() => setStage('setup')}>New Interview</Button>
          <Button onClick={start}>Retry</Button>
        </div>
      </GlassCard>
    );
  }

  const q = questions[current];
  return (
    <GlassCard className="p-6" glow="glow-purple">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="purple">{q.category}</Badge>
        <span className="text-sm text-slate-400">Question {current + 1} of {questions.length}</span>
      </div>
      <ProgressBar value={((current) / questions.length) * 100} className="mb-5" />

      <div className="glass rounded-xl p-5 mb-5">
        <p className="text-lg text-white font-medium leading-relaxed">{q.question}</p>
      </div>

      {!evalResult ? (
        <>
          <label className="block text-sm font-medium text-slate-300 mb-2">Your Answer</label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6} disabled={loading}
            placeholder="Type your answer here. Use the STAR method for behavioral questions..."
            className="w-full px-4 py-3 rounded-xl bg-charcoal-800/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-electric-500/60 resize-none mb-4" />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={loading || !answer.trim()}>
              {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Evaluating...</span> : 'Submit Answer'}
            </Button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="glass rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">Evaluation</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${evalResult.score >= 75 ? 'text-green-400' : evalResult.score >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{evalResult.score}</span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-3">{evalResult.feedback}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-green-400 font-medium mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Strengths</p>
                <ul className="space-y-1">{evalResult.strengths.map((s, i) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-green-400">•</span>{s}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs text-amber-400 font-medium mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Improve</p>
                <ul className="space-y-1">{evalResult.improvements.map((s, i) => <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-amber-400">•</span>{s}</li>)}</ul>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={nextQ}>{current < questions.length - 1 ? 'Next Question →' : 'See Results'}</Button>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}
