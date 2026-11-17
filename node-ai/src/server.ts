import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));
const port = Number(process.env.PORT || 4000);

export const ChatRequest = z.object({
  question: z.string().trim().min(3, 'Question must contain at least 3 characters.').max(500, 'Question is too long.'),
  context: z.string().trim().max(12000, 'Context is too large.').optional()
});

export const SummariseRequest = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200, 'Title is too long.')
});

const demoAnswer = (question: string) => `SignalDesk found a grounded demo response for “${question}”. The AI service is running in safe demo mode; connect an OPENAI_API_KEY to generate a response from indexed sources. Your production answer will include citations, source metadata and a confidence score.`;

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'signaldesk-node-ai',
  mode: process.env.OPENAI_API_KEY ? 'openai' : 'demo'
}));

app.post('/ai/chat', async (req, res) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { question, context = 'No indexed context was supplied.' } = parsed.data;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ answer: demoAnswer(question), citations: [], grounded: false, mode: 'demo' });
  }

  try {
    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.1
    });
    const response = await model.invoke([
      new SystemMessage('You are SignalDesk, a precise research assistant. Answer only from the supplied context. If evidence is missing, say so. Keep the answer concise.'),
      new HumanMessage(`Question: ${question}\nContext:\n${context}`)
    ]);
    return res.json({ answer: response.content.toString(), citations: [], grounded: true, mode: 'openai' });
  } catch (error) {
    return res.status(502).json({
      error: 'AI provider unavailable',
      detail: error instanceof Error ? error.message : 'unknown error'
    });
  }
});

app.post('/ai/summarise', (req, res) => {
  const parsed = SummariseRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title } = parsed.data;
  return res.json({
    title,
    summary: `A concise SignalDesk summary for ${title}. Connect OpenAI to replace this safe demo output.`,
    keyPoints: ['Source successfully accepted', 'Content is ready for indexing', 'Citations will be attached after ingestion']
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`SignalDesk AI listening on ${port}`));
}
