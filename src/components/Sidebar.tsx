'use client';

import { LayoutDashboard, PlusCircle, History } from 'lucide-react';
import { ViewState } from '@/types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  pendingCount: number;
}

export function Sidebar({ currentView, onChangeView, pendingCount }: SidebarProps) {
  const navItemClass = (view: ViewState) => `
    flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
    ${currentView === view
      ? 'bg-rose-800 text-white shadow-inner border-l-4 border-amber-400'
      : 'text-rose-100 hover:bg-rose-800/50 hover:text-white'}
  `;

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-md">
           <div className="flex h-full w-full flex-col items-center justify-center rounded border border-slate-100 bg-white">
              <span className="text-xl font-black tracking-tighter text-rose-800 leading-none">ABWA</span>
              <div className="my-1 h-0.5 w-8 bg-amber-400"></div>
              <span className="text-[0.5rem] font-bold uppercase tracking-wider text-slate-800">Douglas</span>
           </div>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-tight">ABWA-Douglas<br/>Chapter</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <button
          onClick={() => onChangeView('dashboard')}
          className={navItemClass('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
          {pendingCount > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-rose-900">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onChangeView('request')}
          className={navItemClass('request')}
        >
          <PlusCircle size={20} />
          <span>New Request</span>
        </button>

        <button
          onClick={() => onChangeView('history')}
          className={navItemClass('history')}
        >
          <History size={20} />
          <span>History & Import</span>
        </button>
      </nav>

      <div className="rounded-xl bg-rose-950 p-4">
        <h3 className="mb-1 font-semibold text-white">Treasurer Access</h3>
        <p className="text-xs text-rose-300">Logged in as Admin</p>
      </div>
    </div>
  );
}
