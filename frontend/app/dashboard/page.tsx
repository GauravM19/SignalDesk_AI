'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import { requestResearch } from '../lib/research-request.mjs';
import { saveSource } from '../lib/source-request.mjs';
import { fetchWorkspace } from '../lib/workspace-request.mjs';

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
  const [refreshing, setRefreshing] = useState(true);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const refreshInFlight = useRef(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [researchError, setResearchError] = useState('');
  const [answerLabel, setAnswerLabel] = useState('');
  const [researching, setResearching] = useState(false);
  const researchInFlight = useRef(false);

  const loadWorkspace = useCallback(async () => {
    if (refreshInFlight.current || sourceInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    setWorkspaceError('');
    setMessage('');
    try {
      const snapshot = await fetchWorkspace(API);
      setSources(snapshot.sources);
      setBriefings(snapshot.briefings);
      setWorkspaceLoaded(true);
      setMessage('Workspace records refreshed. Briefings are stored in memory, not scheduled for delivery.');
    } catch {
      setWorkspaceError('Could not refresh workspace records. Check the Java API and select Refresh. Any previously loaded records are retained.');
    } finally {
      refreshInFlight.current = false;
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
        <div className="dash-heading"><div><div className="section-kicker">RESEARCH WORKSPACE PROTOTYPE</div><h1>Welcome, Gaurav.</h1><p>Save source metadata, inspect briefing records and try the AI service.</p></div><a className="primary" href="#chat">Ask SignalDesk</a></div>
        {refreshing && <p role="status">Loading workspace records…</p>}
        {workspaceError && <p className="research-error" role="alert">{workspaceError}</p>}
        <div className="stats"><div><span>Saved sources</span><strong>{workspaceLoaded ? sources.length : refreshing ? 'Loading…' : 'Not loaded'}</strong><small>{workspaceLoaded && workspaceError ? 'Last loaded records; refresh failed' : 'Metadata only; not indexed'}</small></div><div><span>Briefing records</span><strong>{workspaceLoaded ? briefings.length : refreshing ? 'Loading…' : 'Not loaded'}</strong><small>{workspaceLoaded && workspaceError ? 'Last loaded records; refresh failed' : 'In-memory API records'}</small></div><div><span>Evidence coverage</span><strong>Not measured</strong><small>Citation retrieval is not implemented</small></div></div>
        <div className="dash-grid">
          <div id="briefings" className="panel"><div className="panel-head"><div><div className="panel-label">BRIEFING RECORDS</div><h2>Briefing preview</h2></div><span className="chip">IN MEMORY</span></div>{briefings.length ? briefings.map((b, i) => <div className="briefing-row" key={`${b.title}-${i}`}><span className="briefing-icon" aria-hidden="true">✦</span><div><strong>{b.title}</strong><p>{b.summary}</p><small>{b.topic} · Requested time {b.deliveryTime} · No automatic delivery</small></div></div>) : <div className="empty-state">{refreshing ? 'Loading briefing records…' : !workspaceLoaded ? 'Briefing records have not loaded. Use Refresh to try again.' : 'No briefing records returned by the API.'}</div>}</div>
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

