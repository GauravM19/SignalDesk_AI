'use client';

import { useEffect, useState } from 'react';

export default function SiteFooter() {
  const [year, setYear] = useState(new Date().getUTCFullYear());
  useEffect(() => {
    const refreshYear = () => setYear(new Date().getUTCFullYear());
    refreshYear();
    const timer = window.setInterval(refreshYear, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <footer className="site-footer">
    <span suppressHydrationWarning>© {year} SignalDesk AI</span>
    <nav aria-label="Footer navigation">
      <a href="/">Home</a>
      <a href="/dashboard">Workspace</a>
      <a href="/#workflow">How it works</a>
      <a href="https://github.com/GauravM19/SignalDesk_AI">Source code</a>
    </nav>
    <span id="tech">Next.js · Java · Node.js · LangChain · PostgreSQL</span>
  </footer>;
}
