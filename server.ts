import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/draft', async (req, res) => {
    try {
      const { prompt, files } = req.body;
      const parts = [];

      if (prompt) {
        parts.push({ text: `Write the following section/draft: ${prompt}` });
      }

      if (files && files.length > 0) {
        for (const f of files) {
          parts.push({
            inlineData: {
              mimeType: f.mimeType,
              data: f.data,
            },
          });
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts },
        config: {
            systemInstruction: "You are a world-class, professional, and creative ghostwriter. Do not include pleasantries. Do not wrap your response in markdown formatting unless necessary for headings or lists.",
        }
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Draft error' });
    }
  });

  app.post('/api/edit', async (req, res) => {
    try {
      const { text, instruction, context } = req.body;
      
      const prompt = `
Context of the rest of the document:
---
${context || 'No context provided.'}
---

Original Paragraph:
---
${text}
---

User Instruction / Feedback: ${instruction}

Rewrite the original paragraph based exactly on the user instruction. Ensure the rewritten text flows naturally with the provided context. Return ONLY the edited text. Do not wrap it in quotes or markdown.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ text: response.text?.trim() });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Edit error' });
    }
  });

  app.post('/api/suggest', async (req, res) => {
    try {
      const { documentText } = req.body;

      const prompt = `Review the following document draft and suggest up to 3 areas for improvement. Identify specific sentences or short passages to replace, and provide a single suggested replacement string for each. Wait for the user to make major structural changes.
      
Document:
---
${documentText}
---`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalTextSnippet: {
                  type: Type.STRING,
                  description: "The exact specific snippet of text in the original document to be replaced.",
                },
                improvedText: {
                  type: Type.STRING,
                  description: "The improved replacement text.",
                },
                reason: {
                  type: Type.STRING,
                  description: "A short, professional reason for this suggestion.",
                },
              },
              required: ["originalTextSnippet", "improvedText", "reason"],
            },
          },
        },
      });

      const jsonStr = response.text?.trim() || "[]";
      let suggestions = [];
      try {
        suggestions = JSON.parse(jsonStr);
      } catch (err) {
        console.error("Failed to parse JSON", err);
      }
      res.json({ suggestions });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || 'Suggest error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
