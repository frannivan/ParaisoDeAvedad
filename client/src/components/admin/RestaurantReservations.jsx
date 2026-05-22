import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RestaurantBooking from '../ui/RestaurantBooking';
import VisualTableLayout from './VisualTableLayout';

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-gray-100 text-gray-500',
};

const RestaurantReservations = ({ adminMode = 'all' }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [endDateFilter, setEndDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [allDishes, setAllDishes] = useState([]);
  const [addingItems, setAddingItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [assignment, setAssignment] = useState({ restaurantId: '', tableId: '', people: '' });
  const [viewMode, setViewMode] = useState('list');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/admin/bookings`);
      const restaurantBookings = res.data.filter(b =>
        b.room && b.room.roomType.name.toLowerCase().includes('restaurant')
      );
      setReservations(restaurantBookings);
    } catch (err) {
      console.error('Error fetching reservations', err);
    }
    setLoading(false);
  };

  const fetchData = async () => {
    try {
      const [dishesRes, restRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/dishes`),
        axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants`)
      ]);
      setAllDishes(dishesRes.data);
      setRestaurants(restRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  useEffect(() => { fetchReservations(); fetchData(); }, []);

  const filtered = reservations.filter(b => {
    const checkInDate = new Date(b.checkIn);
    const year = checkInDate.getFullYear();
    const month = String(checkInDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkInDate.getDate()).padStart(2, '0');
    const d = `${year}-${month}-${day}`;
    
    const matchesDate = d >= dateFilter && d <= endDateFilter;
    const matchesSearch = 
      b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.guestEmail?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const handleOpenDetail = (b) => {
    setSelected(b);
    setAddingItems([]);
    setAssignment({
      restaurantId: b.order?.restaurantId || '',
      tableId: '', // We don't have tableId easily from order yet, but we have tableNumber
      people: b.people || ''
    });
  };

  const addItemToOrder = (dish) => {
    const existing = addingItems.find(i => i.dishId === dish.id);
    if (existing) {
      setAddingItems(addingItems.map(i => i.dishId === dish.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setAddingItems([...addingItems, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }]);
    }
  };

  const removeItemFromOrder = (dishId) => setAddingItems(addingItems.filter(i => i.dishId !== dishId));

  const handleUpdateReservation = async () => {
    try {
      const selectedRest = restaurants.find(r => r.id === assignment.restaurantId);
      const selectedTable = selectedRest?.tables?.find(t => t.id === assignment.tableId);

      // 1. Update Booking status and people
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/admin/bookings/${selected.id}/status`, {
        status: 'CONFIRMED',
        people: parseInt(assignment.people) || selected.people
      });

      // 2. Update/Create Order
      const payload = {
        restaurantId: assignment.restaurantId,
        tableNumber: selectedTable?.number || selected.order?.tableNumber,
        status: 'PREPARING'
      };

      if (selected.order) {
        await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders/${selected.order.id}`, payload);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders`, {
          ...payload,
          guestName: selected.guestName,
          bookingId: selected.id,
          peopleCount: parseInt(assignment.people) || selected.people,
          items: addingItems.map(i => ({ dishId: i.dishId, quantity: i.quantity }))
        });
      }

      alert("Reservation Updated!");
      setSelected(null);
      fetchReservations();
    } catch (err) {
      alert("Error updating reservation");
    }
  };

  const submitAdminOrder = async () => {
    if (addingItems.length === 0) return alert('Add at least one item to the order.');
    try {
      const restaurant = restaurants[0];
      if (!restaurant) return alert('No restaurant found.');
      await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders`, {
        guestName: selected.guestName,
        tableNumber: selected.order?.tableNumber || selected.room?.number,
        peopleCount: selected.people || 1,
        restaurantId: restaurant.id,
        bookingId: selected.id,
        items: addingItems.map(i => ({ dishId: i.dishId, quantity: i.quantity }))
      });
      alert('Order sent to kitchen!');
      setAddingItems([]);
      fetchReservations();
    } catch (err) {
      alert('Error creating order.');
    }
  };

  return (
    <div>
      <RestaurantBooking 
        isModalMode={true} 
        externalShowModal={showCreateModal} 
        setExternalShowModal={setShowCreateModal}
        onReservationSuccess={fetchReservations}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Restaurant <span className="text-[#C5A059]">Reservations</span></h2>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/60 w-fit">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >List View</button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              >Visual Map</button>
            </div>
          </div>
          {viewMode === 'list' && (
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{filtered.length} reservations found</p>
          )}
        </div>
        
        {viewMode === 'list' && (
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
              <input 
                type="text" 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none shadow-sm focus:border-[#C5A059]/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex-1 md:flex-none px-6 py-2.5 bg-[#111] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#C5A059] transition-all shadow-lg active:scale-95"
              >
                <i className="fa-solid fa-plus mr-2"></i>Book Table
              </button>
              <div className="flex items-center bg-white border border-gray-100 rounded-xl px-2 shadow-sm">
                <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-2 py-2 text-xs font-bold outline-none" />
                <span className="text-gray-300 mx-1">→</span>
                <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="px-2 py-2 text-xs font-bold outline-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <VisualTableLayout onRefreshReservations={fetchReservations} />
      ) : loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-300 italic text-sm border border-dashed border-gray-200 rounded-3xl">No reservations found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} onClick={() => handleOpenDetail(b)} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-[#C5A059]/40 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Table</span>
                  <span className="text-sm font-black text-[#111]">{b.order?.tableNumber || b.room?.number || '—'}</span>
                </div>
                <div>
                  <div className="font-bold text-[#111]">{b.guestName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(b.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {b.people || 2} pax {b.order && '· Menu Selected'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-500'}`}>{b.status}</span>
                <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-[#C5A059] transition-colors text-xs"></i>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div>
                <span className="text-[#C5A059] text-[9px] font-black uppercase tracking-widest mb-1 block">Reservation Detail</span>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{selected.guestName}</h3>
                <p className="text-xs text-gray-400 mt-1 font-bold uppercase">{new Date(selected.checkIn).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-black transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
            </div>

            <div className="p-8 space-y-8">
              {/* Assignment / Modification Step */}
              {(selected.status === 'PENDING' || adminMode === 'all') && (
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-700">
                    <i className="fa-solid fa-clipboard-check"></i>
                    <h4 className="text-xs font-black uppercase tracking-widest">{selected.status === 'PENDING' ? 'Assign Station & Table' : 'Edit Assignment'}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-amber-700/60 uppercase block mb-2">Station</label>
                      <select 
                        value={assignment.restaurantId}
                        onChange={e => setAssignment({ ...assignment, restaurantId: e.target.value, tableId: '' })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                      >
                        <option value="">Select Station</option>
                        {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-amber-700/60 uppercase block mb-2">Table</label>
                      <select 
                        disabled={!assignment.restaurantId}
                        value={assignment.tableId}
                        onChange={e => setAssignment({ ...assignment, tableId: e.target.value })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold outline-none disabled:opacity-50"
                      >
                        <option value="">Select Table</option>
                        {restaurants.find(r => r.id === assignment.restaurantId)?.tables?.map(t => (
                          <option key={t.id} value={t.id}>Table #{t.number} ({t.capacity} pax)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-amber-700/60 uppercase block mb-2">Guests</label>
                      <input 
                        type="number"
                        value={assignment.people}
                        onChange={e => setAssignment({ ...assignment, people: e.target.value })}
                        className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        placeholder="Pax"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateReservation}
                    className="w-full py-4 bg-[#111] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#C5A059] transition-all shadow-lg active:scale-95"
                  >
                    {selected.status === 'PENDING' ? 'Confirm & Assign' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Pre-selected Menu */}
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Client Selected Menu</h4>
                {selected.order ? (
                  <div className="space-y-3">
                    {selected.order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 bg-white border border-gray-100 rounded-xl">
                        <span className="text-sm font-bold text-[#111]">{item.dish?.name}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-black text-[#C5A059]">{item.quantity}x</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 italic text-sm border border-dashed border-gray-100 rounded-2xl">No menu pre-selected.</div>
                )}
              </div>

              {/* Modify / Extend Order */}
              <div className="pt-4">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Add / Modify Order</h4>
                 <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {allDishes.map(dish => {
                      const inList = addingItems.find(i => i.dishId === dish.id);
                      return (
                        <div key={dish.id} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <span className="text-xs font-bold text-[#111]">{dish.name}</span>
                          {inList ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => removeItemFromOrder(dish.id)} className="w-6 h-6 bg-red-100 text-red-500 rounded-full text-xs font-black">−</button>
                              <span className="text-xs font-black">{inList.quantity}</span>
                              <button onClick={() => addItemToOrder(dish)} className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-black">+</button>
                            </div>
                          ) : (
                            <button onClick={() => addItemToOrder(dish)} className="w-8 h-8 bg-white border border-gray-200 rounded-full text-xs font-black shadow-sm hover:border-[#C5A059]">+</button>
                          )}
                        </div>
                      );
                    })}
                 </div>
                 {addingItems.length > 0 && (
                   <button 
                    onClick={submitAdminOrder}
                    className="w-full mt-4 py-4 bg-[#C5A059] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#111] transition-all"
                   >Send Additional Order to Kitchen</button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantReservations;
