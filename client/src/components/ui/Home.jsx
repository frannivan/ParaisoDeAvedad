import React from 'react';
import portadaImg from '../../assets/portada.jpg';
import poolImg from '../../assets/pool.jpg';

const Home = () => {
  const sections = [
    {
      id: 'accommodation',
      title: 'Accomodation',
      subtitle: 'HOTEL & SUITES',
      description: 'Experience unparalleled comfort in our curated rooms and presidential suites.',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop',
      url: '#/booking/accommodation',
      icon: 'fa-bed'
    },
    {
      id: 'restaurant',
      title: 'Restaurant',
      subtitle: 'RESTAURANT & BAR',
      description: 'Savor gourmet dishes prepared with local ingredients by world-class chefs.',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop',
      url: '#/booking/restaurant',
      icon: 'fa-utensils'
    },
    {
      id: 'pool',
      title: 'Pool',
      subtitle: 'POOL & SPA',
      description: 'Relax and rejuvenate in our infinity pool and premium spa facilities.',
      image: poolImg,
      url: '#/booking/pool',
      icon: 'fa-swimming-pool'
    }
  ];

  return (
    <div className="min-h-screen bg-[#E8F5E9] text-[#1B3A2D]">
      {/* Hero Section */}
      <div className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10"></div>
          <img 
            src={portadaImg} 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 animate-slow-zoom"
          />
        </div>

        <div className="relative z-20 max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000 text-white">
          <span className="text-[#C5A059] text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Welcome to Paradise</span>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
            PARAISO <span className="text-[#C5A059]">DE AVEDAD</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-12">
            A sanctuary of luxury, flavor, and tranquility designed for those who seek the extraordinary.
          </p>
          
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => document.getElementById('explore').scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-[#C5A059] hover:text-white transition-all duration-300 shadow-xl"
            >
              Explore Experiences
            </button>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <span className="w-10 h-[1px] bg-gray-700"></span>
              Scroll to begin
            </div>
          </div>
        </div>

        {/* Floating Socials */}
        <div className="absolute bottom-10 left-10 hidden lg:flex flex-col gap-6 z-20">
          <a href="#" className="text-gray-400 hover:text-[#C5A059] transition-colors"><i className="fa-brands fa-instagram text-xl"></i></a>
          <a href="#" className="text-gray-400 hover:text-[#C5A059] transition-colors"><i className="fa-brands fa-facebook text-xl"></i></a>
          <div className="w-[1px] h-12 bg-gray-800 mx-auto"></div>
        </div>
      </div>

      {/* Exploration Grid */}
      <section id="explore" className="py-24 px-6 bg-[#F1F8E9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#1B3A2D]">Select Your Experience</h2>
            <div className="w-20 h-1 bg-[#C5A059] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {sections.map((section, index) => (
              <a 
                key={section.id} 
                href={section.url}
                className="group relative h-[600px] rounded-3xl overflow-hidden block shadow-2xl transition-all duration-500 hover:-translate-y-4 border border-[#1B3A2D]/10 hover:border-[#C5A059]/60 text-white"
              >
                {/* Image */}
                <img 
                  src={section.image} 
                  alt={section.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity"></div>
                
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-10 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-white shadow-lg">
                      <i className={`fa-solid ${section.icon}`}></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A059]">{section.subtitle}</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 group-hover:text-[#C5A059] transition-colors">{section.title}</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {section.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white group-hover:gap-4 transition-all">
                    Make a Reservation <i className="fa-solid fa-arrow-right-long text-[#C5A059]"></i>
                  </div>
                </div>

                {/* Index Number */}
                <div className="absolute top-10 right-10 z-20 text-6xl font-black text-white/10 group-hover:text-[#C5A059]/20 transition-colors">
                  0{index + 1}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / Contact Section */}
      <section className="py-24 px-6 bg-[#E8F5E9] border-t border-[#C8E6C9]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 italic serif text-[#1B3A2D]">"The art of living well."</h2>
          <p className="text-[#5D7A6B] text-sm uppercase tracking-widest mb-12">Paraiso De Avedad • Est. 2026</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <div className="bg-[#C8E6C9] px-8 py-4 rounded-full border border-[#A5D6A7] text-[#2E5B3F] text-sm italic">
              info@paraisodeavedad.com
            </div>
            <div className="bg-[#C8E6C9] px-8 py-4 rounded-full border border-[#A5D6A7] text-[#2E5B3F] text-sm italic">
              +1 (555) PARAISO
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#C8E6C9] bg-[#DCEDC8]">
        <p className="text-[10px] text-[#5D7A6B] font-black uppercase tracking-[0.3em] mb-6">
          © 2026 Paraiso De Avedad Luxury Resort. All Rights Reserved.
        </p>
        <div className="flex justify-center gap-8">
          <a href="#/login" className="text-[9px] font-black uppercase tracking-widest text-[#5D7A6B] hover:text-[#C5A059] transition-all">Staff Portal</a>
          <a href="#/kitchen" className="text-[9px] font-black uppercase tracking-widest text-[#5D7A6B] hover:text-[#C5A059] transition-all">Kitchen Monitor</a>
          <a href="#/order" className="text-[9px] font-black uppercase tracking-widest text-[#5D7A6B] hover:text-[#C5A059] transition-all">Order Entry</a>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate linear;
        }
      `}} />
    </div>
  );
};

export default Home;
