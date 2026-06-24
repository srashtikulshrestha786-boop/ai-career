import supabase from './db-client.js';
import { callGeminiJSON, localAnalyzeResume } from './gemini-helper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { resumeText, jobDescription, fileName, user_id } = req.body;
      if (!resumeText) return res.status(400).json({ error: 'Resume text is required' });

      const prompt = `You are an expert ATS resume analyzer and career coach. Analyze this resume against the job description.\n\nRESUME:\n${resumeText.slice(0, 6000)}\n\nJOB DESCRIPTION:\n${(jobDescription || 'No specific JD provided — analyze for general quality').slice(0, 4000)}\n\nReturn JSON with this exact shape:\n{"atsScore": <0-100 integer>, "matchedSkills": ["..."], "missingSkills": ["..."], "strengths": ["..."], "feedback": ["..."], "summary": "..."}`;

      let result = await callGeminiJSON(prompt);
      if (!result || typeof result.atsScore !== 'number') {
        result = localAnalyzeResume(resumeText, jobDescription);
      }

      // Save analysis record
      if (user_id) {
        await supabase.from('resume_analyses').insert([
          { user_id, file_name: fileName || 'resume', ats_score: result.atsScore, result },
        ]).then(() => {});
      }

      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('analyze-resume API error:', err);
    res.status(500).json({ error: err.message });
  }
}
