/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  target_role: string;
  skills: string[];
  interests: string[];
  career_goal: string;
  timeline: string;
  completed: boolean;
}

export interface Goal {
  id?: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_date: string;
  status: string;
  progress: number;
  roadmap?: unknown;
  created_at?: string;
}

const DEMO_USER_ID = 'demo-user';

const defaultProfile: UserProfile = {
  user_id: DEMO_USER_ID,
  name: '', email: '', role: '', experience: '',
  target_role: '', skills: [], interests: [],
  career_goal: '', timeline: '', completed: false,
};

interface StoreContextType {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  saveProfile: (p: UserProfile) => Promise<void>;
  goals: Goal[];
  setGoals: (g: Goal[]) => void;
  fetchGoals: () => Promise<void>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType>(null!);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('acm_profile');
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch { return defaultProfile; }
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    localStorage.setItem('acm_profile', JSON.stringify(p));
  }, []);

  const saveProfile = useCallback(async (p: UserProfile) => {
    setProfile(p);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
    } catch (e) { console.error('saveProfile failed:', e); }
  }, [setProfile]);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals?user_id=${DEMO_USER_ID}`);
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) { console.error('fetchGoals failed:', e); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  return (
    <StoreContext.Provider value={{ profile, setProfile, saveProfile, goals, setGoals, fetchGoals, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
export { DEMO_USER_ID };
