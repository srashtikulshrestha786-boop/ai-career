import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './lib/store';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Goals from './pages/Goals';

function AppRoutes() {
  const { profile } = useStore();
  // If profile not completed, redirect root to onboarding
  const needsOnboarding = !profile.completed;

  return (
    <Layout>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/" element={needsOnboarding ? <Navigate to="/onboarding" replace /> : <Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  );
}
