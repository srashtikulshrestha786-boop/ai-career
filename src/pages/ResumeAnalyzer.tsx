import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, FileCheck2, AlertTriangle, CheckCircle2, Lightbulb, X, Sparkles, TrendingUp } from 'lucide-react';
import { DEMO_USER_ID } from '../lib/store';
import { GlassCard, Button, Spinner, Badge, ScoreRing, Textarea } from '../components/ui';

interface Analysis {
  atsScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  feedback: string[];
  summary: string;
}

export default function ResumeAnalyzer() {
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jd, setJd] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'txt') return await file.text();
    // For PDF/DOCX we read as much text as possible from the raw bytes.
    // This extracts visible text streams; works for many simple PDFs and DOCX.
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let text = '';
    // Decode as latin1 to preserve byte values, then filter printable runs
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    // Pull out sequences of printable ASCII text (length >= 4)
    const matches = raw.match(/[\x20-\x7E\n\r\t]{4,}/g);
    if (matches) text = matches.join('\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    // If DOCX, try to pull text between XML tags
    if (ext === 'docx') {
      const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (xmlMatches) text = xmlMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    }
    return text.slice(0, 20000);
  };

  const handleFile = async (file: File) => {
    setError('');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext || '')) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    setFileName(file.name);
    setAnalysis(null);
    try {
      const text = await extractText(file);
      setResumeText(text);
      if (text.trim().length < 50) setError('Could not extract enough text from this file. Try a text-based PDF or paste your resume manually below.');
    } catch {
      setError('Failed to read the file. Please paste your resume text manually.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyze = async () => {
    if (resumeText.trim().length < 50) { setError('Please provide more resume content (at least 50 characters).'); return; }
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const res = await fetch('/api/analyze-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription: jd, fileName, user_id: DEMO_USER_ID }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'Analysis failed. Please try again.');
    } finally { setLoading(false); }
  };

  const reset = () => {
    setFileName(''); setResumeText(''); setJd(''); setAnalysis(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-electric-400" />
          <h1 className="text-2xl font-bold text-white">Resume Analyzer</h1>
        </div>
        <p className="text-slate-400 text-sm">Upload your resume and a job description to get an ATS compatibility score, missing skills, and actionable feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input column */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-electric-400" /> Upload Resume</h2>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-electric-500 bg-electric-500/10' : 'border-white/15 hover:border-electric-500/50 hover:bg-white/5'}`}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center"><FileCheck2 className="w-6 h-6 text-green-400" /></div>
                  <p className="text-sm text-white font-medium">{fileName}</p>
                  <p className="text-xs text-slate-500">{resumeText.length} chars extracted</p>
                  <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-electric-500/15 flex items-center justify-center"><Upload className="w-6 h-6 text-electric-400" /></div>
                  <p className="text-sm text-slate-300">Drop your resume here or <span className="text-electric-400">browse</span></p>
                  <p className="text-xs text-slate-500">PDF, DOCX, or TXT</p>
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-400 mt-3 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {error}</p>}
          </GlassCard>

          <GlassCard className="p-6">
            <Textarea label="Paste Resume Text (if upload didn't work)" value={resumeText} onChange={setResumeText} rows={5}
              placeholder="Paste your resume content here..." />
          </GlassCard>

          <GlassCard className="p-6">
            <Textarea label="Job Description (optional but recommended)" value={jd} onChange={setJd} rows={5}
              placeholder="Paste the job description you're targeting..." />
            <div className="mt-4 flex gap-3">
              <Button onClick={analyze} disabled={loading || resumeText.trim().length < 50} className="flex-1">
                {loading ? <span className="flex items-center gap-2"><Spinner size={16} /> Analyzing...</span> : <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Analyze Resume</span>}
              </Button>
              <Button variant="ghost" onClick={reset}>Reset</Button>
            </div>
          </GlassCard>
        </div>

        {/* Results column */}
        <div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-purple-600 flex items-center justify-center mb-4 animate-pulse-ring">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white font-medium mb-2">Analyzing your resume...</p>
                  <p className="text-slate-400 text-sm text-center max-w-xs">Comparing against the job description, checking ATS compatibility, and generating feedback.</p>
                  <div className="w-full max-w-xs mt-6 space-y-2">
                    <div className="h-3 rounded shimmer" />
                    <div className="h-3 rounded shimmer w-4/5" />
                    <div className="h-3 rounded shimmer w-3/5" />
                  </div>
                </GlassCard>
              </motion.div>
            ) : analysis ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6" glow="glow-blue">
                  <div className="flex flex-col items-center mb-6">
                    <ScoreRing score={analysis.atsScore} />
                    <p className="text-sm text-slate-300 text-center mt-4 max-w-sm">{analysis.summary}</p>
                  </div>

                  {analysis.matchedSkills.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Matched Skills ({analysis.matchedSkills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedSkills.map(s => <Badge key={s} variant="success">{s}</Badge>)}
                      </div>
                    </div>
                  )}

                  {analysis.missingSkills.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Missing Skills ({analysis.missingSkills.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingSkills.map(s => <Badge key={s} variant="warning">{s}</Badge>)}
                      </div>
                    </div>
                  )}

                  {analysis.strengths.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-electric-400 mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Strengths</p>
                      <ul className="space-y-1.5">
                        {analysis.strengths.map((s, i) => <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-electric-400 mt-0.5">▸</span>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Actionable Feedback</p>
                    <ul className="space-y-2">
                      {analysis.feedback.map((f, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2.5 glass rounded-lg p-3">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center shrink-0 font-bold">{i + 1}</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="p-8 h-full flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-white font-medium mb-2">No analysis yet</p>
                  <p className="text-slate-400 text-sm max-w-xs">Upload your resume and optionally paste a job description, then click "Analyze Resume" to see your ATS score and personalized feedback.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
