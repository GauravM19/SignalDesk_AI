'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Source = { id: string; name: string; type: string; url: string; status: string };
type Briefing = { title: string; topic: string; summary: string; deliveryTime: string; status: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const AI = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [name, setName] = useState('The Verge AI feed');
  const [url, setUrl] = useState('https://www.theverge.com/rss/index.xml');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const loadWorkspace = useCallback(async () => {
    setRefreshing(true);
    try {
      const [sourceResponse, briefingResponse] = await Promise.all([
        fetch(`${API}/api/sources`),
        fetch(`${API}/api/briefings/today`)
      ]);
      if (!sourceResponse.ok || !briefingResponse.ok) throw new Error('API unavailable');
      setSources(await sourceResponse.json());
      setBriefings(await briefingResponse.json());
      setMessage('Workspace refreshed just now.');
    } catch {
      setMessage('Start the Java API to load workspace data.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  async function addSource(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setMessage('Enter both a source name and URL.');
      return;
    }
    try {
      const response = await fetch(`${API}/api/sources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type: 'RSS', url: url.trim() })
      });
      if (!response.ok) throw new Error('Could not connect source');
      const createdSource = await response.json();
      setSources(current => [...current, createdSource]);
      setMessage('Source connected successfully.');
    } catch {
      setMessage('Could not connect this source. Check the Java API and URL.');
    }
  }

  async function askResearch(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAnswer('Researching your connected signal...');
    try {
      const response = await fetch(`${AI}/ai/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: question.trim() })
      });
      const data = await response.json();
      setAnswer(data.answer || data.message || 'No grounded answer returned yet.');
    } catch {
      setAnswer('Start the Node AI service on port 4000 to run research tasks.');
    }
  }

  return <main className="workspace">
    <header className="workspace-nav"><a className="brand" href="/"><span className="brand-mark">S</span> SignalDesk</a><div className="workspace-actions"><button className="refresh-button" onClick={loadWorkspace} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh'}</button><div className="workspace-user"><span className="avatar">GM</span> Gaurav Mahale <a href="/">Exit</a></div></div></header>
    <div className="workspace-body">
      <aside><div className="aside-label">WORKSPACE</div><a className="active" href="#overview">◈ Overview</a><a href="#sources">⌁ Sources</a><a href="#briefings">◷ Briefings</a><a href="#chat">✦ Research chat</a><div className="aside-footer"><span className="pulse"></span> Demo environment</div></aside>
      <section id="overview" className="dashboard">
        <div className="dash-heading"><div><div className="section-kicker">LIVE INTELLIGENCE WORKSPACE</div><h1>Good morning, Gaurav.</h1><p>Connect sources, run research and prepare your next briefing.</p></div><a className="primary" href="#chat">Ask SignalDesk <span>→</span></a></div>
        <div className="stats"><div><span>Sources indexed</span><strong>{sources.length || 248}</strong><small>Across your workspace</small></div><div><span>Briefings ready</span><strong>{briefings.length || 3}</strong><small>Generated this week</small></div><div><span>Evidence coverage</span><strong>94%</strong><small>Last 30 answers</small></div></div>
        <div className="dash-grid">
          <div id="briefings" className="panel"><div className="panel-head"><div><div className="panel-label">TODAY'S BRIEFING</div><h2>What matters today</h2></div><span className="chip">READY</span></div>{briefings.length ? briefings.map((b, i) => <div className="briefing-row" key={`${b.title}-${i}`}><span className="briefing-icon">✦</span><div><strong>{b.title}</strong><p>{b.summary}</p><small>{b.topic} · Delivery {b.deliveryTime}</small></div></div>) : <div className="empty-state">Your next briefing will appear here after the Java API returns today’s items.</div>}</div>
          <div id="sources" className="panel"><div className="panel-head"><div><div className="panel-label">SOURCE LIBRARY</div><h2>Connected sources</h2></div><span className="count">{sources.length}</span></div>{sources.slice(0, 5).map(s => <div className="source-row" key={s.id}><span className="source-dot"></span><div><strong>{s.name}</strong><small>{s.type} · {s.status}</small></div></div>)}<form className="add-source" onSubmit={addSource}><input value={name} onChange={e => setName(e.target.value)} placeholder="Source name" /><input value={url} onChange={e => setUrl(e.target.value)} placeholder="RSS or document URL" /><button>Add source</button></form>{message && <p className="form-message">{message}</p>}</div>
        </div>
        <div id="chat" className="chat-banner"><div><span className="chat-spark">✦</span><strong>Ask SignalDesk about your sources</strong><p>Run a research task and receive a concise answer from the AI service.</p></div><form className="workspace-chat" onSubmit={askResearch}><input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a research question..." /><button>Run research →</button></form></div>
        {answer && <div className="research-result"><div className="panel-label">LATEST RESEARCH RESULT</div><p>{answer}</p><small>Generated by the Node.js AI service · Verify important decisions against the cited sources.</small></div>}
      </section>
    </div>
  </main>;
}
