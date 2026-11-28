'use client';

import { useRef, useState } from 'react';
import SiteNavigation from './components/SiteNavigation';
import SiteFooter from './components/SiteFooter';
import { requestResearch } from './lib/research-request.mjs';

const features = [
  ['01', 'Save source metadata', 'Store RSS source names and URLs through the Java API. Feed fetching and indexing are not implemented yet.'],
  ['02', 'Explore the AI boundary', 'Try the Node.js/LangChain service. Demo answers are labelled; configured models need source context to answer from evidence.'],
  ['03', 'Preview briefing records', 'Inspect in-memory briefing records. Persistent briefings, scheduling and automatic delivery are planned.']
];

const prompts = [
  'What changed in AI this week?',
  'Summarise the most important risks in my sources',
  'What should my team pay attention to next?'
];

export default function Home() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answerLabel, setAnswerLabel] = useState('');
  const inFlight = useRef(false);

  const ask = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError('');
    setAnswer(null);
    try {
      const result = await requestResearch(question, process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:4000');
      setAnswer(result.answer);
      setAnswerLabel(result.label);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Research failed. Please try again.');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  return <main>
    <nav className="nav" aria-label="Main navigation">
      <a className="brand" href="/"><span className="brand-mark">S</span> SignalDesk</a>
      <SiteNavigation />
      <a className="nav-button" href="/dashboard">Open workspace ↗</a>
    </nav>

    <section className="hero">
      <div className="eyebrow">A RESEARCH WORKSPACE IN DEVELOPMENT</div>
      <h1>Turn scattered information into <em>clear decisions.</em></h1>
      <p className="hero-copy">Start with saved RSS source metadata, briefing previews and a clearly labelled AI demo. Retrieval, citations and more source integrations are on the roadmap.</p>
      <div className="hero-actions"><a className="primary" href="#demo">Try the live demo <span>→</span></a><a className="secondary" href="/dashboard">Go to workspace →</a></div>
      <div className="hero-note">Prototype: source retrieval and citation verification are not implemented yet.</div>
    </section>

    <section className="dashboard-preview">
      <div className="preview-top"><span>SignalDesk / Product preview</span><span className="status">Prototype — not a live service monitor</span></div>
      <div className="preview-grid"><div className="preview-main"><div className="small-label">CURRENT CAPABILITIES</div><h3>A foundation for focused research.</h3><p className="muted">Explore the working API boundaries without mistaking preview content for live intelligence.</p><div className="story"><span className="story-tag">DEVELOPMENT ROADMAP</span><strong>Retrieval, citations and scheduled briefings come next.</strong><p>Google Drive, Notion, PDFs and video ingestion are planned integrations, not connected services.</p></div></div><div className="preview-side"><div className="metric"><span>Source storage</span><strong>RSS metadata</strong><small>Names and URLs; no indexing yet</small></div><div className="metric"><span>Evidence coverage</span><strong>Not measured</strong><small>No published evaluation results</small></div></div></div>
    </section>

    <section id="workflow" className="feature-section"><div className="section-kicker">A calmer way to stay informed</div><h2>One workspace for the information that drives your work.</h2><div className="feature-grid">{features.map(([n, t, d]) => <div className="feature" key={n}><div className="feature-no">{n}</div><h3>{t}</h3><p>{d}</p></div>)}</div></section>

    <section id="demo" className="demo-section">
      <div><div className="section-kicker">TRY THE AI SERVICE</div><h2>Ask a question. Check its limits.</h2><p>This form sends no source context. Without a model key the service returns a demo; with a key it reports insufficient evidence. Source-grounded research is not available here yet.</p><div className="prompt-list">{prompts.map(prompt => <button key={prompt} className="prompt-chip" disabled={loading} onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div></div>
      <div className="chat-card"><div className="chat-label">RESEARCH CHAT</div><form className="question-row" aria-label="Demo research question" aria-busy={loading} onSubmit={e => { e.preventDefault(); void ask(); }}><label className="sr-only" htmlFor="demo-question">Research question</label><input id="demo-question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What changed in AI this week?" required minLength={3} maxLength={500} disabled={loading} /><button type="submit" disabled={loading}>{loading ? 'Researching…' : 'Ask'}</button></form>{loading && <p role="status">Waiting for the AI service…</p>}{error && <p className="research-error" role="alert">{error}</p>}{answer && <div className="answer" role="status"><strong>{answerLabel}</strong><p>{answer}</p></div>}</div>
    </section>

    <section id="product" className="cta"><div><div className="section-kicker">EXPLORE THE PROTOTYPE</div><h2>See what works today and what comes next.</h2></div><a className="primary" href="/dashboard">Open workspace</a></section>
    <SiteFooter />
  </main>;
}

