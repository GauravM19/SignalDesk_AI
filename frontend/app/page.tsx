'use client';

import { useState } from 'react';
import SiteNavigation from './components/SiteNavigation';

const features = [
  ['01', 'Connect your sources', 'RSS, YouTube, PDFs, Google Drive and Notion in one searchable workspace.'],
  ['02', 'Ask with evidence', 'Get concise answers with the exact source context behind every claim.'],
  ['03', 'Stay ahead automatically', 'Schedule a daily briefing and receive the signal before your first coffee.']
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

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:4000'}/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: question.trim() })
      });
      const data = await res.json();
      setAnswer(data.answer || data.message || 'SignalDesk could not find an answer yet.');
    } catch {
      setAnswer('Demo mode is ready. Start the Node AI service to receive a grounded answer.');
    } finally {
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
      <div className="eyebrow">PERSONAL INTELLIGENCE, GROUNDED IN YOUR SOURCES</div>
      <h1>Turn scattered information into <em>clear decisions.</em></h1>
      <p className="hero-copy">SignalDesk brings your news, documents and videos together, then gives you the context, citations and next actions you need to move faster.</p>
      <div className="hero-actions"><a className="primary" href="#demo">Try the live demo <span>→</span></a><a className="secondary" href="/dashboard">Go to workspace →</a></div>
      <div className="hero-note"><span className="pulse"></span> AI answers include supporting evidence</div>
    </section>

    <section className="dashboard-preview">
      <div className="preview-top"><span>SignalDesk / Overview</span><span className="status">● All systems operational</span></div>
      <div className="preview-grid"><div className="preview-main"><div className="small-label">TODAY'S SIGNAL</div><h3>Your morning briefing, already focused.</h3><p className="muted">A live workspace for what matters across your connected sources.</p><div className="story"><span className="story-tag">AI &amp; INDUSTRY</span><strong>Five stories condensed into the decisions worth discussing today.</strong><p>Open the workspace to connect sources, create briefings and ask questions.</p></div></div><div className="preview-side"><div className="metric"><span>Sources indexed</span><strong>248</strong><small>+18 this week</small></div><div className="metric"><span>Evidence coverage</span><strong>94%</strong><small>Across 32 answers</small></div></div></div>
    </section>

    <section id="workflow" className="feature-section"><div className="section-kicker">A calmer way to stay informed</div><h2>One workspace for the information that drives your work.</h2><div className="feature-grid">{features.map(([n, t, d]) => <div className="feature" key={n}><div className="feature-no">{n}</div><h3>{t}</h3><p>{d}</p></div>)}</div></section>

    <section id="demo" className="demo-section">
      <div><div className="section-kicker">TRY GROUNDED RESEARCH</div><h2>Ask a question. See the evidence.</h2><p>Use the live Node.js/LangChain boundary or open the full workspace to connect sources and run research tasks.</p><div className="prompt-list">{prompts.map(prompt => <button key={prompt} className="prompt-chip" onClick={() => setQuestion(prompt)}>{prompt} <span>↗</span></button>)}</div></div>
      <div className="chat-card"><div className="chat-label">RESEARCH CHAT</div><div className="question-row"><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What changed in AI this week?" onKeyDown={e => e.key === 'Enter' && ask()} /><button onClick={ask} disabled={loading}>{loading ? '...' : 'Ask'}</button></div>{answer && <div className="answer"><strong>SignalDesk answer</strong><p>{answer}</p><span>⌁ Sources attached in workspace</span></div>}</div>
    </section>

    <section id="product" className="cta"><div><div className="section-kicker">BUILT FOR FOCUSED TEAMS</div><h2>Your next briefing should already be waiting.</h2></div><a className="primary" href="/dashboard">Create your workspace <span>→</span></a></section>
    <footer><span>© 2026 SignalDesk AI</span><span id="tech">Next.js · Java · Node.js · LangChain · PostgreSQL</span></footer>
  </main>;
}

