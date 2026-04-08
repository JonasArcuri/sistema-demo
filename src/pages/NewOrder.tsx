import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { 
  ChevronRight, 
  Search, 
  User, 
  Settings2, 
  Droplets, 
  Trash2, 
  QrCode, 
  CreditCard, 
  Wallet, 
  ArrowRight,
  Rocket,
  Plus,
  Minus,
  Package,
  Wrench,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function NewOrder() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderServices, setOrderServices] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cartão');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    setLoading(false);
    return () => {
      unsubClients();
      unsubProducts();
    };
  }, []);

  const filteredClients = searchTerm.length > 1 
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.plate?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const addProductToOrder = (product: any) => {
    const existing = orderItems.find(item => item.id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setOrderItems([...orderItems, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeProduct = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const addService = (title: string, price: number) => {
    setOrderServices([...orderServices, { title, price, id: Date.now() }]);
  };

  const removeService = (id: number) => {
    setOrderServices(orderServices.filter(s => s.id !== id));
  };

  const subtotalProducts = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const subtotalServices = orderServices.reduce((acc, s) => acc + s.price, 0);
  const total = subtotalProducts + subtotalServices;

  const handleFinalize = async () => {
    setError(null);
    if (!selectedClient) {
      setError('Selecione um cliente primeiro!');
      return;
    }
    if (orderItems.length === 0 && orderServices.length === 0) {
      setError('Adicione pelo menos um item ou serviço!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use a transaction to ensure stock is updated correctly
      await runTransaction(db, async (transaction) => {
        const productUpdates: { ref: any, newStock: number }[] = [];

        // 1. ALL READS FIRST
        for (const item of orderItems) {
          const productRef = doc(db, 'products', item.id);
          const productSnap = await transaction.get(productRef);
          
          if (!productSnap.exists()) {
            throw new Error(`Produto ${item.model} não encontrado!`);
          }
          
          const currentStock = productSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(`Estoque insuficiente para ${item.model}. Disponível: ${currentStock}`);
          }

          productUpdates.push({
            ref: productRef,
            newStock: currentStock - item.quantity
          });
        }

        // 2. ALL WRITES AFTER
        for (const update of productUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock,
            updatedAt: new Date().toISOString()
          });
        }

        // 3. Create the order (Write)
        const orderRef = doc(collection(db, 'orders'));
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const finalCreatedAt = `${orderDate}T${timeStr}.000Z`;

        transaction.set(orderRef, {
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          clientPhone: selectedClient.phone,
          vehicleName: selectedClient.vehicle,
          vehiclePlate: selectedClient.plate,
          items: orderItems,
          services: orderServices,
          subtotalProducts,
          subtotalServices,
          total,
          paymentMethod,
          status: 'Pendente',
          createdAt: finalCreatedAt
        });
      });

      navigate('/orders');
    } catch (err: any) {
      console.error("Erro ao salvar ordem:", err);
      setError(err.message || "Erro ao processar a ordem.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8">
      <TopBar title="Nova Ordem de Serviço" />
      
      <div className="pt-16 space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-[10px] text-on-surface-variant mb-4 font-medium uppercase tracking-widest">
              <span>Ordens</span>
              <ChevronRight size={12} />
              <span className="text-primary">Entrada na Oficina</span>
            </nav>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Entrada na Oficina</h2>
            <p className="text-on-surface-variant text-sm mt-1">Inicialize um novo registro de diagnóstico ou serviço.</p>
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Data da O.S</label>
            <div className="relative">
              <input 
                type="date"
                className="w-full sm:w-auto bg-surface-lowest border border-surface-high py-2.5 px-4 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-primary"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" size={16} />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Area */}
          <div className="col-span-1 lg:col-span-8 space-y-8">
            {/* Client & Vehicle */}
            <section className="bg-surface-lowest rounded-xl p-4 sm:p-8 tonal-card">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-1 bg-secondary rounded-full"></div>
                <h3 className="text-lg font-bold text-primary font-headline uppercase tracking-tight">Identificação</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Busca de Cliente</label>
                    <button 
                      onClick={() => navigate('/clients')}
                      className="text-[10px] font-bold text-secondary hover:underline"
                    >
                      + Novo Cliente
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      className="w-full bg-surface-low border-b-2 border-surface-high py-3 px-4 text-sm focus:border-primary outline-none transition-all" 
                      placeholder="Nome ou Placa" 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                    
                    {filteredClients.length > 0 && !selectedClient && (
                      <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-b-xl z-50 border border-surface-high max-h-60 overflow-y-auto">
                        {filteredClients.map(client => (
                          <button 
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setSearchTerm('');
                            }}
                            className="w-full text-left p-4 hover:bg-primary/5 border-b border-surface-high last:border-none flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {client.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-primary">{client.name}</p>
                              <p className="text-[10px] text-on-surface-variant">{client.plate} • {client.vehicle}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedClient ? (
                    <div className="p-4 bg-primary/5 rounded-lg flex items-center justify-between border border-primary/10">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{selectedClient.name}</p>
                          <p className="text-[10px] text-on-surface-variant">{selectedClient.phone} • {selectedClient.status}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedClient(null)}
                        className="text-[10px] font-bold text-red-500 border border-red-200 px-3 py-1 rounded uppercase"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-surface-high rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40">
                      <User size={32} className="mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhum cliente selecionado</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Veículo Ativo</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-surface-low border-b-2 border-surface-high py-3 px-4 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      {selectedClient ? (
                        <>
                          <option value={selectedClient.vehicle}>{selectedClient.vehicle} - {selectedClient.plate}</option>
                          <option value="other">+ Cadastrar Novo Veículo</option>
                        </>
                      ) : (
                        <option>Aguardando cliente...</option>
                      )}
                    </select>
                  </div>
                  {selectedClient && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 border border-surface-high rounded-lg">
                        <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Status</p>
                        <p className="text-xs font-bold text-primary">{selectedClient.status}</p>
                      </div>
                      <div className="p-3 border border-surface-high rounded-lg">
                        <p className="text-[9px] uppercase font-bold text-on-surface-variant mb-1">Membro Desde</p>
                        <p className="text-xs font-bold text-primary">{selectedClient.since || '2024'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Services */}
            <section className="bg-surface-lowest rounded-xl p-4 sm:p-8 tonal-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-lg font-bold text-primary font-headline uppercase tracking-tight">Serviços e Mão de Obra</h3>
                </div>
                <button className="w-full sm:w-auto bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors">
                  Ver Catálogo
                </button>
              </div>

              <div className="space-y-3">
                {orderServices.length > 0 ? (
                  orderServices.map((s) => (
                    <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-surface-low rounded-lg border border-transparent hover:border-primary/20 transition-all group gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-md text-primary">
                          <Wrench size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{s.title}</p>
                          <p className="text-[10px] text-on-surface-variant">Mão de obra especializada</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-8">
                        <div className="text-right">
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold">Valor</p>
                          <p className="text-sm font-bold text-primary">R$ {s.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button 
                          onClick={() => removeService(s.id)}
                          className="text-on-surface-variant/20 group-hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border-2 border-dashed border-surface-high rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40">
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum serviço adicionado</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => addService('Alinhamento e Balanceamento', 180)}
                    className="p-3 bg-surface-high rounded-lg text-xs font-bold text-primary hover:bg-primary/5 transition-all text-left flex items-center gap-3"
                  >
                    <Plus size={14} /> Alinhamento e Balanceamento
                  </button>
                  <button 
                    onClick={() => addService('Troca de Óleo', 80)}
                    className="p-3 bg-surface-high rounded-lg text-xs font-bold text-primary hover:bg-primary/5 transition-all text-left flex items-center gap-3"
                  >
                    <Plus size={14} /> Troca de Óleo (Mão de Obra)
                  </button>
                </div>
              </div>
            </section>

            {/* Products */}
            <section className="bg-surface-lowest rounded-xl p-4 sm:p-8 tonal-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-lg font-bold text-primary font-headline uppercase tracking-tight">Estoque e Componentes</h3>
                </div>
                <div className="relative w-full sm:w-64">
                  <input 
                    className="bg-surface-low text-xs py-2 px-4 rounded-lg border border-surface-high focus:ring-1 focus:ring-primary outline-none w-full" 
                    placeholder="Buscar produto no estoque..." 
                    type="text" 
                  />
                </div>
              </div>

              <div className="space-y-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item) => (
                    <div key={item.id} className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col sm:flex-row items-center gap-4">
                      <img src={item.image || 'https://picsum.photos/seed/tire/100/100'} alt={item.model} className="h-16 w-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                          <span className="bg-secondary text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{item.brand}</span>
                          <p className="text-sm font-bold text-primary mt-1">{item.model}</p>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                            <p className="text-[10px] text-on-surface-variant">{item.size || 'N/A'}</p>
                            <span className="text-[10px] font-bold text-secondary">• Estoque: {item.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-surface-high">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-8 w-8 flex items-center justify-center text-primary hover:bg-surface-low rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs font-bold px-2">{item.quantity.toString().padStart(2, '0')}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-8 w-8 flex items-center justify-center text-primary hover:bg-surface-low rounded"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-[10px] text-on-surface-variant font-bold">Total</p>
                            <p className="text-sm font-bold text-primary">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <button 
                            onClick={() => removeProduct(item.id)}
                            className="text-on-surface-variant/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border-2 border-dashed border-surface-high rounded-xl flex flex-col items-center justify-center text-on-surface-variant/40">
                    <Package size={32} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">Nenhum produto adicionado</p>
                  </div>
                )}

                <div className="pt-4 border-t border-surface-high">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Produtos Disponíveis</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.slice(0, 4).map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addProductToOrder(product)}
                        className="flex items-center gap-3 p-3 bg-surface-low rounded-lg hover:bg-primary/5 transition-all text-left border border-transparent hover:border-primary/10"
                      >
                        <div className="w-10 h-10 bg-white rounded border border-surface-high flex items-center justify-center text-primary">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary">{product.model}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[9px] text-on-surface-variant">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <span className={cn(
                              "text-[9px] font-bold",
                              product.stock <= 5 ? "text-red-500" : "text-emerald-600"
                            )}>
                              Estoque: {product.stock}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Summary */}
          <div className="col-span-1 lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-primary rounded-2xl p-6 sm:p-8 text-white shadow-2xl shadow-primary/40">
              <h3 className="text-xl font-extrabold font-headline mb-8 flex items-center gap-3">
                <BarChart3 className="text-secondary" />
                Resumo do Pedido
              </h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center text-blue-100/70 border-b border-white/10 pb-4">
                  <span className="text-xs font-medium">Subtotal Serviços</span>
                  <span className="text-sm font-bold">R$ {subtotalServices.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-blue-100/70 border-b border-white/10 pb-4">
                  <span className="text-xs font-medium">Subtotal Produtos</span>
                  <span className="text-sm font-bold">R$ {subtotalProducts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-blue-100/70 border-b border-white/10 pb-4">
                  <span className="text-xs font-medium">Descontos</span>
                  <span className="text-sm font-bold text-secondary-container">- R$ 0,00</span>
                </div>
                
                <div className="py-4">
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Total Geral</p>
                  <p className="text-4xl font-extrabold text-white">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="space-y-3 mt-8">
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-2">Pagamento</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentMethod('PIX')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'PIX' ? "bg-white text-primary border-white shadow-xl" : "border-white/20 hover:border-white hover:bg-white/10"
                      )}
                    >
                      <QrCode size={20} />
                      <span className="text-[10px] font-bold">PIX</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('Cartão')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'Cartão' ? "bg-white text-primary border-white shadow-xl" : "border-white/20 hover:border-white hover:bg-white/10"
                      )}
                    >
                      <CreditCard size={20} />
                      <span className="text-[10px] font-bold">Cartão</span>
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('Fiado')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                        paymentMethod === 'Fiado' ? "bg-white text-primary border-white shadow-xl" : "border-white/20 hover:border-white hover:bg-white/10"
                      )}
                    >
                      <Wallet size={20} />
                      <span className="text-[10px] font-bold">Fiado</span>
                    </button>
                  </div>
                </div>

                <div className="mt-10">
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}
                  <button 
                    onClick={handleFinalize}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full bg-secondary text-white py-5 rounded-xl font-black text-lg shadow-2xl shadow-secondary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3",
                      isSubmitting && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? 'Processando...' : 'Finalizar Ordem'}
                    <ArrowRight size={20} />
                  </button>
                  <p className="text-center text-blue-100/40 text-[10px] mt-4">Fatura enviada via WhatsApp.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-surface-low rounded-xl p-6 border border-surface-high">
              <h4 className="text-xs font-bold text-primary mb-4 flex items-center gap-2">
                <Rocket size={14} /> Atalhos
              </h4>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 text-[11px] font-medium text-on-surface-variant hover:bg-white rounded-lg transition-colors flex items-center justify-between">
                  Imprimir Diagnóstico
                  <span className="text-[9px] bg-surface-high px-2 py-0.5 rounded">CTRL+P</span>
                </button>
                <button className="w-full text-left px-4 py-2 text-[11px] font-medium text-on-surface-variant hover:bg-white rounded-lg transition-colors flex items-center justify-between">
                  Requisição de Peças
                  <span className="text-[9px] bg-surface-high px-2 py-0.5 rounded">CTRL+R</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BarChart3 = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);
