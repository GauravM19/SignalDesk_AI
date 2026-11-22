import express, { type ErrorRequestHandler } from 'express';
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

const demoAnswer = (question: string) => `This is a demo response for “${question}”, not an evidence-grounded answer. No sources have been retrieved. Configure OPENAI_API_KEY and supply source context to enable AI research.`;

app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'signaldesk-node-ai',
  mode: process.env.OPENAI_API_KEY ? 'openai' : 'demo'
}));

app.post('/ai/chat', async (req, res) => {
  const parsed = ChatRequest.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { question, context } = parsed.data;
  if (!process.env.OPENAI_API_KEY) {
    return res.json({ answer: demoAnswer(question), citations: [], grounded: false, mode: 'demo' });
  }

  // Do not spend tokens or generate unsupported claims when evidence is absent.
  if (!context) {
    return res.json({
      answer: 'I cannot answer from evidence yet. Supply source context with your question.',
      citations: [],
      grounded: false,
      mode: 'openai',
      status: 'insufficient_evidence'
    });
  }

  try {
    const model = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      timeout: 15000,
      maxRetries: 1
    });
    const response = await model.invoke([
      new SystemMessage('You are SignalDesk, a precise research assistant. Answer only from the supplied context. If evidence is missing, say so. Keep the answer concise.'),
      new HumanMessage(`Question: ${question}\nContext:\n${context}`)
    ]);
    return res.json({ answer: response.content.toString(), citations: [], grounded: true, mode: 'openai' });
  } catch {
    return res.status(502).json({
      error: 'AI provider unavailable',
      code: 'AI_PROVIDER_UNAVAILABLE'
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

// Keep parser errors machine-readable; never expose stack traces or request bodies.
const handleRequestError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON request body', code: 'INVALID_JSON' });
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ error: 'Request body exceeds the 256kb limit', code: 'PAYLOAD_TOO_LARGE' });
    return;
  }
  if (error?.status === 415) {
    res.status(415).json({ error: 'Unsupported request encoding', code: 'UNSUPPORTED_ENCODING' });
    return;
  }
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
};
app.use(handleRequestError);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`SignalDesk AI listening on ${port}`));
}

