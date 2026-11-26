import type { Metadata } from 'next';
import './globals.css';
import './dashboard.css';
import './responsive.css';
import './not-found.css';

export const metadata: Metadata = {
  title: {
    default: 'SignalDesk AI | Research workspace',
    template: '%s | SignalDesk AI'
  },
  description: 'Explore SignalDesk AI, a research workspace prototype for organising sources, viewing briefings and asking AI questions.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

