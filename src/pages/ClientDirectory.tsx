import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { 
  UserPlus, 
  Users, 
  Star, 
  Calendar, 
  History, 
  Filter, 
  Download, 
  Car, 
  Truck, 
  ChevronLeft, 
  ChevronRight,
  Edit2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

export default function ClientDirectory() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    vip: 0,
    active: 0,
    inactive: 0
  });
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    vehicle: '',
    plate: '',
    status: 'Ativo',
    type: 'car'
  });

  useEffect(() => {
    const q = query(collection(db, 'clients'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      setClients(items);
      
      // Calculate stats
      const total = items.length;
      const vip = items.filter(c => c.status === 'VIP').length;
      const active = items.filter(c => c.status === 'Ativo').length;
      const inactive = items.filter(c => c.status === 'Inativo').length;
      
      setStats({ total, vip, active, inactive });
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar clientes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (client: any = null) => {
    if (client) {
      setEditingClient(client);
      setNewClient({
        name: client.name,
        phone: client.phone,
        vehicle: client.vehicle,
        plate: client.plate,
        status: client.status,
        type: client.type || 'car'
      });
    } else {
      setEditingClient(null);
      setNewClient({
        name: '',
        phone: '',
        vehicle: '',
        plate: '',
        status: 'Ativo',
        type: 'car'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateDoc(doc(db, 'clients', editingClient.id), {
          ...newClient,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'clients'), {
          ...newClient,
          since: new Date().getFullYear().toString(),
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setNewClient({
        name: '',
        phone: '',
        vehicle: '',
        plate: '',
        status: 'Ativo',
        type: 'car'
      });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };
  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8">
      <TopBar title="Diretório de Clientes" />
      
      <div className="pt-16 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Relacionamento com Clientes</h2>
            <p className="text-on-surface-variant font-medium text-sm">Histórico de veículos e serviços por proprietário.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-secondary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-secondary/20 transition-all active:scale-95 text-sm"
          >
            <UserPlus size={18} />
            Novo Cliente
          </button>
        </div>

        {/* Stats Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total de Clientes', value: stats.total.toLocaleString(), trend: null, icon: Users, color: 'primary' },
            { label: 'Membros VIP', value: stats.vip.toLocaleString(), trend: 'Prioridade', icon: Star, color: 'secondary' },
            { label: 'Ativos', value: stats.active.toLocaleString(), trend: null, icon: Calendar, color: 'tertiary' },
            { label: 'Inativos', value: stats.inactive.toLocaleString(), trend: null, icon: History, color: 'error' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-lowest p-6 rounded-xl tonal-card">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  stat.color === 'primary' ? "bg-primary/10 text-primary" :
                  stat.color === 'secondary' ? "bg-secondary/10 text-secondary" :
                  stat.color === 'error' ? "bg-red-100 text-red-600" : "bg-primary-container/10 text-primary-container"
                )}>
                  <stat.icon size={20} />
                </div>
                {stat.trend && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{stat.trend}</span>}
              </div>
              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-on-surface mt-1">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-lowest rounded-xl tonal-card overflow-hidden">
          <div className="px-8 py-6 flex justify-between items-center bg-surface-low/50">
            <h4 className="font-bold text-primary flex items-center gap-2">
              <Users size={20} />
              Interações Recentes
            </h4>
            <div className="flex gap-2">
              <button className="text-on-surface-variant hover:text-primary p-2 transition-colors"><Filter size={20} /></button>
              <button className="text-on-surface-variant hover:text-primary p-2 transition-colors"><Download size={20} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-surface-low text-on-surface-variant text-[10px] uppercase tracking-[0.15em] font-bold">
                  <th className="px-8 py-4">Nome do Cliente</th>
                  <th className="px-6 py-4">Telefone / Contato</th>
                  <th className="px-6 py-4">Veículo Principal</th>
                  <th className="px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-high/30">
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id} className="hover:bg-surface-low/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                            {client.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{client.name}</p>
                            <p className="text-xs text-on-surface-variant">Desde {client.since || 'Recente'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-on-surface-variant">{client.phone}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {client.type === 'car' ? <Car size={18} className="text-slate-400" /> : <Truck size={18} className="text-slate-400" />}
                          <span className="text-sm font-bold text-on-surface">{client.vehicle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="bg-surface-high px-3 py-1 rounded text-xs font-mono font-bold border border-surface-high/50">{client.plate}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          client.status === 'VIP' ? "bg-orange-50 text-orange-700 border-orange-200" :
                          client.status === 'Ativo' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>{client.status}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white rounded-lg shadow-sm border border-surface-high text-primary transition-all"><History size={18} /></button>
                          <button 
                            onClick={() => handleOpenModal(client)}
                            className="p-2 hover:bg-white rounded-lg shadow-sm border border-surface-high text-on-surface-variant transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
                        <Users size={48} />
                        <p className="font-headline font-bold text-lg">Nenhum cliente cadastrado</p>
                        <p className="text-sm max-w-xs mx-auto">Cadastre seus primeiros clientes para começar a gerenciar os serviços.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-lowest border-t border-surface-high/50">
            <p className="text-xs text-on-surface-variant font-medium">Exibindo {clients.length} clientes</p>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-surface-high text-on-surface-variant hover:bg-primary/10 transition-colors"><ChevronLeft size={16} /></button>
              <button className="p-2 rounded-lg bg-primary text-white font-bold px-4 text-xs">1</button>
              <button className="p-2 rounded-lg hover:bg-surface-high text-on-surface-variant transition-colors px-4 text-xs">2</button>
              <button className="p-2 rounded-lg bg-surface-high text-on-surface-variant hover:bg-primary/10 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>
      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/50"
          >
            <div className="p-6 border-b border-surface-high flex justify-between items-center bg-surface-low">
              <h3 className="text-xl font-headline font-bold text-primary">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-high rounded-lg transition-colors">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Nome Completo</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="Ex: Ricardo Mendonça"
                    value={newClient.name}
                    onChange={e => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Telefone</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="(00) 00000-0000"
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Veículo Principal</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="Ex: Toyota Hilux 2023"
                    value={newClient.vehicle}
                    onChange={e => setNewClient({...newClient, vehicle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Placa</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="ABC-1234"
                    value={newClient.plate}
                    onChange={e => setNewClient({...newClient, plate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Tipo de Veículo</label>
                  <select 
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={newClient.type}
                    onChange={e => setNewClient({...newClient, type: e.target.value})}
                  >
                    <option value="car">Carro / SUV</option>
                    <option value="truck">Caminhão / Frota</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    value={newClient.status}
                    onChange={e => setNewClient({...newClient, status: e.target.value})}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="VIP">VIP</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-surface-high text-primary font-bold rounded-xl hover:bg-surface-low transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
