import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { 
  TrendingUp, 
  Package, 
  Banknote, 
  HardHat, 
  Clock, 
  CheckCircle,
  ArrowRight,
  CircleDot,
  UserPlus,
  FilePlus,
  Wrench
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, query, orderBy, limit, where, startAt, endAt } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState({
    stock: 0,
    sales: 0,
    orders: 0
  });
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'Hoje' | 'Mês' | 'Ano'>('Hoje');

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const totalStock = snap.docs
        .map(doc => doc.data())
        .filter(data => data.status === 'active' || !data.status)
        .reduce((acc, data) => acc + (data.stock || 0), 0);
      setStatsData(prev => ({ ...prev, stock: totalStock }));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setRecentServices(orders.slice(0, 5));
      
      const openOrders = orders.filter(o => o.status !== 'Concluído').length;
      
      // Calculate sales based on filter
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      let filteredSales = 0;
      if (timeFilter === 'Hoje') {
        filteredSales = orders
          .filter(o => o.status === 'Concluído' && o.createdAt >= startOfToday)
          .reduce((acc, o) => acc + (o.total || 0), 0);
      } else if (timeFilter === 'Mês') {
        filteredSales = orders
          .filter(o => o.status === 'Concluído' && o.createdAt >= startOfMonth)
          .reduce((acc, o) => acc + (o.total || 0), 0);
      } else if (timeFilter === 'Ano') {
        filteredSales = orders
          .filter(o => o.status === 'Concluído' && o.createdAt >= startOfYear)
          .reduce((acc, o) => acc + (o.total || 0), 0);
      }

      setStatsData(prev => ({ 
        ...prev, 
        orders: openOrders,
        sales: filteredSales
      }));
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [timeFilter]);

  const stats = [
    { label: 'Itens em Estoque', value: statsData.stock.toLocaleString(), trend: 'Total', icon: Package, color: 'primary' },
    { label: `Vendas (${timeFilter})`, value: `R$ ${statsData.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, trend: timeFilter, icon: Banknote, color: 'secondary' },
    { label: 'Pedidos Abertos', value: statsData.orders.toString(), trend: 'Ativos', icon: HardHat, color: 'tertiary' },
  ];
  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-10">
      <TopBar title="Comando da Oficina" />
      
      <div className="pt-16 sm:pt-16">
        {/* Header */}
        <section className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
          <div>
            <p className="text-secondary font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-2">Status da Operação</p>
            <h1 className="text-2xl sm:text-4xl font-headline font-extrabold text-primary tracking-tight">Visão Geral da Oficina</h1>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/clients')}
              className="flex-1 sm:flex-none bg-primary/10 text-primary px-4 sm:px-6 py-3 rounded-lg font-headline font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all text-sm"
            >
              <UserPlus size={18} />
              Novo Cliente
            </button>
            <button 
              onClick={() => navigate('/new-order')}
              className="flex-1 sm:flex-none bg-secondary text-white px-4 sm:px-6 py-3 rounded-lg font-headline font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/30 hover:scale-105 transition-transform text-sm"
            >
              <FilePlus size={18} />
              Nova OS
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-lowest p-8 rounded-xl relative overflow-hidden group tonal-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-lg",
                    stat.color === 'primary' ? "bg-primary/10 text-primary" : 
                    stat.color === 'secondary' ? "bg-secondary/10 text-secondary" : 
                    "bg-primary-container/10 text-primary-container"
                  )}>
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                    {stat.trend.includes('+') && <TrendingUp size={14} />} {stat.trend}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-on-surface-variant text-sm font-medium mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-headline font-extrabold text-primary">{stat.value}</h3>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Services Table */}
        <section className="bg-surface-low p-4 sm:p-8 rounded-xl mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-secondary rounded-full"></div>
              <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-primary">Serviços do Dia</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button 
                onClick={() => setTimeFilter('Hoje')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  timeFilter === 'Hoje' ? "bg-primary text-white shadow-md" : "bg-surface-lowest text-on-surface-variant hover:text-primary"
                )}
              >
                Hoje
              </button>
              <button 
                onClick={() => setTimeFilter('Mês')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  timeFilter === 'Mês' ? "bg-primary text-white shadow-md" : "bg-surface-lowest text-on-surface-variant hover:text-primary"
                )}
              >
                Mês
              </button>
              <button 
                onClick={() => setTimeFilter('Ano')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  timeFilter === 'Ano' ? "bg-primary text-white shadow-md" : "bg-surface-lowest text-on-surface-variant hover:text-primary"
                )}
              >
                Ano
              </button>
            </div>
          </div>

          <div className="bg-surface-lowest rounded-xl overflow-hidden tonal-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-high/30 border-b border-surface-high/50">
                  <th className="px-6 py-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">Cliente / Veículo</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">Detalhes do Serviço</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-widest">Previsão</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-on-surface-variant uppercase tracking-widest text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-high/30">
                {recentServices.length > 0 ? (
                  recentServices.map((service, i) => (
                    <tr key={service.id || i} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 text-[11px] font-bold rounded-full uppercase tracking-tight",
                          service.status === 'Urgente' ? "bg-red-100 text-red-700" : 
                          service.status === 'Em Andamento' ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        )}>
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-on-surface">{service.clientName}</p>
                        <p className="text-xs text-on-surface-variant">{service.vehicleName} - {service.vehiclePlate}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm text-on-surface">
                          {service.services?.[0]?.title || service.items?.[0]?.model || 'Serviço Geral'}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {service.services?.length + service.items?.length > 1 ? `+ ${service.services?.length + service.items?.length - 1} itens` : 'Serviço único'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {service.status === 'Concluído' ? <CheckCircle size={16} className="text-green-600" /> : <Clock size={16} className="text-on-surface-variant" />}
                          <span className="text-sm font-medium text-on-surface">
                            {service.status === 'Concluído' ? 'Finalizado' : 'Ativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-headline font-bold text-primary">
                        R$ {Number(service.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
                        <Wrench size={48} />
                        <p className="font-headline font-bold text-lg">Nenhuma ordem de serviço</p>
                        <p className="text-sm max-w-xs mx-auto">As ordens de serviço recentes aparecerão aqui assim que forem criadas.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-surface-low/50 text-center">
              <button 
                onClick={() => navigate('/orders')}
                className="text-sm font-bold text-primary hover:text-secondary transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                Ver todas as O.S
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-low p-6 sm:p-8 rounded-xl flex flex-col sm:flex-row items-center gap-6 sm:gap-8 border border-white/50">
            <div className="w-full sm:w-1/3 aspect-square rounded-lg overflow-hidden relative shadow-lg">
              <img 
                src="https://picsum.photos/seed/autoparts/300/300" 
                alt="Stock" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-primary/20"></div>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-headline font-extrabold text-primary mb-3">Reposição Inteligente</h4>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Seu estoque de <b>Pastilhas de Freio Brembo (Cerâmica)</b> está abaixo da reserva de segurança. Recomendamos pedido de reposição imediata.
              </p>
              <button className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary-container transition-all">
                Ver Detalhes
              </button>
            </div>
          </div>

          <div className="bg-primary text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
              <CircleDot size={200} />
            </div>
            <div>
              <h4 className="text-xl font-headline font-extrabold mb-2">Desempenho da Equipe</h4>
              <p className="text-blue-100/70 text-sm mb-6">Eficiência média de conclusão: <b>42 min / serviço</b></p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1 uppercase tracking-tighter">
                  <span>Metas Mensais</span>
                  <span>84%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    className="h-full bg-secondary rounded-full shadow-[0_0_10px_rgba(253,108,0,0.5)]"
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
