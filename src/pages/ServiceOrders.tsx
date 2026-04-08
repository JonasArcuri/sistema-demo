import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from '../components/TopBar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Search, 
  Filter, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight,
  MoreHorizontal,
  FileText,
  Trash2,
  UserPlus,
  FilePlus,
  X,
  Calendar,
  MapPin,
  Phone,
  Car,
  Package,
  Wrench,
  CreditCard
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function ServiceOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(items);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar ordens:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFinalize = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Concluído',
        finalizedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao finalizar ordem:", error);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handlePrint = async () => {
    if (!printRef.current || !selectedOrder) return;
    
    setIsPrinting(true);
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Force hex colors for common problematic elements in the clone
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Remove any classes that might trigger oklch in computed styles
            if (el.className && typeof el.className === 'string') {
              if (el.className.includes('/') || el.className.includes('primary')) {
                // We've already replaced the main ones with hex in JSX, 
                // but this is an extra safety layer
              }
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`OS-${selectedOrder.id.toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !dateFilter || (order.createdAt && order.createdAt.startsWith(dateFilter));
    
    return matchesSearch && matchesDate;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Concluído':
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'Em Andamento':
        return "bg-blue-50 text-blue-700 border-blue-200";
      case 'Pendente':
        return "bg-amber-50 text-amber-700 border-amber-200";
      case 'Urgente':
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <CheckCircle size={14} />;
      case 'Em Andamento':
        return <Clock size={14} />;
      case 'Pendente':
        return <AlertCircle size={14} />;
      case 'Urgente':
        return <AlertCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8">
      <TopBar title="Gestão de O.S" />
      
      <div className="pt-16 space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Histórico de O.S</h2>
            <p className="text-on-surface-variant font-medium text-sm">Acompanhamento de serviços e faturamento.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/clients')}
              className="flex-1 sm:flex-none bg-primary/10 text-primary px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all text-xs sm:text-sm"
            >
              <UserPlus size={18} />
              <span className="whitespace-nowrap">Novo Cliente</span>
            </button>
            <button 
              onClick={() => navigate('/new-order')}
              className="flex-1 sm:flex-none bg-secondary text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 hover:brightness-110 transition-all text-xs sm:text-sm"
            >
              <FilePlus size={18} />
              <span className="whitespace-nowrap">Nova OS</span>
            </button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-4">
              <div className="relative w-full sm:w-auto">
                <input 
                  type="date"
                  className="w-full bg-surface-lowest border border-surface-high rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="relative w-full sm:w-64">
                <input 
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-surface-lowest border border-surface-high rounded-xl py-2.5 px-4 pl-10 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              </div>
            </div>
          </div>
        </header>

        <div className="bg-surface-lowest rounded-2xl overflow-hidden tonal-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-low border-b border-surface-high/50">
                  <th className="py-4 px-8 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">O.S / Data</th>
                  <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Cliente</th>
                  <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Veículo / Placa</th>
                  <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Total</th>
                  <th className="py-4 px-8 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-high/30">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="py-5 px-8">
                        <div>
                          <p className="text-sm font-bold text-primary">#{order.id.substring(0, 6).toUpperCase()}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-on-surface">{order.clientName}</p>
                        <p className="text-[10px] text-on-surface-variant">{order.clientPhone}</p>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-on-surface">{order.vehicleName}</p>
                        <span className="bg-surface-high px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-surface-high/50">
                          {order.vehiclePlate}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusStyle(order.status)
                        )}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-extrabold text-primary">
                          R$ {Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {order.status !== 'Concluído' && (
                            <button 
                              onClick={() => handleFinalize(order.id)}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                              title="Finalizar Ordem"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewOrder(order)}
                            className="p-2 bg-surface-high text-primary rounded-lg hover:bg-white transition-all"
                            title="Visualizar O.S"
                          >
                            <FileText size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
                        <FileText size={48} />
                        <p className="font-headline font-bold text-lg">Nenhuma ordem encontrada</p>
                        <p className="text-sm max-w-xs mx-auto">As ordens de serviço cadastradas aparecerão aqui.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* View Order Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewModalOpen(false)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div ref={printRef} className="flex flex-col flex-1 overflow-y-auto bg-white">
                {/* Modal Header */}
                <div className="bg-primary p-8 text-white flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="text-secondary" size={24} />
                      <h3 className="text-2xl font-black font-headline uppercase tracking-tight">Ordem de Serviço</h3>
                    </div>
                    <p className="text-[#bfdbfe] text-sm font-bold">#{selectedOrder.id.toUpperCase()} • {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <button 
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors print:hidden"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 p-8 space-y-8">
                  {/* Client & Vehicle Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest border-b border-surface-high pb-2">Dados do Cliente</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f2f4f8] flex items-center justify-center text-primary">
                            <UserPlus size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">Nome</p>
                            <p className="text-sm font-medium text-on-surface">{selectedOrder.clientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f2f4f8] flex items-center justify-center text-primary">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">Telefone</p>
                            <p className="text-sm font-medium text-on-surface">{selectedOrder.clientPhone}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest border-b border-surface-high pb-2">Dados do Veículo</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f2f4f8] flex items-center justify-center text-primary">
                            <Car size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">Veículo</p>
                            <p className="text-sm font-medium text-on-surface">{selectedOrder.vehicleName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#f2f4f8] flex items-center justify-center text-primary">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-primary">Placa</p>
                            <p className="text-sm font-mono font-bold text-on-surface">{selectedOrder.vehiclePlate}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items & Services */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest border-b border-surface-high pb-2">Itens e Serviços</h4>
                    
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-surface-low rounded-xl border border-surface-high">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-surface-high flex items-center justify-center text-primary">
                              <Package size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{item.model}</p>
                              <p className="text-[10px] text-on-surface-variant">{item.brand} • Qtd: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-primary">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                      
                      {selectedOrder.services?.map((service: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-surface-low rounded-xl border border-surface-high">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-surface-high flex items-center justify-center text-primary">
                              <Wrench size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{service.title}</p>
                              <p className="text-[10px] text-on-surface-variant">Mão de obra</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-primary">R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-[#f2f4f8] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-[#e6eaf2]">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Forma de Pagamento</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-primary">
                        <CreditCard size={18} />
                        <span className="text-sm font-bold">{selectedOrder.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total da O.S</p>
                      <p className="text-2xl sm:text-3xl font-black text-primary">R$ {selectedOrder.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-surface-low border-t border-surface-high flex justify-end gap-3">
                <button 
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-surface-high rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-high transition-all"
                >
                  Fechar
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isPrinting ? (
                    <>Gerando PDF...</>
                  ) : (
                    <>
                      <Download size={18} />
                      Imprimir O.S
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
