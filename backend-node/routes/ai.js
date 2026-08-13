import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config.js';
import { User } from '../models/db.js';

const router = Router();

router.post('/ai/analyze', async (req, res) => {
  try {
    const { prompt, token } = req.body;
    if (!prompt) return res.json({ error: 'Prompt requerido' });
    if (!token) return res.json({ error: 'Token no proporcionado' });

    let decoded;
    try {
      decoded = jwt.verify(token, CONFIG.JWT_SECRET);
      console.log('[AI] decoded:', JSON.stringify(decoded));
    } catch (jwtErr) {
      console.log('[AI] jwt verify error:', jwtErr.message);
      return res.json({ error: 'Token inválido - ' + jwtErr.message });
    }

    const user = await User.findById(decoded.userId).select('-password');
    console.log('[AI] user found:', !!user);
    if (!user || !user.isActive) {
      console.log('[AI] user not found or inactive');
      return res.json({ error: 'Token inválido' });
    }

    try {
      const ollamaRes = await axios.post(`${CONFIG.OLLAMA_HOST}/api/generate`, {
        model: CONFIG.AI_MODEL,
        prompt: `Eres un asistente experto en ciberseguridad y cumplimiento normativo. Responde en español de forma clara y concisa.\n\n${prompt}`,
        stream: false,
      });
      return res.json({ response: ollamaRes.data.response });
    } catch (aiErr) {
      console.error('[AI] Ollama error:', aiErr.message);
      return res.json({ response: `⚠️ No se pudo conectar con el servicio de IA (Ollama). Asegúrate de que Ollama esté corriendo en ${CONFIG.OLLAMA_HOST} con el modelo ${CONFIG.AI_MODEL} disponible.\n\nDetalles: ${aiErr.message}` });
    }
  } catch (err) {
    console.error('[AI ERROR]', err.message);
    res.json({ error: 'Error al conectar con el servicio de IA' });
  }
});

export default router;
