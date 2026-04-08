import React, { useState } from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { SettingsModal } from './SettingsModal';

export function TopBar({ title }: { title: string }) {
  const { profile } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-40 glass-header flex justify-between items-center px-4 sm:px-8">
      <div className="flex items-center gap-4 sm:gap-6 w-full max-w-2xl ml-12 lg:ml-0">
        <span className="text-primary font-bold font-headline text-lg hidden xl:block whitespace-nowrap">{title}</span>
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            className="w-full bg-surface-high border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            placeholder="Buscar no sistema..." 
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-surface-low rounded-lg transition-all active:scale-95">
          <Bell size={20} />
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-500 hover:bg-surface-low rounded-lg transition-all active:scale-95"
        >
          <Settings size={20} />
        </button>
        <div className="h-8 w-[1px] bg-surface-high mx-2"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-primary leading-none">{profile?.name || 'Usuário'}</p>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
              {profile?.role === 'admin' ? 'Administrador' : 'Técnico'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-surface-high">
            {profile?.photoURL ? (
              <img 
                alt="User Avatar" 
                className="w-full h-full object-cover" 
                src={profile.photoURL}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                {profile?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
