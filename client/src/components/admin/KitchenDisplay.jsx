import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const KitchenDisplay = ({ adminMode = 'all' }) => {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [activeStation, setActiveStation] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL'); // ALL, FOOD, DRINK
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // ACTIVE, PENDING, PREPARING, READY, SERVED, CANCELLED
  const [viewMode, setViewMode] = useState('GRID'); // GRID, LIST
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchRestaurants();
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [activeStation]);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants`);
      setRestaurants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const url = activeStation === 'ALL' 
        ? `${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders`
        : `${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders?restaurantId=${activeStation}`;
      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders/${orderId}`, { status });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'PREPARING': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'READY': return 'border-green-500/50 bg-green-500/10 text-green-400 animate-pulse';
      case 'SERVED': return 'border-gray-500/50 bg-gray-500/20 text-gray-400';
      case 'CANCELLED': return 'border-gray-800 bg-gray-900 text-gray-600';
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  const calculateWaitTime = (createdAt) => {
    const mins = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`;
  };

  const filteredOrders = orders.filter(order => {
    const matchesCategory = filterType === 'ALL' || order.items.some(item => item.dish?.category === filterType);
    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = ['PENDING', 'PREPARING', 'READY'].includes(order.status);
    } else if (statusFilter === 'CLOSED') {
      matchesStatus = ['SERVED', 'CANCELLED'].includes(order.status);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = order.status === statusFilter;
    }
    return matchesCategory && matchesStatus;
  });

  return (
    <div ref={containerRef} className={`bg-[#0a0a0a] min-h-[600px] text-white flex flex-col font-sans transition-all ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'rounded-3xl overflow-hidden shadow-2xl border border-white/5'}`}>
      
      {/* COMPACT TWO-ROW HEADER */}
      <div className="p-3 md:p-4 border-b border-white/10 bg-black/40 backdrop-blur-md space-y-3">
        
        {/* ROW 1: STATIONS | CATEGORY | VIEW & FS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#111] rounded-xl p-1 border border-white/5 overflow-x-auto no-scrollbar max-w-full sm:max-w-none">
            <button 
              onClick={() => setActiveStation('ALL')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeStation === 'ALL' ? 'bg-[#C5A059] text-black' : 'hover:bg-white/5 text-gray-500'}`}
            >All Stations</button>
            {restaurants.map(r => (
              <button 
                key={r.id}
                onClick={() => setActiveStation(r.id)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeStation === r.id ? 'bg-[#C5A059] text-black' : 'hover:bg-white/5 text-gray-500'}`}
              >{r.name}</button>
            ))}
          </div>

          <div className="flex bg-[#111] rounded-xl p-1 border border-white/5">
            <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg ${filterType === 'ALL' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-500 hover:text-white'}`}>ALL</button>
            <button onClick={() => setFilterType('FOOD')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg flex items-center gap-2 ${filterType === 'FOOD' ? 'bg-amber-600/20 text-amber-500 border border-amber-600/20' : 'text-gray-500 hover:text-white'}`}><i className="fa-solid fa-utensils"></i></button>
            <button onClick={() => setFilterType('DRINK')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg flex items-center gap-2 ${filterType === 'DRINK' ? 'bg-blue-600/20 text-blue-500 border border-blue-600/20' : 'text-gray-500 hover:text-white'}`}><i className="fa-solid fa-martini-glass"></i></button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex bg-[#111] rounded-xl p-1 border border-white/5">
              <button onClick={() => setViewMode('GRID')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'GRID' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-white'}`}><i className="fa-solid fa-table-cells-large text-[10px]"></i></button>
              <button onClick={() => setViewMode('LIST')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === 'LIST' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-white'}`}><i className="fa-solid fa-list-ul text-[10px]"></i></button>
            </div>
            <button onClick={toggleFullscreen} className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
              <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-[10px] text-gray-500`}></i>
            </button>
          </div>
        </div>

        {/* ROW 2: STATUS FILTERS & COUNTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-[#111] rounded-xl p-1 border border-white/5 overflow-x-auto no-scrollbar">
            {['ACTIVE', 'PENDING', 'PREPARING', 'READY', 'CLOSED', 'ALL'].map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white text-black' : 'hover:bg-white/5 text-gray-500'}`}
              >{s}</button>
            ))}
          </div>

          <div className="flex gap-4 text-[8px] font-black uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2 text-red-500"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> {orders.filter(o => o.status === 'PENDING').length} PENDING</span>
            <span className="flex items-center gap-2 text-yellow-500"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> {orders.filter(o => o.status === 'PREPARING').length} PREPARING</span>
            <span className="flex items-center gap-2 text-green-500"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {orders.filter(o => o.status === 'READY').length} READY</span>
          </div>
        </div>
      </div>

      {/* Orders Container */}
      <div className="flex-1 p-4 md:p-6 overflow-auto bg-[#050505]">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-800 space-y-4">
            <i className="fa-solid fa-clipboard-list text-6xl opacity-5"></i>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">No matching orders</p>
          </div>
        ) : viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                onDoubleClick={() => setSelectedOrder(order)}
                className={`bg-[#111] rounded-2xl border ${getStatusColor(order.status).split(' ')[0]} overflow-hidden flex flex-col shadow-2xl transition-all hover:border-white/20 active:scale-95 cursor-pointer select-none`}
              >
                <div className={`p-3 border-b border-white/5 flex justify-between items-center ${getStatusColor(order.status)}`}>
                  <div>
                    <div className="font-black text-xs uppercase tracking-wider">Table {order.tableNumber}</div>
                    <div className="text-[8px] opacity-70 uppercase font-black tracking-widest">{order.restaurant?.name || 'GENERIC'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black italic">{calculateWaitTime(order.createdAt)}</div>
                  </div>
                </div>

                <div className="p-4 space-y-2.5 min-h-[120px]">
                  {order.items?.filter(i => filterType === 'ALL' || i.dish?.category === filterType).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start group">
                      <div className="flex gap-3">
                         <span className="font-black text-[#C5A059] text-xs mt-0.5">x{item.quantity}</span>
                         <div>
                          <div className="text-[10px] font-black text-gray-200 uppercase tracking-tight leading-tight">
                             {item.dish?.name}
                             {item.dish?.category === 'DRINK' && <i className="fa-solid fa-glass-water text-[9px] text-blue-400 ml-1.5 opacity-50"></i>}
                          </div>
                          {item.notes && <div className="text-[8px] text-red-500 font-black italic mt-1 px-1.5 py-0.5 bg-red-500/10 rounded">!! {item.notes}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-black/40 flex flex-col gap-2 border-t border-white/5">
                  {order.status === 'PENDING' && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'PREPARING'); }} className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">Start Order</button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'READY'); }} className="w-full py-2.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2">
                      Ready
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'SERVED'); }} className="w-full py-2.5 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">Deliver</button>
                  )}
                  
                  {adminMode === 'all' && ['PENDING', 'PREPARING', 'READY'].includes(order.status) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(window.confirm("Cancel this order?")) updateStatus(order.id, 'CANCELLED') }} 
                      className="w-full py-1.5 text-[8px] font-black uppercase tracking-widest text-red-900/60 hover:text-red-500 transition-colors"
                    >Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl overflow-x-auto">
             <table className="w-full text-left min-w-[700px]">
                <thead>
                   <tr className="border-b border-white/5 bg-black/50 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
                      <th className="px-6 py-4">Table & Station</th>
                      <th className="px-6 py-4">Time</th>
                      <th className="px-6 py-4">Guest</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-white/5 transition-all cursor-pointer" onDoubleClick={() => setSelectedOrder(order)}>
                         <td className="px-6 py-5">
                            <div className="font-black text-xs uppercase text-white tracking-tight">Table {order.tableNumber}</div>
                            <div className="text-[8px] text-[#C5A059] font-black uppercase tracking-widest mt-0.5">{order.restaurant?.name || 'GENERIC'}</div>
                         </td>
                         <td className="px-6 py-5">
                            <div className={`font-black text-xs ${Math.floor((new Date() - new Date(order.createdAt)) / 60000) > 15 ? 'text-red-400' : 'text-gray-400'}`}>
                               {calculateWaitTime(order.createdAt)}
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{order.guestName || '—'}</div>
                         </td>
                         <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                         </td>
                         <td className="px-6 py-5 flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 border border-white/10 text-gray-500 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">Details</button>
                            {order.status === 'PENDING' && (
                              <button onClick={() => updateStatus(order.id, 'PREPARING')} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded-xl transition-all">Prepare</button>
                            )}
                            {order.status === 'PREPARING' && (
                              <button onClick={() => updateStatus(order.id, 'READY')} className="px-4 py-2 bg-green-600 text-white text-[8px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2">Ready</button>
                            )}
                            {order.status === 'READY' && (
                              <button onClick={() => updateStatus(order.id, 'SERVED')} className="px-4 py-2 bg-[#C5A059] text-black text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">Deliver</button>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

      {/* REFORMATTED DETAIL MODAL */}
      {selectedOrder && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-0 overflow-hidden animate-in zoom-in shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20" onClick={e => e.stopPropagation()}>
               
               {/* Modal Header */}
               <div className="bg-[#111] p-8 text-white relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.3em] block mb-2">Order Summary</span>
                      <h3 className="text-4xl font-black uppercase tracking-tighter italic">Table <span className="text-[#C5A059]">{selectedOrder.tableNumber}</span></h3>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-white/10 rounded-2xl text-white hover:bg-[#C5A059] hover:text-black transition-all flex items-center justify-center shadow-lg"><i className="fa-solid fa-xmark text-xl"></i></button>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedOrder.status}</div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{calculateWaitTime(selectedOrder.createdAt)} ago</div>
                  </div>
               </div>
               
               {/* Modal Content */}
               <div className="p-8 bg-white">
                  <div className="mb-8">
                     <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-list-ul text-[#C5A059]"></i> Selected Items
                     </div>
                     <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedOrder.items?.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#C5A059]/30 transition-all">
                              <div className="flex items-center gap-4">
                                 <span className="w-10 h-10 bg-[#111] text-[#C5A059] rounded-xl flex items-center justify-center text-xs font-black shadow-lg">x{item.quantity}</span>
                                 <div>
                                   <span className="text-sm font-black text-[#111] uppercase tracking-tight">{item.dish?.name}</span>
                                   {item.notes && <div className="text-[9px] text-red-500 font-bold mt-1 uppercase italic tracking-widest">Note: {item.notes}</div>}
                                 </div>
                              </div>
                              <span className="text-[10px] font-black text-gray-300 group-hover:text-[#111] transition-colors">${item.dish?.price * item.quantity}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Station</div>
                      <div className="text-xs font-black text-[#111] uppercase">{selectedOrder.restaurant?.name || 'GENERIC'}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Guest</div>
                      <div className="text-xs font-black text-[#111] uppercase">{selectedOrder.guestName || 'Anonymous'}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="w-full mt-8 py-5 bg-[#111] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-[#C5A059] transition-all transform active:scale-95"
                  >
                    Close Board View
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
