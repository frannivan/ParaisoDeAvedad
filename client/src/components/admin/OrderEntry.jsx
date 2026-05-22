import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderEntry = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderInfo, setOrderInfo] = useState({ tableNumber: '', guestName: '', peopleCount: 1 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants`);
      setRestaurants(res.data);
      if (res.data.length > 0) handleSelectRestaurant(res.data[0]);
    } catch (err) {
      console.error("Error fetching restaurants", err);
    }
  };

  const handleSelectRestaurant = async (rest) => {
    setSelectedRestaurant(rest);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants/${rest.id}/dishes`);
      setDishes(res.data);
      setCart([]);
    } catch (err) {
      console.error("Error fetching dishes", err);
    }
  };

  const addToCart = (dish) => {
    const existing = cart.find(item => item.id === dish.id);
    if (existing) {
      setCart(cart.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...dish, quantity: 1 }]);
    }
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Please add items to order");
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders`, {
        ...orderInfo,
        restaurantId: selectedRestaurant.id,
        items: cart.map(item => ({ dishId: item.id, quantity: item.quantity }))
      });
      setSuccess(true);
      setCart([]);
      setOrderInfo({ tableNumber: '', guestName: '', peopleCount: 1 });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Error submitting order");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans">
      {/* Sidebar: Restaurants & Selection */}
      <div className="w-full md:w-80 bg-white border-r border-gray-100 p-6">
        <h2 className="text-xl font-black mb-8 uppercase tracking-tighter">Kitchen <span className="text-[#C5A059]">Order</span></h2>
        
        <div className="space-y-3 mb-10">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Restaurant</label>
          {restaurants.map(rest => (
            <button 
              key={rest.id}
              onClick={() => handleSelectRestaurant(rest)}
              className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedRestaurant?.id === rest.id ? 'bg-[#111] text-white border-[#111] shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
            >
              <div className="text-xs font-bold uppercase">{rest.name}</div>
            </button>
          ))}
        </div>

        <form onSubmit={submitOrder} className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Service Details</label>
          <input 
            type="text" placeholder="Table / Room #" required
            value={orderInfo.tableNumber}
            onChange={e => setOrderInfo({...orderInfo, tableNumber: e.target.value})}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
          />
          <input 
            type="text" placeholder="Guest Name (Optional)"
            value={orderInfo.guestName}
            onChange={e => setOrderInfo({...orderInfo, guestName: e.target.value})}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
          />
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
             <span className="text-[10px] font-black text-gray-400 uppercase">Pax:</span>
             <input 
              type="number" min="1"
              value={orderInfo.peopleCount}
              onChange={e => setOrderInfo({...orderInfo, peopleCount: parseInt(e.target.value)})}
              className="bg-transparent text-sm font-bold outline-none w-full"
            />
          </div>
          
          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-4 bg-[#C5A059] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:bg-[#111] transition-all disabled:opacity-30"
            >
              {loading ? 'Sending...' : 'Send to Kitchen'}
            </button>
          </div>
        </form>
      </div>

      {/* Main Content: Dishes Grid */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto">
        {success && (
          <div className="mb-8 p-4 bg-green-500 text-white rounded-2xl text-center font-bold text-sm animate-in zoom-in">
            Order sent successfully!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Menu */}
          <div>
            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">Menu <span className="text-gray-400">({selectedRestaurant?.name})</span></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dishes.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 italic text-sm">No dishes added yet</div>
              ) : (
                dishes.map(dish => (
                  <button 
                    key={dish.id}
                    onClick={() => addToCart(dish)}
                    className="p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-[#C5A059] transition-all group"
                  >
                    <div className="text-[9px] font-black text-[#C5A059] uppercase mb-1">{dish.category}</div>
                    <div className="text-sm font-bold text-[#111] mb-2">{dish.name}</div>
                    <div className="text-xs font-black text-gray-400 group-hover:text-[#111] transition-colors">${dish.price}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Cart / Current Order */}
          <div className="bg-white border border-gray-100 rounded-3xl p-8 h-fit shadow-sm">
            <h3 className="text-xl font-black mb-8 uppercase tracking-tighter">Current <span className="text-[#C5A059]">Selection</span></h3>
            <div className="space-y-4 mb-10">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-gray-300 italic text-sm">Empty selection</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center font-black text-xs text-gray-400">{item.quantity}x</div>
                      <span className="text-sm font-bold text-[#111]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-gray-400">${(item.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      ><i className="fa-solid fa-trash-can text-xs"></i></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Estimate</span>
                <span className="text-2xl font-black text-[#111]">${cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEntry;
