import supabase from './db-client.js';
import { callGeminiJSON, localGenerateRoadmap } from './gemini-helper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { targetRole, currentSkills, timeline, user_id } = req.body;
      if (!targetRole) return res.status(400).json({ error: 'targetRole is required' });

      const prompt = `You are an expert career coach. Create a detailed, phased learning roadmap for someone targeting a ${targetRole} role. Their current skills: ${(currentSkills || []).join(', ') || 'none specified'}. Timeline: ${timeline || '20 weeks'}.\n\nReturn JSON: {"targetRole": "...", "estimatedWeeks": "...", "phases": [{"id": 1, "phase": "Foundation", "duration": "Weeks 1-4", "milestones": [{"id": "1-1", "title": "...", "completed": false}]}]}`;

      let result = await callGeminiJSON(prompt);
      if (!result || !result.phases) {
        result = localGenerateRoadmap(targetRole, currentSkills, timeline);
      }

      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('generate-roadmap API error:', err);
    res.status(500).json({ error: err.message });
  }
}
