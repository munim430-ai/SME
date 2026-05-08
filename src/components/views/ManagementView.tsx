import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { TRANSLATIONS } from '../../constants';
import { UserProfile, Language, InventoryItem, PurchaseOrder, Vendor } from '../../types';
import { 
  ChevronLeft, 
  Package, 
  ShoppingCart, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ArrowRight,
  Archive,
  Truck,
  Users,
  Phone,
  MapPin,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function ManagementView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'vendors'>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', category: 'FEED', quantity: 0, unit: 'Bags', minStock: 5, vendorId: '' });
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({ name: '', phone: '', category: 'Feed Supplier' });
  const [newOrder, setNewOrder] = useState<Partial<PurchaseOrder>>({ supplierName: '', vendorId: '', items: [{ name: '', quantity: 1, price: 0 }], totalAmount: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid || uid === 'guest-preview') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const q = query(collection(db, 'inventory'), where('ownerId', '==', uid));
        const snap = await getDocs(q);
        setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
        
        // Also fetch vendors for the dropdown in add inventory
        const vq = query(collection(db, 'vendors'), where('ownerId', '==', uid));
        const vsnap = await getDocs(vq);
        setVendors(vsnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
      } else if (activeTab === 'orders') {
        const q = query(collection(db, 'orders'), where('ownerId', '==', uid));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
        
        const vq = query(collection(db, 'vendors'), where('ownerId', '==', uid));
        const vsnap = await getDocs(vq);
        setVendors(vsnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
      } else {
        const q = query(collection(db, 'vendors'), where('ownerId', '==', uid));
        const snap = await getDocs(q);
        setVendors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor)));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, activeTab);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid) return;
    try {
      if (activeTab === 'inventory') {
        await addDoc(collection(db, 'inventory'), { ...newItem, ownerId: uid, updatedAt: new Date().toISOString() });
      } else if (activeTab === 'vendors') {
        await addDoc(collection(db, 'vendors'), { ...newVendor, ownerId: uid, updatedAt: new Date().toISOString() });
      } else {
        const total = newOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
        await addDoc(collection(db, 'orders'), {
          ...newOrder,
          totalAmount: total,
          ownerId: uid,
          status: 'PENDING',
          orderDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
      resetForms();
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, activeTab);
    }
  };

  const resetForms = () => {
    setNewItem({ name: '', category: 'FEED', quantity: 0, unit: 'Bags', minStock: 5, vendorId: '' });
    setNewVendor({ name: '', phone: '', category: 'Feed Supplier' });
    setNewOrder({ supplierName: '', vendorId: '', items: [{ name: '', quantity: 1, price: 0 }], totalAmount: 0 });
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    try {
      await updateDoc(doc(db, 'inventory', id), { 
        quantity: newQty,
        updatedAt: new Date().toISOString()
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'inventory');
    }
  };

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-[#FAFAFA] text-zinc-900")}>
      <div className={cn("p-6 border-b sticky top-0 z-20 transition-colors",
        darkMode ? "bg-zinc-900 border-white/5 shadow-none" : "bg-white border-gray-100 shadow-sm")}>
         <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 text-zinc-400 hover:text-white" : "bg-gray-50 text-gray-500")}>
              <ChevronLeft size={24} />
            </button>
            <h2 className={cn("text-xl font-black tracking-tight italic uppercase transition-colors",
              darkMode ? "text-white" : "text-zinc-950")}>Management Hub</h2>
            <div className="w-10" />
         </div>

         <div className={cn("flex p-1 rounded-2xl overflow-x-auto transition-colors",
           darkMode ? "bg-white/5" : "bg-gray-100")}>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'inventory' 
                  ? (darkMode ? "bg-white text-zinc-950 shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
              )}
            >
              <Package size={14} /> Inventory
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'orders' 
                  ? (darkMode ? "bg-white text-zinc-950 shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
              )}
            >
              <Truck size={14} /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('vendors')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                activeTab === 'vendors' 
                  ? (darkMode ? "bg-white text-zinc-950 shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
              )}
            >
              <Users size={14} /> Vendors
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                 darkMode ? "text-zinc-500" : "text-gray-400")}>Stock Levels</h3>
               <button 
                 onClick={() => { resetForms(); setShowAddModal(true); }}
                 className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors",
                   darkMode ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600")}
               >
                 <Plus size={14} /> Add Item
               </button>
            </div>
            {inventory.map(item => (
              <motion.div key={item.id} className={cn("p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", 
                     item.quantity <= item.minStock 
                       ? (darkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600") 
                       : (darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")
                   )}>
                      <Package size={24} />
                   </div>
                   <div>
                      <p className={cn("font-bold transition-colors", darkMode ? "text-white" : "text-gray-900")}>{item.name}</p>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest transition-colors",
                        darkMode ? "text-zinc-500" : "text-gray-400")}>{item.category}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right mr-4">
                      <p className={cn("text-lg font-black transition-colors", 
                        item.quantity <= item.minStock ? "text-orange-600" : (darkMode ? "text-white" : "text-zinc-900"))}>
                        {item.quantity} <span className={cn("text-xs font-normal transition-colors",
                          darkMode ? "text-zinc-500" : "text-gray-400")}>{item.unit}</span>
                      </p>
                      {item.quantity <= item.minStock && <p className="text-[8px] font-black uppercase text-orange-500 tracking-widest flex items-center gap-1 justify-end"><AlertTriangle size={8} /> Low Stock</p>}
                   </div>
                   <div className="flex flex-col gap-1">
                      <button onClick={() => updateQuantity(item.id, 1)} className={cn("p-1 rounded-lg transition-colors",
                        darkMode ? "bg-white/5 text-zinc-400 hover:text-white" : "hover:bg-gray-100 text-gray-400")}>
                        <Plus size={16} />
                      </button>
                      <button onClick={() => updateQuantity(item.id, -1)} className={cn("p-1 rounded-lg transition-colors",
                        darkMode ? "bg-white/5 text-zinc-400 hover:text-white" : "hover:bg-gray-100 text-gray-400")}>
                        <X size={16} />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                 darkMode ? "text-zinc-500" : "text-gray-400")}>Procurements</h3>
               <button 
                 onClick={() => { resetForms(); setShowAddModal(true); }}
                 className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors",
                   darkMode ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600")}
               >
                 <Plus size={14} /> New Order
               </button>
            </div>
            {orders.map(order => (
               <div key={order.id} className={cn("p-5 rounded-3xl border shadow-sm transition-colors",
                 darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <p className={cn("font-black italic transition-colors",
                         darkMode ? "text-white" : "text-zinc-900")}>{order.supplierName}</p>
                       <p className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors",
                         darkMode ? "text-zinc-500" : "text-gray-400")}>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors", 
                      order.status === 'RECEIVED' 
                        ? (darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600") 
                        : (darkMode ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-600")
                    )}>
                       {order.status}
                    </div>
                 </div>
                 <div className={cn("space-y-2 border-t pt-4 transition-colors",
                   darkMode ? "border-white/5" : "border-gray-50")}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                         <span className={cn("transition-colors", darkMode ? "text-zinc-400" : "text-gray-500")}>{item.name} x {item.quantity}</span>
                         <span className={cn("font-bold transition-colors", darkMode ? "text-white" : "text-zinc-900")}>Tk {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className={cn("flex justify-between text-sm font-black pt-2 border-t border-dashed transition-colors",
                      darkMode ? "border-white/10" : "border-gray-100")}>
                       <span>Total Amount</span>
                       <span>Tk {order.totalAmount}</span>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
               <h3 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                 darkMode ? "text-zinc-500" : "text-gray-400")}>Business Network</h3>
               <button 
                 onClick={() => { resetForms(); setShowAddModal(true); }}
                 className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors",
                   darkMode ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600")}
               >
                 <Plus size={14} /> Add Vendor
               </button>
            </div>
            {vendors.map(vendor => (
              <div key={vendor.id} className={cn("p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                 <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-50 text-gray-400")}>
                       <Users size={24} />
                    </div>
                    <div>
                       <p className={cn("font-black transition-colors", darkMode ? "text-white" : "text-gray-900")}>{vendor.name}</p>
                       <div className={cn("flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors",
                         darkMode ? "text-zinc-500" : "text-gray-400")}>
                          <Phone size={10} /> {vendor.phone}
                       </div>
                    </div>
                 </div>
                 <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors",
                   darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-50 text-gray-500")}>
                    {vendor.category}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("w-full max-w-md rounded-t-[40px] p-8 z-10 max-h-[90vh] overflow-y-auto transition-colors",
               darkMode ? "bg-zinc-900" : "bg-white")}>
                <div className="flex items-center justify-between mb-8">
                   <h3 className={cn("text-2xl font-black tracking-tight italic transition-colors",
                     darkMode ? "text-white" : "text-zinc-950")}>
                      {activeTab === 'inventory' ? 'Add Item' : activeTab === 'orders' ? 'New Order' : 'Add Vendor'}
                   </h3>
                   <button onClick={() => setShowAddModal(false)} className={cn("p-2 rounded-full transition-colors",
                     darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-100 text-zinc-600")}><X size={20} /></button>
                </div>
                
                <div className="space-y-6">
                   {activeTab === 'inventory' && (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Item Name</p>
                           <input className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} placeholder="Feed Gold / Layer Mix" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                             <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                               darkMode ? "text-zinc-500" : "text-gray-400")}>Quantity</p>
                             <input type="number" className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                               darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} />
                           </div>
                           <div className="space-y-2">
                             <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                               darkMode ? "text-zinc-500" : "text-gray-400")}>Unit</p>
                             <select className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                               darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                                <option value="Bags" className={darkMode ? "bg-zinc-900" : ""}>Bags</option>
                                <option value="Kg" className={darkMode ? "bg-zinc-900" : ""}>Kg</option>
                                <option value="Units" className={darkMode ? "bg-zinc-900" : ""}>Units</option>
                                <option value="Litres" className={darkMode ? "bg-zinc-900" : ""}>Litres</option>
                             </select>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Min. Alert Level</p>
                           <input type="number" className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Vendor (Optional)</p>
                           <select className={cn("w-full text-lg font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newItem.vendorId} onChange={e => setNewItem({...newItem, vendorId: e.target.value})}>
                              <option value="" className={darkMode ? "bg-zinc-900" : ""}>Select Vendor</option>
                              {vendors.map(v => <option key={v.id} value={v.id} className={darkMode ? "bg-zinc-900" : ""}>{v.name}</option>)}
                           </select>
                        </div>
                     </div>
                   )}

                   {activeTab === 'vendors' && (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Vendor Name</p>
                           <input className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} placeholder="Rahim Feed Supply" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Phone Number</p>
                           <input className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} placeholder="017XXXXXXXX" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Category</p>
                           <select className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})}>
                              <option value="Feed Supplier" className={darkMode ? "bg-zinc-900" : ""}>Feed Supplier</option>
                              <option value="Hatchery" className={darkMode ? "bg-zinc-900" : ""}>Hatchery</option>
                              <option value="Medicine Shop" className={darkMode ? "bg-zinc-900" : ""}>Medicine Shop</option>
                              <option value="Wholesaler" className={darkMode ? "bg-zinc-900" : ""}>Wholesaler</option>
                           </select>
                        </div>
                     </div>
                   )}

                   {activeTab === 'orders' && (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className={cn("text-xs font-bold uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Select Vendor</p>
                           <select className={cn("w-full text-xl font-bold border-b-2 bg-transparent outline-none pb-2 transition-all",
                             darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")} value={newOrder.vendorId} onChange={e => {
                             const v = vendors.find(vend => vend.id === e.target.value);
                             setNewOrder({...newOrder, vendorId: e.target.value, supplierName: v?.name || ''});
                           }}>
                              <option value="" className={darkMode ? "bg-zinc-900" : ""}>Choose Supplier</option>
                              {vendors.map(v => <option key={v.id} value={v.id} className={darkMode ? "bg-zinc-900" : ""}>{v.name}</option>)}
                           </select>
                        </div>
                        
                        <div className="space-y-4">
                           <p className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                             darkMode ? "text-zinc-500" : "text-gray-400")}>Order Items</p>
                           {newOrder.items?.map((item, idx) => (
                             <div key={idx} className={cn("p-4 rounded-2xl space-y-4 transition-colors",
                               darkMode ? "bg-white/5" : "bg-gray-50")}>
                                <input className={cn("w-full bg-transparent font-bold border-b outline-none transition-all",
                                  darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-200 focus:border-blue-500")} placeholder="Item Name" value={item.name} onChange={e => {
                                  const items = [...(newOrder.items || [])];
                                  items[idx].name = e.target.value;
                                  setNewOrder({...newOrder, items});
                                }} />
                                <div className="grid grid-cols-2 gap-4">
                                   <input type="number" className={cn("bg-transparent font-bold border-b outline-none transition-all",
                                     darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-200 focus:border-blue-500")} placeholder="Qty" value={item.quantity} onChange={e => {
                                     const items = [...(newOrder.items || [])];
                                     items[idx].quantity = Number(e.target.value);
                                     setNewOrder({...newOrder, items});
                                   }} />
                                   <input type="number" className={cn("bg-transparent font-bold border-b outline-none transition-all",
                                     darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-200 focus:border-blue-500")} placeholder="Price" value={item.price} onChange={e => {
                                     const items = [...(newOrder.items || [])];
                                     items[idx].price = Number(e.target.value);
                                     setNewOrder({...newOrder, items});
                                   }} />
                                </div>
                             </div>
                           ))}
                           <button onClick={() => setNewOrder({...newOrder, items: [...(newOrder.items || []), {name: '', quantity: 1, price: 0}]})} className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mx-auto py-2 transition-colors",
                             darkMode ? "text-blue-400" : "text-blue-600")}>
                             <Plus size={14} /> Add Another Item
                           </button>
                        </div>
                     </div>
                   )}

                   <button 
                     onClick={handleCreate}
                     className={cn("w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs mt-8 shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95",
                       darkMode ? "bg-white text-zinc-950 shadow-blue-500/10" : "bg-zinc-900 text-white shadow-zinc-200")}
                   >
                      Confirm Action <ArrowRight size={18} />
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
