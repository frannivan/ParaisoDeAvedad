import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RestaurantBooking = ({ isModalMode, externalShowModal, setExternalShowModal, onReservationSuccess }) => {
  const [localShowModal, setLocalShowModal] = useState(false);
  const showModal = isModalMode ? externalShowModal : localShowModal;
  const setShowModal = isModalMode ? setExternalShowModal : setLocalShowModal;

  const [success, setSuccess] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [bookingData, setBookingData] = useState({
    guestName: '',
    guestEmail: '',
    people: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    menuOption: 'at_restaurant',
    paymentMethod: 'card',
    receipt: null
  });

  useEffect(() => {
    const fetchDishes = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/dishes`);
        setMenuItems(res.data);
      } catch (err) {
        console.error("Error fetching dishes:", err);
      }
    };
    fetchDishes();
  }, []);

  const addToCart = (dish) => {
    const existing = cart.find(i => i.dishId === dish.id);
    if (existing) {
      setCart(cart.map(i => i.dishId === dish.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { dishId: dish.id, name: dish.name, price: dish.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (dishId) => setCart(cart.filter(i => i.dishId !== dishId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        guestName: bookingData.guestName || `Guest (${bookingData.people} pax)`,
        guestEmail: bookingData.guestEmail || '',
        date: bookingData.date,
        time: bookingData.time,
        people: parseInt(bookingData.people),
      };
      if (bookingData.menuOption === 'pre_select' && cart.length > 0) {
        payload.items = cart.map(i => ({ dishId: i.dishId, quantity: i.quantity }));
      }
      const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/reservations`, payload);
      if (res.data) {
        setSuccess(true);
        setCart([]);
        if (onReservationSuccess) onReservationSuccess();
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error creating reservation.';
      alert(msg);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBookingData({ ...bookingData, receipt: e.target.files[0].name });
    }
  };

  const ModalContent = (
    <>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#FAFAFA]">
              <h3 className="font-black text-[#111] uppercase tracking-widest text-sm">Table Reservation</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {success ? (
              <div className="p-12 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-check text-3xl"></i>
                </div>
                <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">Reservation Confirmed!</h4>
                <p className="text-gray-500 text-sm">We have received your request. A confirmation has been sent to your email.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {/* Guest Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Guest Name</label>
                    <input
                      type="text" required placeholder="Your name"
                      value={bookingData.guestName || ''}
                      onChange={e => setBookingData({...bookingData, guestName: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email (Optional)</label>
                    <input
                      type="email" placeholder="email@example.com"
                      value={bookingData.guestEmail || ''}
                      onChange={e => setBookingData({...bookingData, guestEmail: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Day</label>
                    <input
                      type="date" required
                      value={bookingData.date}
                      onChange={e => setBookingData({...bookingData, date: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Time</label>
                    <select
                      value={bookingData.time}
                      onChange={e => setBookingData({...bookingData, time: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    >
                      {['12:00', '13:00', '14:00', '18:00', '19:00', '20:00', '21:00'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* People */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Number of Guests</label>
                  <input
                    type="number" min="1" max="20" required
                    value={bookingData.people}
                    onChange={e => setBookingData({...bookingData, people: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                  />
                </div>

                {/* Menu Option */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Menu Selection</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingData({...bookingData, menuOption: 'pre_select'})}
                      className={`p-4 rounded-2xl border text-left transition-all ${bookingData.menuOption === 'pre_select' ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="text-[10px] font-black uppercase mb-1">Pre-select</div>
                      <div className="text-[9px] opacity-70">Order now from our menu</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBookingData({...bookingData, menuOption: 'at_restaurant'}); setCart([]); }}
                      className={`p-4 rounded-2xl border text-left transition-all ${bookingData.menuOption === 'at_restaurant' ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="text-[10px] font-black uppercase mb-1">At Restaurant</div>
                      <div className="text-[9px] opacity-70">Decide when you arrive</div>
                    </button>
                  </div>
                </div>

                {/* Pre-select Dish Picker */}
                {bookingData.menuOption === 'pre_select' && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest block">Select Your Dishes</label>
                    <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
                      {menuItems.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-4">No dishes available yet.</p>
                      ) : menuItems.map(item => {
                        const inCart = cart.find(c => c.dishId === item.id);
                        return (
                          <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <div>
                              <span className="text-xs font-bold text-[#111]">{item.name}</span>
                              <span className="text-[9px] text-gray-400 ml-2">${item.price}</span>
                            </div>
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#C5A059]">{inCart.quantity}x</span>
                                <button type="button" onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-red-100 text-red-500 rounded-full text-xs font-black">−</button>
                                <button type="button" onClick={() => addToCart(item)} className="w-6 h-6 bg-green-100 text-green-600 rounded-full text-xs font-black">+</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => addToCart(item)} className="w-7 h-7 bg-[#111] text-white rounded-full text-xs font-black hover:bg-[#C5A059] transition-colors">+</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {cart.length > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 bg-[#111] text-white rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest">{cart.reduce((s,i) => s + i.quantity, 0)} items pre-selected</span>
                        <span className="text-xs font-black text-[#C5A059]">${cart.reduce((s,i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingData({...bookingData, paymentMethod: 'card'})}
                      className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${bookingData.paymentMethod === 'card' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <i className="fa-solid fa-credit-card"></i>
                      <span className="text-[10px] font-black uppercase">Credit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingData({...bookingData, paymentMethod: 'gcash'})}
                      className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${bookingData.paymentMethod === 'gcash' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white text-gray-400 border-gray-100'}`}
                    >
                      <div className="w-5 h-5 bg-white text-blue-600 rounded flex items-center justify-center font-bold text-[8px]">G</div>
                      <span className="text-[10px] font-black uppercase">GCash</span>
                    </button>
                  </div>
                </div>

                {/* GCash Receipt Upload */}
                {bookingData.paymentMethod === 'gcash' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Upload GCash Receipt</label>
                    <div className="relative">
                      <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      <div className="w-full bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center">
                        <i className="fa-solid fa-cloud-arrow-up text-blue-400 text-xl mb-2"></i>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                          {bookingData.receipt || 'Click to select or drag receipt'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-[#C5A059] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:bg-[#B38D46] transition-all"
                >
                  Complete Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (isModalMode) {
    return ModalContent;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans">
      <nav className="relative w-full z-50 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = '#/'}>
            <span className="text-xl font-bold tracking-tight text-[#111]">PARAISO <span className="text-[#C5A059]">DE AVEDAD</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-gray-500 uppercase">
            <a href="#/" className="hover:text-[#C5A059] transition-colors">Home</a>
            <a href="#menu" className="hover:text-[#C5A059] transition-colors">Menu</a>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded font-black">RESTAURANT</span>
          </div>
        </div>
      </nav>

      <header className="relative pt-24 pb-16 bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <span className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Fine Dining Experience</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8 text-[#111]">
            Avedad <span className="italic serif text-gray-400">Kitchen</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed mb-12">
            Experience the finest local and international cuisine in a stunning setting.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-10 py-5 bg-[#111] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl hover:bg-[#C5A059] transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Book a Table
          </button>
        </div>
      </header>

      {/* Menu Grid */}
      <section id="menu" className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Chef's Recommendations</h2>
          <div className="h-[1px] flex-1 bg-gray-100 mx-8 hidden md:block"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {menuItems.filter(item => item.isChefRecommendation).slice(0, 6).map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
                <img src={item.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop'} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-[#111] shadow-sm">
                  ${item.price}
                </div>
              </div>
              <span className="text-[#C5A059] text-[9px] font-black uppercase tracking-widest mb-1 block">{item.category}</span>
              <h3 className="text-xl font-bold mb-2 group-hover:text-[#C5A059] transition-colors">{item.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {ModalContent}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default RestaurantBooking;
