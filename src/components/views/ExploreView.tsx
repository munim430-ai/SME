import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Users, 
  CheckCircle2,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { TRANSLATIONS } from '../../constants';
import { Language } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ExploreView({ setView, lang, darkMode }: { setView: (v: any) => void, lang: Language, darkMode?: boolean }) {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<'rates' | 'vendors'>('vendors');
  const [searchQuery, setSearchQuery] = useState('');

  const rates = [
    { name: 'Broiler Chicken', price: '145.00', unit: 'kg', trend: 'up' },
    { name: 'Layer Chicken', price: '160.00', unit: 'kg', trend: 'down' },
    { name: 'Eggs (Dozen)', price: '140.00', unit: 'dz', trend: 'up' },
    { name: 'Cow Milk', price: '85.00', unit: 'ltr', trend: 'minus' },
    { name: 'Poultry Feed', price: '3200.00', unit: '50kg', trend: 'up' },
  ];

  const publicVendors = [
    {
      id: 'v1',
      name: 'Rahman Hatchery & Chicks',
      category: 'Hatchery',
      rating: 4.8,
      reviews: 124,
      location: 'Gazipur Sadar',
      phone: '+8801711223344',
      verified: true,
      image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=200&h=200&auto=format&fit=crop'
    },
    {
      id: 'v2',
      name: 'Golden Feed Solutions',
      category: 'Feed Supplier',
      rating: 4.5,
      reviews: 89,
      location: 'Sreepur, Gazipur',
      phone: '+8801822334455',
      verified: true,
      image: 'https://images.unsplash.com/photo-1594489428504-5c0c480a15fd?q=80&w=200&h=200&auto=format&fit=crop'
    },
    {
      id: 'v3',
      name: 'Bhai Bhai Veterinary',
      category: 'Medicine Shop',
      rating: 4.2,
      reviews: 56,
      location: 'Joydebpur',
      phone: '+8801933445566',
      verified: false,
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=200&h=200&auto=format&fit=crop'
    },
    {
      id: 'v4',
      name: 'QuickPoultry Logistics',
      category: 'Transport',
      rating: 4.9,
      reviews: 210,
      location: 'Tonghi',
      phone: '+8801544556677',
      verified: true,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=200&h=200&auto=format&fit=crop'
    }
  ];

  const filteredVendors = publicVendors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", 
      darkMode ? "bg-zinc-950" : "bg-[#F5F5F7]")}>
      {/* Header */}
      <div className={cn("p-6 border-b sticky top-0 z-10 shadow-sm transition-colors duration-300",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
              <ChevronLeft size={24} />
            </button>
            <h2 className={cn("text-xl font-black italic tracking-tight transition-colors",
              darkMode ? "text-white" : "text-zinc-900")}>Explore</h2>
         </div>

         <div className={cn("flex p-1 rounded-2xl transition-colors",
           darkMode ? "bg-white/5" : "bg-gray-100")}>
            <button 
              onClick={() => setActiveTab('vendors')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'vendors' 
                  ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : (darkMode ? "text-zinc-500 hover:text-zinc-400" : "text-gray-400 hover:text-gray-600")
              )}
            >
              Find Vendors
            </button>
            <button 
              onClick={() => setActiveTab('rates')}
              className={cn(
                "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'rates' 
                  ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                  : (darkMode ? "text-zinc-500 hover:text-zinc-400" : "text-gray-400 hover:text-gray-600")
              )}
            >
              Market Rates
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
         <AnimatePresence mode="wait">
            {activeTab === 'rates' ? (
              <motion.div 
                key="rates"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                  <div className="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl flex items-center justify-between mb-6">
                    <div>
                        <p className="text-xs uppercase font-bold tracking-widest text-blue-100 mb-1">Gazipur Market Hub</p>
                        <h3 className="text-2xl font-black italic">Live Prices</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <TrendingUp size={24} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {rates.map((rate, idx) => (
                      <div key={idx} className={cn("p-5 rounded-3xl flex items-center justify-between border shadow-sm transition-colors",
                        darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", 
                                rate.trend === 'up' 
                                  ? (darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500") 
                                  : rate.trend === 'down' 
                                    ? (darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-500") 
                                    : (darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-50 text-gray-400")
                            )}>
                                {rate.trend === 'up' ? <TrendingUp size={24} /> : rate.trend === 'down' ? <TrendingDown size={24} /> : <Minus size={24} />}
                            </div>
                            <div>
                                <p className={cn("font-bold transition-colors", darkMode ? "text-white" : "text-gray-900")}>{rate.name}</p>
                                <p className={cn("text-[10px] uppercase font-bold tracking-widest transition-colors",
                                  darkMode ? "text-zinc-500" : "text-gray-400")}>per {rate.unit}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-xl font-black transition-colors", darkMode ? "text-white" : "text-[#1D1D1F]")}>Tk {rate.price}</p>
                          </div>
                      </div>
                    ))}
                  </div>
              </motion.div>
            ) : (
              <motion.div 
                key="vendors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                 {/* Search */}
                 <div className="relative">
                    <div className={cn("absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors",
                      darkMode ? "text-zinc-500" : "text-gray-400")}>
                       <Search size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search vendors, location or category..." 
                      className={cn("w-full border rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm outline-none focus:ring-2 transition-all",
                        darkMode ? "bg-white/5 border-white/5 text-white focus:ring-blue-500/40 placeholder:text-zinc-700" : "bg-white border-gray-100 text-gray-900 focus:ring-blue-500/20 placeholder:text-gray-400")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="flex items-center justify-between">
                    <h3 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                      darkMode ? "text-zinc-500" : "text-gray-400")}>Verified Suppliers</h3>
                    <div className={cn("flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors",
                      darkMode ? "text-zinc-600" : "text-gray-500")}>
                       Nearby Gazipur <MapPin size={10} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    {filteredVendors.map(vendor => (
                      <motion.div 
                        key={vendor.id}
                        whileTap={{ scale: 0.98 }}
                        className={cn("p-5 rounded-[32px] border shadow-sm space-y-4 overflow-hidden relative transition-colors",
                          darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}
                      >
                         <div className="flex items-center gap-4">
                            <img src={vendor.image} alt={vendor.name} className="w-16 h-16 rounded-2xl object-cover" />
                            <div className="flex-1">
                               <div className="flex items-center gap-1.5">
                                  <h4 className={cn("font-black line-clamp-1 transition-colors",
                                    darkMode ? "text-white" : "text-gray-900")}>{vendor.name}</h4>
                                  {vendor.verified && <CheckCircle2 size={14} className="text-blue-500" />}
                               </div>
                               <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors",
                                 darkMode ? "text-zinc-500" : "text-gray-400")}>{vendor.category}</p>
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-0.5 text-amber-500">
                                     <Star size={10} fill="currentColor" />
                                     <span className="text-[10px] font-black">{vendor.rating}</span>
                                  </div>
                                  <div className={cn("flex items-center gap-1 text-[10px] font-bold transition-colors",
                                    darkMode ? "text-zinc-500" : "text-gray-400")}>
                                     <Users size={10} /> {vendor.reviews} reviews
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className={cn("flex items-center justify-between pt-4 border-t transition-colors",
                           darkMode ? "border-white/5" : "border-gray-50")}>
                            <div className="flex flex-col gap-0.5">
                               <div className={cn("flex items-center gap-1 text-[10px] font-bold transition-colors",
                                 darkMode ? "text-zinc-300" : "text-gray-900")}>
                                  <MapPin size={12} className="text-gray-400" /> {vendor.location}
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                 darkMode ? "bg-white/5 text-zinc-500 hover:text-white" : "bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50")}>
                                  <MessageSquare size={18} />
                               </button>
                               <a href={`tel:${vendor.phone}`} className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all",
                                 darkMode ? "bg-blue-600 shadow-lg shadow-blue-900/40" : "bg-zinc-900")}>
                                  <Phone size={18} />
                               </a>
                            </div>
                         </div>
                      </motion.div>
                    ))}

                    {filteredVendors.length === 0 && (
                      <div className="p-12 text-center opacity-40">
                         <Search className="mx-auto mb-4" size={48} />
                         <p className="font-bold italic">No vendors found matching your search.</p>
                      </div>
                    )}
                 </div>

                 <div className={cn("rounded-3xl p-6 text-center border transition-all",
                   darkMode ? "bg-blue-600/10 border-blue-500/20" : "bg-blue-50 border-blue-100")}>
                    <p className={cn("text-xs font-black uppercase tracking-widest mb-2 transition-colors",
                      darkMode ? "text-blue-400" : "text-blue-600")}>Want to list your business?</p>
                    <p className={cn("text-[10px] font-medium mb-4 transition-colors",
                      darkMode ? "text-blue-200/60" : "text-blue-800")}>Make your farm or shop visible to thousands of potential customers in the community.</p>
                    <button className={cn("px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all",
                      darkMode ? "bg-blue-600 text-white shadow-blue-900/40 hover:bg-blue-500" : "bg-blue-600 text-white shadow-blue-200")}>
                       Request Listing
                    </button>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
