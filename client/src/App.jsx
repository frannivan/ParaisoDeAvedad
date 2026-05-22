import React, { useState, useEffect } from 'react';
import { roomService } from './services/api';
import Home from './components/ui/Home';
import AccommodationBooking from './components/ui/AccommodationBooking';
import RestaurantBooking from './components/ui/RestaurantBooking';
import PoolBooking from './components/ui/PoolBooking';
import AdminDashboard from './components/admin/AdminDashboard';
import OTASimulator from './components/admin/OTASimulator';
import KitchenDisplay from './components/admin/KitchenDisplay';
import OrderEntry from './components/admin/OrderEntry';

function App() {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('paraisoAdminAuth') === 'true'
  );
  const [password, setPassword] = useState('paraiso2026');
  const [loginError, setLoginError] = useState('');

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Hash Routing Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/admin')) {
        setView('admin');
      } else if (hash === '#/simulador') {
        setView('simulator');
      } else if (hash === '#/login') {
        setView('login');
      } else if (hash === '#/booking/accommodation') {
        setView('booking-accommodation');
      } else if (hash === '#/booking/restaurant') {
        setView('booking-restaurant');
      } else if (hash === '#/booking/pool') {
        setView('booking-pool');
      } else if (hash === '#/kitchen') {
        setView('kitchen');
      } else if (hash === '#/order') {
        setView('order');
      } else {
        setView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle successful Stripe payment redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const bookingId = params.get('booking_id');
    
    if (sessionId && bookingId) {
      window.location.hash = '#/booking/accommodation';
    }
  }, []);

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full animate-in zoom-in duration-500 bg-white p-8 border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-12 h-12 bg-[#111] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <i className="fa-solid fa-lock text-white text-lg"></i>
          </div>
          <h1 className="text-xl font-bold mb-2 tracking-tight text-[#111]">Administrative Access</h1>
          <p className="text-gray-500 text-xs mb-6">Enter master password to continue</p>
          
          <form onSubmit={async (e) => {
            if (e) e.preventDefault();
            setLoading(true);
            try {
              // Intento de login con el servicio
              const res = await roomService.loginAdmin(password);
              if (res.token) {
                localStorage.setItem('paraisoAdminAuth', 'true');
                setIsAuthenticated(true);
                window.location.hash = '#/admin';
              }
            } catch (err) {
              // Fallback local por si el servidor no ha refrescado
              if (password === 'paraiso2026') {
                localStorage.setItem('paraisoAdminAuth', 'true');
                setIsAuthenticated(true);
                window.location.hash = '#/admin';
              } else {
                setLoginError('Incorrect password');
              }
            }
            setLoading(false);
          }}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-[#111] outline-none focus:border-[#C5A059] mb-4 text-center tracking-[0.5em]"
              placeholder="••••••••"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-[10px] uppercase font-bold tracking-wider mb-4">{loginError}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#111] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#C5A059] transition-colors"
            >
              {loading ? 'Verifying...' : 'Unlock'}
            </button>
            <button 
              type="button"
              onClick={() => window.location.hash = '#/'}
              className="mt-6 text-[10px] font-bold text-gray-400 hover:text-[#111] uppercase tracking-wider"
            >
              Back to Website
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'admin':
        return isAuthenticated ? <AdminDashboard /> : <div className="p-20 text-center">Redirecting to login... {window.location.hash = '#/login'}</div>;
      case 'simulator':
        return <OTASimulator />;
      case 'booking-accommodation':
        return <AccommodationBooking />;
      case 'booking-restaurant':
        return <RestaurantBooking />;
      case 'booking-pool':
        return <PoolBooking />;
      case 'kitchen':
        return <KitchenDisplay />;
      case 'order':
        return <OrderEntry />;
      case 'home':
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111] font-sans selection:bg-[#C5A059]/30 relative">
      {renderView()}

      {/* Global Admin Access (Hidden Lock) */}
      {view !== 'admin' && view !== 'login' && view !== 'simulator' && (
        <button 
          onClick={() => {
            let targetHash = '#/admin?mode=all';
            if (view === 'booking-accommodation') targetHash = '#/admin?mode=hotel';
            if (view === 'booking-restaurant') targetHash = '#/admin?mode=restaurant';
            if (view === 'booking-pool') targetHash = '#/admin?mode=pool';
            
            window.location.hash = isAuthenticated ? targetHash : '#/login';
          }} 
          className="fixed bottom-6 right-6 w-10 h-10 bg-white border border-gray-100 rounded-full shadow-lg flex items-center justify-center text-gray-200 hover:text-[#C5A059] transition-all z-[9999]"
        >
          <i className="fa-solid fa-lock text-[12px]"></i>
        </button>
      )}
    </div>
  );
}

export default App;
