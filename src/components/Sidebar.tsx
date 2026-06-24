import { NavLink } from 'react-router-dom';
import { User, LayoutDashboard, FileText, Target, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';

const navItems = [
  { to: '/onboarding', label: 'Profile Onboarding', icon: User, desc: 'Set up your career profile' },
  { to: '/', label: 'Dashboard & Chat', icon: LayoutDashboard, desc: 'Mentor chat & mock interviews' },
  { to: '/resume', label: 'Resume Analyzer', icon: FileText, desc: 'ATS score & feedback' },
  { to: '/goals', label: 'Goals & Roadmap', icon: Target, desc: 'AI roadmap & milestones' },
];

export default function Sidebar() {
  const { profile } = useStore();
  const initials = (profile.name || 'AI').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 glass-strong border-r border-electric-500/10 flex flex-col z-40">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center glow-blue">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gradient">CareerMentor AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Your AI Career Coach</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `group flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-gradient-to-r from-electric-500/15 to-purple-500/10 border border-electric-500/30' : 'hover:bg-white/5 border border-transparent'}`}>
              {({ isActive }) => (
                <>
                  <div className={`mt-0.5 ${isActive ? 'text-electric-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>{item.label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{profile.name || 'Guest User'}</p>
            <p className="text-[11px] text-slate-500 truncate">{profile.target_role || 'Set up profile →'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
