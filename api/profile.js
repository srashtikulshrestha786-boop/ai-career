import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('profiles').select('*');
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return res.status(200).json(data[0] || null);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const { user_id } = body;
      if (!user_id) return res.status(400).json({ error: 'user_id is required' });

      // Upsert by user_id
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('user_id', user_id).limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from('profiles').update(body).eq('id', existing[0].id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      const { data, error } = await supabase
        .from('profiles').insert(body).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('profile API error:', err);
    res.status(500).json({ error: err.message });
  }
}
