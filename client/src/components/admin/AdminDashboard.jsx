import React, { useState, useEffect } from 'react';
import { roomService } from '../../services/api';
import SyncSettings from './SyncSettings';
import TapeChart from './TapeChart';
import HousekeepingPanel from './HousekeepingPanel';
import ManualBookingModal from './ManualBookingModal';
import MaintenanceBlockModal from './MaintenanceBlockModal';
import KitchenDisplay from './KitchenDisplay';
import OrderEntry from './OrderEntry';
import InventoryManager from './InventoryManager';
import KitchenInventory from './KitchenInventory';
import OTASimulator from './OTASimulator';
import RestaurantBooking from '../ui/RestaurantBooking';
import RestaurantReservations from './RestaurantReservations';

const AdminDashboard = () => {
  const getAdminMode = () => {
    try {
      const qs = window.location.hash.split('?')[1];
      if (qs) {
        const params = new URLSearchParams(qs);
        return params.get('mode') || 'all';
      }
    } catch(e) {}
    return 'all';
  };

  const adminMode = getAdminMode();

  const getAvailableTabs = () => {
    if (adminMode === 'hotel') return ['booking', 'housekeeping', 'sync'];
    if (adminMode === 'restaurant') return ['booking', 'inventory', 'management'];
    if (adminMode === 'pool') return ['booking', 'management'];
    return ['booking', 'housekeeping', 'management', 'inventory', 'sync'];
  };

  const availableTabs = getAvailableTabs();

  const getInitialTab = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin/')) {
      const tab = hash.split('?')[0].replace('#/admin/', '');
      if (availableTabs.includes(tab)) {
        return tab;
      }
    }
    return 'booking';
  };

  const getInitialSubTab = () => {
    if (adminMode === 'hotel') return 'hotel';
    if (adminMode === 'restaurant') return 'reservations';
    if (adminMode === 'pool') return 'pool';
    return 'hotel';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab); 
  const [bookingSubTab, setBookingSubTab] = useState(getInitialSubTab); // hotel, kitchen, pool
  const [restaurantDateFilter, setRestaurantDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [poolDateFilter, setPoolDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [poolBookings, setPoolBookings] = useState([]); 
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);

  useEffect(() => {
    const currentHashBase = window.location.hash.split('?')[0];
    const expectedHashBase = `#/admin${activeTab === 'booking' ? '' : '/' + activeTab}`;
    if (currentHashBase !== expectedHashBase) {
      window.location.hash = `${expectedHashBase}?mode=${adminMode}`;
    }
  }, [activeTab, adminMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await roomService.getAdminStats();
      const bookingsData = await roomService.getAdminBookings();
      const roomsData = await roomService.getHousekeepingTasks();
      
      setStats(statsData);
      setBookings(bookingsData);
      setAllRooms(roomsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'text-green-600 bg-green-50 border-green-100';
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400 font-semibold tracking-widest text-[10px] uppercase">Loading Paraiso Panel...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto bg-[#FAFAFA] min-h-screen">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tighter mb-2 text-[#111] uppercase">Paraiso <span className="text-[#C5A059]">Control</span></h1>
          <div className="flex gap-6 mt-6 overflow-x-auto pb-2 no-scrollbar">
            {availableTabs.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`pb-2 text-[10px] font-black tracking-[0.2em] transition-all border-b-2 uppercase whitespace-nowrap ${activeTab === tab ? 'text-[#C5A059] border-[#C5A059]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
              >
                {tab === 'booking' ? '🏨 Bookings' : tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.location.hash = '#/'} className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-black transition-colors text-[11px] font-bold tracking-wider uppercase">
            <i className="fa-solid fa-house"></i>
          </button>
          <button onClick={() => fetchData()} className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 shadow-sm">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          {activeTab === 'kitchen' ? (
             <button onClick={() => window.location.hash = '#/order'} className="px-6 py-2.5 bg-[#C5A059] text-white rounded-lg hover:bg-[#111] transition-colors text-[11px] font-black tracking-widest uppercase shadow-xl">
               <i className="fa-solid fa-plus mr-2"></i>New Order
             </button>
          ) : (
            <button onClick={() => { setModalInitialData(null); setIsModalOpen(true); }} className="px-6 py-2.5 bg-[#111] text-white rounded-lg hover:bg-[#C5A059] transition-colors text-[11px] font-black tracking-widest uppercase shadow-xl">
              <i className="fa-solid fa-plus mr-2"></i>New Booking
            </button>
          )}
        </div>
      </div>

      {activeTab === 'booking' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex bg-white rounded-2xl p-2 border border-gray-100 shadow-sm mb-8 w-fit">
             {(adminMode === 'all' || adminMode === 'hotel') && (
               <button 
                  onClick={() => setBookingSubTab('hotel')}
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bookingSubTab === 'hotel' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
               >Hotel Bookings</button>
             )}
             {(adminMode === 'all' || adminMode === 'restaurant') && (
               <>
                 <button 
                    onClick={() => setBookingSubTab('reservations')}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bookingSubTab === 'reservations' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >Reservations</button>
                 <button 
                    onClick={() => setBookingSubTab('orders')}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bookingSubTab === 'orders' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >Orders</button>
                 <button 
                    onClick={() => setBookingSubTab('create-order')}
                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bookingSubTab === 'create-order' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                 >Create Order</button>
               </>
             )}
             {(adminMode === 'all' || adminMode === 'pool') && (
               <button 
                  onClick={() => setBookingSubTab('pool')}
                  className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${bookingSubTab === 'pool' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
               >Pool Bookings</button>
             )}
          </div>

          {bookingSubTab === 'hotel' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Revenue</p>
              <h2 className="text-3xl font-black text-[#111]">${stats?.totalRevenue?.toLocaleString()}</h2>
            </div>
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Occupancy</p>
              <h2 className="text-3xl font-black text-[#111]">{stats?.occupancyRate?.toFixed(1)}%</h2>
            </div>
            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Active Bookings</p>
              <h2 className="text-3xl font-black text-[#111]">{stats?.totalBookings}</h2>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-4">
             <TapeChart onOpenBookingModal={(data) => { setModalInitialData(data); setIsModalOpen(true); }} onOpenMaintenanceModal={(data) => { setModalInitialData(data); setIsMaintenanceModalOpen(true); }} />
          </div>
        </>
      )}

      {bookingSubTab === 'orders' && (
        <div className="animate-in fade-in zoom-in duration-500">
           <KitchenDisplay adminMode={adminMode} />
        </div>
      )}

      {bookingSubTab === 'create-order' && (
        <div className="animate-in fade-in zoom-in duration-500">
           <OrderEntry />
        </div>
      )}

      {bookingSubTab === 'reservations' && (
        <div className="animate-in fade-in zoom-in duration-500">
          <RestaurantReservations />
        </div>
      )}

      {bookingSubTab === 'pool' && (
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-[#111]">Pool Reservations</h3>
              <input type="date" value={poolDateFilter} onChange={(e) => setPoolDateFilter(e.target.value)} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm font-bold" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Mock Pool Bookings */}
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex justify-between mb-4">
                    <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Confirmed</span>
                    <span className="text-[10px] text-gray-400 font-bold">12:30 PM</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">Guest {i}</h4>
                  <p className="text-xs text-gray-500 mb-4">2 Adults, 1 Child • {i % 2 === 0 ? 'Pets' : 'No Pets'}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all">Check In</button>
                    <button className="flex-1 py-2 bg-[#111] text-white rounded-lg text-[9px] font-black uppercase hover:bg-[#C5A059] transition-all">Details</button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}
      </div>
      )}

      {activeTab === 'management' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <InventoryManager adminMode={adminMode} />
        </div>
      )}
      {activeTab === 'inventory' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <KitchenInventory />
        </div>
      )}
      {activeTab === 'sync' && <SyncSettings />}
      {activeTab === 'housekeeping' && <HousekeepingPanel />}

      <ManualBookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} allRooms={allRooms} initialData={modalInitialData} onSuccess={() => { setIsModalOpen(false); fetchData(); window.dispatchEvent(new CustomEvent('refresh-calendar')); }} />
      <MaintenanceBlockModal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} allRooms={allRooms} initialData={modalInitialData} onSuccess={() => { setIsMaintenanceModalOpen(false); fetchData(); window.dispatchEvent(new CustomEvent('refresh-calendar')); }} />
    </div>
  );
};

export default AdminDashboard;
