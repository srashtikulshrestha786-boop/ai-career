import supabase from './db-client.js';
import { callGeminiJSON, localInterviewQuestions, localEvaluateAnswer } from './gemini-helper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('interview_sessions').select('*').order('created_at', { ascending: false });
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.limit(20);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { action, role, question, answer, user_id } = req.body;

      if (action === 'generate_questions') {
        const prompt = `Generate 8 interview questions for a ${role} position. Mix behavioral, technical, and situational questions. Return JSON: {"questions": [{"id": 1, "question": "...", "category": "Behavioral"}]}`;
        let result = await callGeminiJSON(prompt);
        if (!result || !result.questions) {
          const qs = localInterviewQuestions(role);
          result = { questions: qs };
        }
        // Save session
        if (user_id) {
          await supabase.from('interview_sessions').insert([
            { user_id, role, questions: result.questions, score: 0, feedback: '' },
          ]);
        }
        return res.status(200).json(result);
      }

      if (action === 'evaluate') {
        const prompt = `You are an expert interviewer evaluating a candidate's answer for a ${role} role.\n\nQuestion: ${question}\n\nCandidate's answer: ${answer}\n\nReturn JSON: {"score": <0-100>, "feedback": "...", "strengths": ["..."], "improvements": ["..."]}`;
        let result = await callGeminiJSON(prompt);
        if (!result) result = localEvaluateAnswer(question, answer, role);
        return res.status(200).json(result);
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'PUT') {
      const { id, score, feedback } = req.body;
      const { data, error } = await supabase
        .from('interview_sessions')
        .update({ score, feedback })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('mock-interview API error:', err);
    res.status(500).json({ error: err.message });
  }
}
