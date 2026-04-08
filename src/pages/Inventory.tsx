import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { 
  Download, 
  PlusSquare, 
  AlertTriangle, 
  BarChart3, 
  Filter, 
  RotateCcw, 
  MapPin, 
  MoreHorizontal,
  Package,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X, Edit2 } from 'lucide-react';

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');
  const [categories, setCategories] = useState(['Pneus', 'Peças', 'Lubrificantes', 'Acessórios']);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [newProduct, setNewProduct] = useState({
    brand: '',
    model: '',
    category: 'Pneus',
    size: '',
    price: '',
    stock: '',
    minStock: '5',
    location: '',
    sku: '',
    status: 'active'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('brand', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as any));
      setInventoryItems(items);
      
      // Extract unique categories from ALL items (active and inactive)
      const uniqueCategories = Array.from(new Set([
        'Pneus', 'Peças', 'Lubrificantes', 'Acessórios',
        ...items.map(item => item.category).filter(Boolean)
      ]));
      setCategories(uniqueCategories);
      
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar estoque:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setNewProduct({
        brand: product.brand,
        model: product.model,
        category: product.category || 'Pneus',
        size: product.size || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: (product.minStock || 5).toString(),
        location: product.location || '',
        sku: product.sku || '',
        status: product.status || 'active'
      });
    } else {
      setEditingProduct(null);
      setNewProduct({
        brand: '',
        model: '',
        category: 'Pneus',
        size: '',
        price: '',
        stock: '',
        minStock: '5',
        location: '',
        sku: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        minStock: parseInt(newProduct.minStock),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const handleToggleStatus = async (product: any) => {
    try {
      const newStatus = product.status === 'inactive' ? 'active' : 'inactive';
      await updateDoc(doc(db, 'products', product.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao alterar status do produto:", error);
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesStatus = showInactive ? item.status === 'inactive' : (item.status === 'active' || !item.status);
    const matchesCategory = selectedCategory === 'Todas as Categorias' || item.category === selectedCategory;
    return matchesStatus && matchesCategory;
  });

  const criticalItems = inventoryItems.filter(item => (item.status === 'active' || !item.status) && item.stock <= (item.minStock || 5));
  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8">
      <TopBar title="Inventário de Pneus" />
      
      <div className="pt-16 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Gestão de Estoque</h2>
            <p className="text-on-surface-variant mt-1 text-sm">Controle em tempo real e logística diagnóstica.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 font-bold rounded-xl transition-all text-xs sm:text-sm",
                showInactive 
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                  : "bg-surface-high text-on-surface-variant hover:bg-surface-high/80"
              )}
            >
              {showInactive ? <Eye size={18} /> : <EyeOff size={18} />}
              <span className="whitespace-nowrap">{showInactive ? 'Ver Ativos' : 'Itens Inativos'}</span>
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-xs sm:text-sm">
              <Download size={18} />
              <span className="whitespace-nowrap">Exportar</span>
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-secondary text-white font-bold rounded-xl shadow-lg shadow-secondary/20 hover:brightness-110 transition-all text-xs sm:text-sm"
            >
              <PlusSquare size={18} />
              <span className="whitespace-nowrap">Adicionar Estoque</span>
            </button>
          </div>
        </div>

        {/* Alerts & Stats */}
        <div className="grid grid-cols-12 gap-6">
          {criticalItems.length > 0 && (
            <div className="col-span-12 lg:col-span-8 bg-red-50 border-l-4 border-red-600 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-lg leading-tight">Escassez Crítica de Inventário</h4>
                  <p className="text-red-700 text-sm">{criticalItems.length} itens SKU críticos estão abaixo do limite de segurança.</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg text-xs uppercase tracking-wider hover:bg-red-700 transition-all">Revisar Faltas</button>
            </div>
          )}

          <div className={cn(
            "col-span-12 p-6 relative overflow-hidden shadow-xl shadow-primary/10 rounded-xl bg-primary text-white",
            criticalItems.length > 0 ? "lg:col-span-4" : "lg:col-span-12"
          )}>
            <div className="relative z-10">
              <p className="text-blue-100/60 text-xs font-bold uppercase tracking-widest mb-1">Avaliação Ativa</p>
              <h3 className="text-3xl font-extrabold mb-4 tracking-tighter">
                R$ {inventoryItems.reduce((acc, item) => acc + (item.price * item.stock), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <div className="flex justify-between items-center text-xs font-bold text-blue-100/80">
                <span>TOTAL DE UNIDADES: {inventoryItems.reduce((acc, item) => acc + item.stock, 0)}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400"></span> SINCRONIZADO</span>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <BarChart3 size={120} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-low rounded-xl p-6 flex flex-wrap gap-6 items-end tonal-card">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-1">Categoria</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-surface-lowest border-none rounded-lg py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer outline-none"
            >
              <option>Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setSelectedCategory('Todas as Categorias')}
              className="bg-white border border-surface-high p-2.5 rounded-lg text-primary hover:bg-surface-high transition-all"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-lowest rounded-2xl overflow-hidden tonal-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-low border-b border-surface-high/50">
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Produto</th>
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Medida</th>
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Preço</th>
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider text-center">Estoque</th>
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">Localização</th>
                <th className="py-4 px-6 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-high/30">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-primary/5 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-surface p-1 border border-surface-high overflow-hidden">
                          <img src={item.image || 'https://picsum.photos/seed/part/100/100'} alt={item.model} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-0.5">{item.brand}</p>
                          <h5 className="font-extrabold text-primary leading-tight">{item.model}</h5>
                          <p className="text-[11px] text-on-surface-variant font-medium">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      {item.category === 'Pneus' && item.size ? (
                        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">{item.size}</span>
                      ) : (
                        <span className="text-on-surface-variant/40 text-[10px] italic">N/A</span>
                      )}
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-sm font-extrabold text-primary">
                        R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={cn(
                          "text-base font-extrabold",
                          item.stock <= (item.minStock || 5) ? "text-red-600" : "text-primary"
                        )}>{item.stock}</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          item.stock <= (item.minStock || 5) ? "text-red-600/60" : "text-primary/60"
                        )}>{item.stock <= (item.minStock || 5) ? 'Crítico' : 'Ideal'}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-on-surface">{item.location || 'Não definido'}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 hover:bg-white rounded-lg shadow-sm border border-surface-high text-on-surface-variant transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(item)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            item.status === 'inactive' 
                              ? "hover:bg-green-50 text-green-600 border border-green-200" 
                              : "hover:bg-amber-50 text-amber-600 border border-amber-200"
                          )}
                          title={item.status === 'inactive' ? 'Reativar' : 'Inativar'}
                        >
                          {item.status === 'inactive' ? <Archive size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-on-surface-variant/40">
                      <Package size={48} />
                      <p className="font-headline font-bold text-lg">Nenhum item no estoque</p>
                      <p className="text-sm max-w-xs mx-auto">Comece adicionando novos produtos ao seu inventário para gerenciar sua loja.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-low px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-high/50">
          <p className="text-xs font-medium text-on-surface-variant">Exibindo {filteredItems.length} itens</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-white border border-surface-high rounded text-xs font-bold text-primary">1</button>
              <button className="px-3 py-1 rounded text-xs font-bold text-on-surface-variant hover:bg-surface-high">2</button>
              <button className="px-3 py-1 rounded text-xs font-bold text-on-surface-variant hover:bg-surface-high">3</button>
            </div>
          </div>
        </div>
      </div>
      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/50"
          >
            <div className="p-6 border-b border-surface-high flex justify-between items-center bg-surface-low">
              <h3 className="text-xl font-headline font-bold text-primary">
                {editingProduct ? 'Editar Item' : 'Novo Item no Estoque'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-high rounded-lg transition-colors">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Marca</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="Ex: Michelin, Brembo"
                    value={newProduct.brand}
                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Modelo / Nome</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="Ex: Pilot Sport 4S"
                    value={newProduct.model}
                    onChange={e => setNewProduct({...newProduct, model: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Categoria</label>
                  {isAddingCategory ? (
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        placeholder="Nome da nova categoria"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            setCategories(prev => [...prev, newCategoryName.trim()]);
                            setNewProduct({...newProduct, category: newCategoryName.trim()});
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        className="bg-primary text-white p-3 rounded-lg hover:bg-primary-container transition-all"
                      >
                        <Plus size={18} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="bg-surface-high text-on-surface-variant p-3 rounded-lg hover:bg-surface-low transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        className="bg-primary/10 text-primary p-3 rounded-lg hover:bg-primary/20 transition-all"
                        title="Nova Categoria"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>
                {newProduct.category === 'Pneus' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider">Medida (Aro/Perfil)</label>
                    <input 
                      required
                      className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                      placeholder="Ex: 225/45 R17"
                      value={newProduct.size}
                      onChange={e => setNewProduct({...newProduct, size: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">SKU / Código</label>
                  <input 
                    required
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="Ex: SKU-12345"
                    value={newProduct.sku}
                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Preço (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="0,00"
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Estoque Inicial</label>
                  <input 
                    required
                    type="number"
                    className="w-full bg-surface-high border-none rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                  />
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
                  {editingProduct ? 'Salvar Alterações' : 'Salvar no Banco'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
