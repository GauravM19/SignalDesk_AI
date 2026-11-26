export default function NotFound() {
  return <main className="not-found" aria-labelledby="not-found-title">
    <a className="brand" href="/"><span className="brand-mark" aria-hidden="true">S</span> SignalDesk</a>
    <section className="not-found-card">
      <p className="section-kicker">404 · PAGE NOT FOUND</p>
      <h1 id="not-found-title">This page is off the radar.</h1>
      <p>The address may be incorrect, or this page may have moved. Your workspace is still available.</p>
      <nav className="not-found-actions" aria-label="Page recovery">
        <a className="primary" href="/dashboard">Open workspace</a>
        <a className="secondary" href="/">Back to home</a>
      </nav>
    </section>
  </main>;
}
