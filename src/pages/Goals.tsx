import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, Plus, CheckCircle2, Circle, Trash2, Map, Clock, TrendingUp, X } from 'lucide-react';
import { useStore, DEMO_USER_ID, type Goal } from '../lib/store';
import { GlassCard, Button, Spinner, Badge, ProgressBar, Input, Textarea } from '../components/ui';

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Phase {
  phase: string;
  duration: string;
  milestones: Milestone[];
}

interface Roadmap {
  phases: Phase[];
}

export default function Goals() {
  const { profile, goals, setGoals } = useStore();
  const [generating, setGenerating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Skill', target_date: '' });
  const [error, setError] = useState('');

  const generateRoadmap = async () => {
    if (!profile.target_role) { setError('Please complete your profile with a target role first.'); return; }
    setGenerating(true); setError('');
    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: profile.target_role, currentSkills: profile.skills, timeline: profile.timeline, user_id: DEMO_USER_ID }),
      });
      const roadmap = await res.json();
      const goalBody: Goal = {
        user_id: DEMO_USER_ID,
        title: `Roadmap to ${roadmap.targetRole || profile.target_role}`,
        description: `AI-generated ${roadmap.estimatedWeeks || '20-week'} roadmap to become a ${roadmap.targetRole || profile.target_role}.`,
        category: 'Career',
        target_date: profile.timeline || '6 months',
        status: 'active',
        progress: 0,
        roadmap,
      };
      const pres = await fetch('/api/goals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalBody),
      });
      const created = await pres.json();
      setGoals([created, ...goals]);
    } catch { setError('Failed to generate roadmap. Please try again.'); }
    finally { setGenerating(false); }
  };

  const addGoal = async () => {
    if (!newGoal.title.trim()) { setError('Goal title is required'); return; }
    const goalBody: Goal = {
      user_id: DEMO_USER_ID,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      target_date: newGoal.target_date || '6 months',
      status: 'active',
      progress: 0,
    };
    const res = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(goalBody) });
    const created = await res.json();
    setGoals([created, ...goals]);
    setNewGoal({ title: '', description: '', category: 'Skill', target_date: '' });
    setShowAdd(false);
  };

  const deleteGoal = async (id: number) => {
    await fetch('/api/goals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setGoals(goals.filter(g => g.id !== id));
  };

  const toggleMilestone = async (goal: Goal, phaseIdx: number, msId: string) => {
    const roadmap = goal.roadmap as Roadmap | null | undefined;
    if (!roadmap?.phases) return;
    const roadmapCopy = JSON.parse(JSON.stringify(roadmap)) as Roadmap;
    const phase = roadmapCopy.phases[phaseIdx];
    const ms = phase.milestones.find((m) => m.id === msId);
    if (ms) ms.completed = !ms.completed;
    // compute progress
    const allMs = roadmapCopy.phases.flatMap((p) => p.milestones);
    const done = allMs.filter((m) => m.completed).length;
    const progress = allMs.length ? Math.round((done / allMs.length) * 100) : 0;
    const res = await fetch('/api/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: goal.id, roadmap: roadmapCopy, progress }) });
    const updated = await res.json();
    setGoals(goals.map(g => g.id === goal.id ? updated : g));
  };

  const overallProgress = goals.length ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / goals.length) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-electric-400" />
            <h1 className="text-2xl font-bold text-white">Goals & Roadmap</h1>
          </div>
          <p className="text-slate-400 text-sm">AI-generated career roadmaps with trackable milestones.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAdd(!showAdd)}><span className="flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add Goal</span></Button>
          <Button onClick={generateRoadmap} disabled={generating}>
            {generating ? <span className="flex items-center gap-2"><Spinner size={16} /> Generating...</span> : <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> AI Roadmap</span>}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* Overall progress */}
      {goals.length > 0 && (
        <GlassCard className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-electric-400" /> Overall Progress</span>
            <span className="text-2xl font-bold text-gradient">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} />
        </GlassCard>
      )}

      {/* Add goal form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Add Custom Goal</h2>
                <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input label="Goal Title" value={newGoal.title} onChange={v => setNewGoal({ ...newGoal, title: v })} placeholder="Learn Kubernetes" />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-charcoal-800/60 border border-white/10 text-slate-100 outline-none focus:border-electric-500/60">
                    {['Skill', 'Career', 'Certification', 'Project', 'Networking'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Textarea label="Description" value={newGoal.description} onChange={v => setNewGoal({ ...newGoal, description: v })} rows={2} placeholder="What does success look like?" />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={addGoal}>Add Goal</Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {goals.length === 0 && !generating ? (
        <GlassCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4"><Map className="w-8 h-8 text-slate-500" /></div>
          <h2 className="text-lg font-semibold text-white mb-2">No goals yet</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {profile.target_role
              ? `Generate an AI-powered roadmap to become a ${profile.target_role}, or add your own custom goal to start tracking progress.`
              : 'Complete your profile onboarding first, then generate a personalized AI roadmap for your target role.'}
          </p>
          <Button onClick={generateRoadmap} disabled={generating || !profile.target_role}>
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Generate My Roadmap</span>
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onToggle={toggleMilestone} onDelete={deleteGoal} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onToggle, onDelete }: { goal: Goal; onToggle: (g: Goal, pi: number, msId: string) => void; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(true);
  const roadmap = goal.roadmap as Roadmap | null | undefined;
  const hasRoadmap = !!(roadmap?.phases && roadmap.phases.length > 0);

  return (
    <GlassCard className="overflow-hidden" glow="glow-blue">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-base font-semibold text-white">{goal.title}</h3>
              <Badge variant="purple">{goal.category}</Badge>
              {goal.target_date && <Badge><Clock className="w-3 h-3" /> {goal.target_date}</Badge>}
            </div>
            {goal.description && <p className="text-sm text-slate-400">{goal.description}</p>}
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={goal.progress || 0} className="flex-1 max-w-xs" />
              <span className="text-sm font-bold text-electric-400">{goal.progress || 0}%</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {hasRoadmap && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-electric-400 hover:text-electric-300 px-3 py-1.5 rounded-lg bg-electric-500/10">
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            )}
            {goal.id && <button onClick={() => onDelete(goal.id!)} className="text-slate-500 hover:text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasRoadmap && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-white/5">
            <div className="p-5">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-electric-500/50 via-purple-500/30 to-transparent" />
                {roadmap?.phases.map((phase, pi: number) => (
                  <div key={pi} className="relative pl-12 pb-6 last:pb-0">
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold glow-blue">
                      {pi + 1}
                    </div>
                    <div className="glass rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white">{phase.phase}</h4>
                        <Badge variant="default">{phase.duration}</Badge>
                      </div>
                      <div className="space-y-2">
                        {phase.milestones.map((ms) => (
                          <button key={ms.id} onClick={() => onToggle(goal, pi, ms.id)}
                            className="w-full flex items-start gap-2.5 text-left group">
                            {ms.completed
                              ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                              : <Circle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5 group-hover:text-electric-400 transition-colors" />}
                            <span className={`text-sm ${ms.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{ms.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
