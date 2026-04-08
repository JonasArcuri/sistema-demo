import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Wrench, 
  FileText, 
  PlusCircle,
  LogOut,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Painel', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Package, label: 'Estoque', path: '/inventory' },
  { icon: FileText, label: 'O.S', path: '/orders' },
];

import { useAuth } from '../lib/AuthContext';
import { useWorkshop } from '../lib/WorkshopContext';

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { logout } = useAuth();
  const { settings } = useWorkshop();

  return (
    <aside className={cn(
      "h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-primary flex flex-col py-6 shadow-2xl shadow-primary/20 z-50 transition-transform duration-300 lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="px-6 mb-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden">
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white font-black text-xl">
              {settings.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-widest uppercase truncate max-w-[120px]">
              {settings.name}
            </h1>
            <p className="text-blue-200/60 text-[10px] font-headline font-bold tracking-tight uppercase mt-0.5">Painel de Controle</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/50 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 transition-all duration-300 font-headline font-bold text-sm tracking-tight",
                    isActive 
                      ? "bg-primary-container text-white rounded-r-full mr-4 translate-x-1" 
                      : "text-blue-100/70 hover:text-white hover:bg-primary-container/30"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <Link 
          to="/new-order"
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full bg-secondary text-white py-3 rounded-xl font-headline font-bold text-sm tracking-tight shadow-lg shadow-black/20 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
        >
          <PlusCircle size={18} />
          Nova Ordem
        </Link>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-6 py-3 text-blue-100/50 hover:text-white transition-colors font-headline font-bold text-sm tracking-tight"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
