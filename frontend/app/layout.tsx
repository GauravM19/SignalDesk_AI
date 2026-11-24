import './globals.css';
import './dashboard.css';
import './responsive.css';

export const metadata = { title: 'SignalDesk AI', description: 'Your cited AI intelligence workspace' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

