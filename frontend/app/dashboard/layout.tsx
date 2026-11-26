import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your SignalDesk sources, view briefing records and ask questions from the workspace dashboard.'
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
