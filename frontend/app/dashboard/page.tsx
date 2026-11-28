'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import { requestResearch } from '../lib/research-request.mjs';
import { saveSource } from '../lib/source-request.mjs';

type Source = { id: string; name: string; type: string; url: string; status: string };
type Briefing = { title: string; topic: string; summary: string; deliveryTime: string; status: string };

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const AI = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:4000';

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [savingSource, setSavingSource] = useState(false);
  const sourceInFlight = useRef(false);
  const [sourceSuccess, setSourceSuccess] = useState('');
  const [sourceError, setSourceError] = useState('');
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [researchError, setResearchError] = useState('');
  const [answerLabel, setAnswerLabel] = useState('');
  const [researching, setResearching] = useState(false);
  const researchInFlight = useRef(false);

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
    if (sourceInFlight.current || refreshing) return;
    sourceInFlight.current = true;
    setSavingSource(true);
    setSourceError('');
    setSourceSuccess('');
    try {
      const createdSource = await saveSource(name, url, API);
      setSources(current => [...current, createdSource]);
      setSourceSuccess(`Saved ${createdSource.name}. Feed ingestion and indexing are not implemented yet.`);
      setName('');
      setUrl('');
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : 'Could not save this source.');
    } finally {
      sourceInFlight.current = false;
      setSavingSource(false);
    }
  }

  async function askResearch(e: FormEvent) {
    e.preventDefault();
    if (researchInFlight.current) return;
    researchInFlight.current = true;
    setResearching(true);
    setResearchError('');
    setAnswer('');
    try {
      const result = await requestResearch(question, AI);
      setAnswer(result.answer);
      setAnswerLabel(result.label);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Research failed. Please try again.');
    } finally {
      researchInFlight.current = false;
      setResearching(false);
    }
  }

  return <main className="workspace">
    <header className="workspace-nav"><a className="brand" href="/"><span className="brand-mark">S</span> SignalDesk</a><div className="workspace-actions"><button className="refresh-button" onClick={loadWorkspace} disabled={refreshing || savingSource} aria-label="Refresh workspace data">{refreshing ? 'Refreshing…' : '↻ Refresh'}</button><div className="workspace-user"><span className="avatar" aria-hidden="true">GM</span> Gaurav Mahale <a href="/">Exit</a></div></div></header>
    <div className="workspace-body">
      <aside aria-label="Workspace navigation"><div className="aside-label">WORKSPACE</div><a className="active" href="#overview">◈ Overview</a><a href="#sources">⌁ Sources</a><a href="#briefings">◷ Briefings</a><a href="#chat">✦ Research chat</a><div className="aside-footer"><span className="pulse" aria-hidden="true"></span> Demo environment</div></aside>
      <section id="overview" className="dashboard">
        <div className="dash-heading"><div><div className="section-kicker">LIVE INTELLIGENCE WORKSPACE</div><h1>Good morning, Gaurav.</h1><p>Connect sources, run research and prepare your next briefing.</p></div><a className="primary" href="#chat">Ask SignalDesk <span aria-hidden="true">→</span></a></div>
        <div className="stats"><div><span>Sources indexed</span><strong>{sources.length || 248}</strong><small>Across your workspace</small></div><div><span>Briefings ready</span><strong>{briefings.length || 3}</strong><small>Generated this week</small></div><div><span>Evidence coverage</span><strong>94%</strong><small>Last 30 answers</small></div></div>
        <div className="dash-grid">
          <div id="briefings" className="panel"><div className="panel-head"><div><div className="panel-label">TODAY'S BRIEFING</div><h2>What matters today</h2></div><span className="chip">READY</span></div>{briefings.length ? briefings.map((b, i) => <div className="briefing-row" key={`${b.title}-${i}`}><span className="briefing-icon" aria-hidden="true">✦</span><div><strong>{b.title}</strong><p>{b.summary}</p><small>{b.topic} · Delivery {b.deliveryTime}</small></div></div>) : <div className="empty-state">Your next briefing will appear here after the Java API returns today’s items.</div>}</div>
          <div id="sources" className="panel"><div className="panel-head"><div><div className="panel-label">SOURCE LIBRARY</div><h2>Saved sources</h2></div><span className="count" aria-label={`${sources.length} saved sources`}>{sources.length}</span></div>{sources.slice(0, 5).map(s => <div className="source-row" key={s.id}><span className="source-dot" aria-hidden="true"></span><div><strong>{s.name}</strong><small>{s.type} · Metadata saved</small></div></div>)}<form className="add-source" onSubmit={addSource} aria-label="Save a source" aria-busy={savingSource}><label className="sr-only" htmlFor="source-name">Source name</label><input id="source-name" value={name} onChange={e => setName(e.target.value)} placeholder="Source name" required maxLength={255} disabled={savingSource} /><label className="sr-only" htmlFor="source-url">RSS feed URL</label><input id="source-url" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.org/feed.xml" required maxLength={1000} disabled={savingSource} /><button type="submit" disabled={savingSource || refreshing}>{savingSource ? 'Saving…' : 'Save source'}</button></form>{savingSource && <p role="status">Saving source metadata…</p>}{sourceSuccess && <p className="form-message" role="status">{sourceSuccess}</p>}{sourceError && <p className="research-error" role="alert">{sourceError}</p>}{message && <p className="form-message" role="status" aria-live="polite">{message}</p>}</div>
        </div>
        <div id="chat" className="chat-banner"><div><span className="chat-spark" aria-hidden="true">✦</span><strong>Ask SignalDesk</strong><p>This prototype sends your question without source context; demo responses are not evidence-backed.</p></div><form className="workspace-chat" onSubmit={askResearch} aria-label="Research question" aria-busy={researching}><label className="sr-only" htmlFor="research-question">Research question</label><input id="research-question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a research question..." required minLength={3} maxLength={500} disabled={researching} /><button type="submit" disabled={researching}>{researching ? 'Researching…' : 'Run research'}</button></form></div>
        {researching && <p role="status">Waiting for the AI service…</p>}
        {researchError && <p className="research-error" role="alert">{researchError}</p>}
        {answer && <div className="research-result" role="status" aria-live="polite"><div className="panel-label">{answerLabel}</div><p>{answer}</p></div>}
      </section>
    </div>
    <SiteFooter />
  </main>;
}

