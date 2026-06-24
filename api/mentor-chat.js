import supabase from './db-client.js';
import { callGemini, callGeminiChat, localMentorResponse } from './gemini-helper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('chat_history').select('*').order('created_at', { ascending: true });
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { message, messages, profile, user_id } = req.body;
      let userQuery = '';
      if (message) {
        userQuery = message;
      } else if (messages && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'user') {
          userQuery = lastMsg.content;
        }
      }
      if (!userQuery) return res.status(400).json({ error: 'Message is required' });

      const profileContext = profile
        ? `User profile: Name: ${profile.name || 'N/A'}, Current role: ${profile.role || 'N/A'}, Experience: ${profile.experience || 'N/A'} years, Target role: ${profile.target_role || 'N/A'}, Skills: ${(profile.skills || []).join(', ')}, Career goal: ${profile.career_goal || 'N/A'}.`
        : '';

      const systemInstruction = `You are an expert AI Career Mentor with deep knowledge of tech careers, hiring, and professional development. Give concise, actionable, and encouraging advice. Use markdown formatting with bullet points and bold text for readability. Always prioritize the user's latest specific request over the profile data. If the user asks about a specific programming language, tool, definition (such as Python, Java, SQL, Git, etc.), or a career roadmap/topic different from their profile role, answer their prompt directly with a concise technical definition or guide instead of default career advisory speech. ${profileContext}`;

      let reply = null;
      if (messages && messages.length > 0) {
        reply = await callGeminiChat(messages, systemInstruction);
      } else {
        reply = await callGemini(userQuery, systemInstruction);
      }
      if (!reply) reply = localMentorResponse(userQuery, profile || {});

      // Persist conversation
      if (user_id) {
        await supabase.from('chat_history').insert([
          { user_id, role: 'user', content: userQuery },
          { user_id, role: 'assistant', content: reply },
        ]);
      }

      return res.status(200).json({ reply });
    }

    if (req.method === 'DELETE') {
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });
      const { error } = await supabase.from('chat_history').delete().eq('user_id', user_id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('mentor-chat API error:', err);
    res.status(500).json({ error: err.message });
  }
}
