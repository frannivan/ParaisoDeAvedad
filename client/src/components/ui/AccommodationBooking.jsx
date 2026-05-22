import React, { useState, useEffect } from 'react';
import { roomService } from '../../services/api';
import RoomCard from './RoomCard';
import BookingSummary from './BookingSummary';

const AccommodationBooking = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [allExtras, setAllExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);

  const [search, setSearch] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    guests: 1
  });

  const fetchRooms = async (searchData = search) => {
    setLoading(true);
    try {
      const data = await roomService.search(searchData);
      setRoomTypes(data);
      setLoading(false);
    } catch (err) {
      setError('Could not load rooms.');
      setLoading(false);
    }
  };

  const fetchExtras = async () => {
    try {
      const data = await roomService.getExtras();
      setAllExtras(data);
    } catch (err) {
      console.error('Error fetching extras:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchExtras();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    fetchRooms(search);
    setSelectedRoom(null);
    setSelectedExtras([]);
  };

  const handleSearchChange = (field, value) => {
    let newSearch = { ...search, [field]: value };
    if (field === 'checkIn') {
      const nextDay = new Date(new Date(value).getTime() + 86400000).toISOString().split('T')[0];
      newSearch.checkOut = nextDay;
    }
    setSearch(newSearch);
    
    if (field === 'guests') {
      fetchRooms(newSearch);
      setSelectedRoom(null);
      setSelectedExtras([]);
    }
  };

  const toggleExtra = (id) => {
    setSelectedExtras(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const confirmBooking = async (formData) => {
    const subtotal = selectedRoom.basePrice + allExtras.filter(e => selectedExtras.includes(e.id)).reduce((sum, e) => sum + e.price, 0);
    const total = subtotal * 1.15;

    setLoading(true);
    try {
      const payload = {
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        roomId: selectedRoom.rooms[0].id,
        extraServices: selectedExtras,
        totalPrice: total
      };

      const res = await roomService.createBooking(payload);
      
      if (res.url) {
        window.location.href = res.url;
      } else {
        setBookingStatus('success');
        setLoading(false);
        setSelectedRoom(null);
        setSelectedExtras([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Connection error. The room might no longer be available.');
      setLoading(false);
    }
  };

  if (bookingStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#111] flex items-center justify-center p-6 text-center">
        <div className="max-w-md animate-in zoom-in duration-700 bg-white p-10 border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-[#C5A059] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#C5A059]/30">
            <i className="fa-solid fa-check text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-tight">Booking Confirmed!</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            We have received your payment correctly. Details of your stay have been sent to your email. We await you!
          </p>
          <button 
            onClick={() => { window.location.hash = '#/'; }}
            className="px-6 py-3 bg-[#111] text-white text-sm font-semibold rounded-lg hover:bg-[#C5A059] transition-colors shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans selection:bg-[#C5A059]/30 pb-20">
      <nav className="relative w-full z-50 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.hash = '#/'}>
            <span className="text-xl font-bold tracking-tight text-[#111]">PARAISO <span className="text-[#C5A059]">DE AVEDAD</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-gray-500 uppercase">
            <a href="#/" className="hover:text-[#C5A059] transition-colors">Home</a>
            <a href="#habitaciones" className="hover:text-[#C5A059] transition-colors">Rooms</a>
          </div>
        </div>
      </nav>

      <header className="relative pt-10 pb-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-5 text-[#111]">
            Find your perfect stay.
          </h1>
          
          <div className="max-w-4xl mx-auto p-2 bg-white border border-gray-200/60 rounded-2xl shadow-sm">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
              <div className="flex-1 w-full grid grid-cols-2 gap-2">
                <div className="flex flex-col items-start px-5 py-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Check-in</label>
                  <input type="date" className="bg-transparent border-none outline-none text-[#111] w-full text-sm font-medium" value={search.checkIn} onChange={(e) => handleSearchChange('checkIn', e.target.value)} />
                </div>
                <div className="flex flex-col items-start px-5 py-3 hover:bg-gray-50 rounded-xl transition-colors border-l border-gray-100">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Check-out</label>
                  <input type="date" className="bg-transparent border-none outline-none text-[#111] w-full text-sm font-medium" value={search.checkOut} onChange={(e) => handleSearchChange('checkOut', e.target.value)} />
                </div>
              </div>
              <div className="w-full md:w-32 flex flex-col items-start px-5 py-3 hover:bg-gray-50 rounded-xl transition-colors border-l border-gray-100">
                <label className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Guests</label>
                <select className="bg-transparent border-none outline-none text-[#111] w-full text-sm font-medium" value={search.guests} onChange={(e) => handleSearchChange('guests', e.target.value)}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full md:w-auto px-8 py-4 bg-[#C5A059] rounded-xl font-medium text-white text-sm uppercase tracking-wider hover:bg-[#B38D46] transition-colors shadow-sm">
                Search
              </button>
            </form>
          </div>
        </div>
      </header>

      <section id="habitaciones" className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[#111]">Available Rooms</h2>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-4 py-1.5 rounded-md">{roomTypes.length} results</span>
          </div>
          
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Array.from(new Map(roomTypes.map(rt => [rt.name, rt])).values()).map(roomType => (
                <div key={roomType.id} onClick={() => setSelectedRoom(roomType)} className={`cursor-pointer transition-all duration-300 rounded-2xl ${selectedRoom?.id === roomType.id ? 'ring-2 ring-[#C5A059] p-1 shadow-md bg-white' : ''}`}>
                  <RoomCard roomType={roomType} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div id="servicios" className="space-y-8">
          <h3 className="text-xl font-semibold tracking-tight text-[#111] border-b border-gray-200 pb-4">Add Services</h3>
          <div className="space-y-4">
            {Array.from(new Map(allExtras.map(ex => [ex.name, ex])).values()).map(extra => (
              <div 
                key={extra.id} 
                onClick={() => toggleExtra(extra.id)}
                className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${selectedExtras.includes(extra.id) ? 'bg-[#FFFDF8] border-[#C5A059] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-[15px]">{extra.name}</h4>
                  <span className="text-[#C5A059] font-medium text-sm">${extra.price}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{extra.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedRoom && (
        <BookingSummary 
          selectedRoom={selectedRoom}
          selectedExtras={selectedExtras}
          allExtras={allExtras}
          searchData={search}
          onConfirm={confirmBooking}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
};

export default AccommodationBooking;
