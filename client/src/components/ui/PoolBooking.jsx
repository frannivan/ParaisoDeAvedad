import React, { useState } from 'react';
import poolImg from '../../assets/pool.jpg';

const PoolBooking = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [bookingData, setBookingData] = useState({
    adults: 1,
    children: 0,
    pets: false,
    massage: false
  });
  const [success, setSuccess] = useState(false);

  const experiences = [
    { id: 'daypass', name: 'Day Pass', price: 25, duration: 'Full Day', icon: 'fa-sun' },
    { id: 'cabana', name: 'Private Cabana', price: 120, duration: 'Daily', icon: 'fa-umbrella-beach' },
    { id: 'sunset', name: 'Sunset Spa', price: 75, duration: '3 Hours', icon: 'fa-moon' },
  ];

  const handleBook = (exp) => {
    setSelectedExp(exp);
    setShowModal(true);
  };

  const submitBooking = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setShowModal(false);
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans">
      <nav className="relative w-full z-50 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = '#/'}>
            <span className="text-xl font-bold tracking-tight text-[#111]">PARAISO <span className="text-[#C5A059]">DE AVEDAD</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-gray-500 uppercase">
            <a href="#/" className="hover:text-[#C5A059] transition-colors">Home</a>
            <a href="#experiences" className="hover:text-[#C5A059] transition-colors">Experiences</a>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-black">POOL & SPA</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <img 
          src={poolImg} 
          alt="Pool Header" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 text-center text-white px-6">
          <span className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Water & Relaxation</span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">The Infinity <span className="italic serif text-[#C5A059]/80">Pool</span></h1>
        </div>
      </div>

      {/* Grid */}
      <section id="experiences" className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experiences.map((exp, i) => (
            <div key={i} className="bg-white border border-gray-100 p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 group text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:bg-[#111] group-hover:text-white transition-colors duration-500">
                <i className={`fa-solid ${exp.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{exp.name}</h3>
              <p className="text-gray-400 text-xs font-semibold mb-6 tracking-widest">{exp.duration}</p>
              <div className="text-3xl font-black text-[#111] mb-8">${exp.price}</div>
              <button 
                onClick={() => handleBook(exp)}
                className="w-full py-4 bg-[#FAFAFA] border border-gray-100 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#111] hover:text-white transition-all shadow-sm"
              >
                Reserve Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-[#FAFAFA]">
              <div>
                <h3 className="font-black text-[#111] uppercase tracking-widest text-sm">Pool Reservation</h3>
                <p className="text-[10px] text-[#C5A059] font-bold mt-1 uppercase tracking-wider">{selectedExp?.name} - ${selectedExp?.price}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {success ? (
              <div className="p-12 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-check text-3xl"></i>
                </div>
                <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">Request Received!</h4>
                <p className="text-gray-500 text-sm">We are processing your pool reservation. See you soon!</p>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="p-8 space-y-6">
                {/* Guests */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Adults</label>
                    <input 
                      type="number" min="1" required
                      value={bookingData.adults}
                      onChange={e => setBookingData({...bookingData, adults: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Children</label>
                    <input 
                      type="number" min="0" required
                      value={bookingData.children}
                      onChange={e => setBookingData({...bookingData, children: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-paw text-gray-400"></i>
                      <span className="text-xs font-bold uppercase tracking-wider">Bringing Pets?</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setBookingData({...bookingData, pets: !bookingData.pets})}
                      className={`w-12 h-6 rounded-full transition-all relative ${bookingData.pets ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bookingData.pets ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-spa text-gray-400"></i>
                      <span className="text-xs font-bold uppercase tracking-wider">Add Massage?</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setBookingData({...bookingData, massage: !bookingData.massage})}
                      className={`w-12 h-6 rounded-full transition-all relative ${bookingData.massage ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${bookingData.massage ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#111] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                >
                  Confirm Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolBooking;
