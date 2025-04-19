import React from 'react';
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <div className="bg-slate-900 text-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Dashboard />
      </main>
    </div>
  );
}
