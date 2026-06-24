import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Code, Target, Check, ChevronRight, ChevronLeft, Sparkles, X } from 'lucide-react';
import { useStore, type UserProfile } from '../lib/store';
import { Button, Input, Textarea, ProgressBar, GlassCard } from '../components/ui';

const steps = [
  { id: 0, title: 'Personal Info', icon: User, desc: 'Tell us who you are' },
  { id: 1, title: 'Career Background', icon: Briefcase, desc: 'Your experience so far' },
  { id: 2, title: 'Skills & Interests', icon: Code, desc: 'What you know & love' },
  { id: 3, title: 'Career Goals', icon: Target, desc: 'Where you want to go' },
];

const skillSuggestions = ['JavaScript', 'TypeScript', 'React', 'Python', 'Node.js', 'SQL', 'AWS', 'Docker', 'Machine Learning', 'Data Analysis', 'Project Management', 'Figma', 'Communication', 'Leadership', 'Java', 'Go', 'GraphQL', 'Kubernetes'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, saveProfile } = useStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<UserProfile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) e.name = 'Name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Enter a valid email';
    }
    if (step === 1) {
      if (!form.role.trim()) e.role = 'Current role is required';
      if (!form.experience.trim()) e.experience = 'Experience is required';
    }
    if (step === 2) {
      if (form.skills.length === 0) e.skills = 'Add at least one skill';
    }
    if (step === 3) {
      if (!form.target_role.trim()) e.target_role = 'Target role is required';
      if (!form.career_goal.trim()) e.career_goal = 'Describe your career goal';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setDirection(1);
    if (step < 3) setStep(step + 1);
  };
  const back = () => { setDirection(-1); if (step > 0) setStep(step - 1); };

  const finish = async () => {
    if (!validateStep()) return;
    setSaving(true);
    const finalForm = { ...form, completed: true, user_id: form.user_id || 'demo-user' };
    await saveProfile(finalForm);
    setSaving(false);
    navigate('/');
  };

  const addSkill = (s: string) => {
    const v = s.trim();
    if (v && !form.skills.includes(v)) update('skills', [...form.skills, v]);
    setSkillInput('');
  };
  const addInterest = (s: string) => {
    const v = s.trim();
    if (v && !form.interests.includes(v)) update('interests', [...form.interests, v]);
    setInterestInput('');
  };

  const completion = Math.round(((step + 1) / 4) * 100);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-electric-400" />
          <h1 className="text-2xl font-bold text-white">Profile Onboarding</h1>
        </div>
        <p className="text-slate-400 text-sm">Let's set up your career profile. This powers your personalized mentor experience.</p>
      </div>

      <GlassCard className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${done ? 'bg-green-500/20 text-green-400 border border-green-500/40' : active ? 'bg-gradient-to-br from-electric-500 to-purple-600 text-white glow-blue' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                    {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-400'}`}>{s.title}</p>
                    <p className="text-[11px] text-slate-500">{s.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${done ? 'bg-green-500/40' : 'bg-white/10'}`} />}
              </div>
            );
          })}
        </div>
        <ProgressBar value={completion} />
        <p className="text-xs text-slate-500 mt-2 text-right">{completion}% complete</p>
      </GlassCard>

      <GlassCard className="p-6 sm:p-8 min-h-[420px]" glow="glow-blue">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {step === 0 && (
              <div className="space-y-5 max-w-lg">
                <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                <Input label="Full Name" value={form.name} onChange={v => update('name', v)} placeholder="Jane Doe" error={errors.name} />
                <Input label="Email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="jane@example.com" error={errors.email} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 max-w-lg">
                <h2 className="text-lg font-semibold text-white">Career Background</h2>
                <Input label="Current Role" value={form.role} onChange={v => update('role', v)} placeholder="Junior Frontend Developer" error={errors.role} />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Years of Experience</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['0-1', '2-4', '5-8', '9+'].map(opt => (
                      <button key={opt} type="button" onClick={() => update('experience', opt)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${form.experience === opt ? 'bg-gradient-to-r from-electric-600 to-purple-600 text-white' : 'bg-charcoal-800/60 text-slate-300 border border-white/10 hover:border-electric-500/40'}`}>
                        {opt} yrs
                      </button>
                    ))}
                  </div>
                  {errors.experience && <p className="text-xs text-red-400 mt-1">{errors.experience}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 max-w-2xl">
                <h2 className="text-lg font-semibold text-white">Skills & Interests</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Skills {form.skills.length > 0 && <span className="text-electric-400">({form.skills.length})</span>}</label>
                  <div className="flex gap-2 mb-2">
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-800/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-electric-500/60" />
                    <Button variant="ghost" onClick={() => addSkill(skillInput)}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.skills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-500/15 text-electric-300 border border-electric-500/30 text-sm">
                        {s}<button onClick={() => update('skills', form.skills.filter(x => x !== s))}><X className="w-3.5 h-3.5 hover:text-red-400" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillSuggestions.filter(s => !form.skills.includes(s)).slice(0, 8).map(s => (
                      <button key={s} type="button" onClick={() => addSkill(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-400 border border-white/10 text-xs hover:border-electric-500/40 hover:text-electric-300 transition-all">+ {s}</button>
                    ))}
                  </div>
                  {errors.skills && <p className="text-xs text-red-400 mt-2">{errors.skills}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Interests (optional)</label>
                  <div className="flex gap-2 mb-2">
                    <input value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(interestInput); } }}
                      placeholder="e.g. AI, open source, startups"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-800/60 border border-white/10 text-slate-100 placeholder-slate-500 outline-none focus:border-electric-500/60" />
                    <Button variant="ghost" onClick={() => addInterest(interestInput)}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.interests.map(s => (
                      <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-sm">
                        {s}<button onClick={() => update('interests', form.interests.filter(x => x !== s))}><X className="w-3.5 h-3.5 hover:text-red-400" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 max-w-lg">
                <h2 className="text-lg font-semibold text-white">Career Goals</h2>
                <Input label="Target Role" value={form.target_role} onChange={v => update('target_role', v)} placeholder="Senior Software Engineer" error={errors.target_role} />
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Timeline</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['3 months', '6 months', '1 year'].map(opt => (
                      <button key={opt} type="button" onClick={() => update('timeline', opt)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${form.timeline === opt ? 'bg-gradient-to-r from-electric-600 to-purple-600 text-white' : 'bg-charcoal-800/60 text-slate-300 border border-white/10 hover:border-electric-500/40'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea label="Describe Your Career Goal" value={form.career_goal} onChange={v => update('career_goal', v)} rows={4} placeholder="I want to transition into a senior engineering role focused on distributed systems..." error={errors.career_goal} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <span className="flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
          </Button>
          {step < 3 ? (
            <Button onClick={next}>
              <span className="flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></span>
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
