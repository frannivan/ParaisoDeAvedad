import React, { useState, useEffect } from 'react';
import { roomService } from '../../services/api';

// Formatting Helpers
const safeDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  } catch (e) {
    return new Date();
  }
};

const formatDateForInput = (dateStr) => {
  const d = safeDate(dateStr);
  return d.toISOString().split('T')[0];
};

const TapeChart = ({ onOpenBookingModal, onOpenMaintenanceModal }) => {
  const [bookings, setBookings] = useState([]);
  const [maintenanceBlocks, setMaintenanceBlocks] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReasonId, setCancelReasonId] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [confirmMove, setConfirmMove] = useState(null); // { booking, targetRoom, targetCheckIn }
  const [priceDiff, setPriceDiff] = useState(0);

  // Navigation and Filter States
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'list'
  const [baseDate, setBaseDate] = useState(new Date());
  const [searchGuest, setSearchGuest] = useState('');
  const [showOnlyWithBookings, setShowOnlyWithBookings] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'CONFIRMED' | 'OTAS'
  const [filterDates, setFilterDates] = useState({ start: '', end: '' });

  // Edition States
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({ roomId: '', checkIn: '', checkOut: '' });

  // Resizing States
  const [isResizing, setIsResizing] = useState(false);
  const [resizeBooking, setResizeBooking] = useState(null);

  // Generate 15 days from base date
  const generateDates = (start) => {
    const dates = [];
    const begin = new Date(start);
    begin.setHours(0, 0, 0, 0);
    for (let i = 0; i < 15; i++) {
      const date = new Date(begin);
      date.setDate(begin.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates(baseDate);

  // Time navigation
  const handlePrev = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() - 15);
    setBaseDate(newDate);
  };
  const handleNext = () => {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + 15);
    setBaseDate(newDate);
  };
  const handleToday = () => setBaseDate(new Date());

  // Filtering Logic
  const filteredBookings = (bookings || []).filter(b => {
    // Search Filter
    const search = (searchGuest || '').toLowerCase();
    const guestName = (b.guestName || '').toLowerCase();
    const bId = (b.id || '').toLowerCase();
    const matchesSearch = !searchGuest || guestName.includes(search) || bId.includes(search);
    
    // Status / Type Filter
    let matchesStatus = true;
    if (statusFilter === 'OTAS') {
      matchesStatus = b.source !== 'LOCAL';
    } else if (statusFilter !== 'ALL') {
      matchesStatus = (b.status === statusFilter);
    }

    // Date Range Filter
    let matchesDate = true;
    const bIn = new Date(b.checkIn);
    const bOut = new Date(b.checkOut);

    if (filterDates.start) {
      const dStart = new Date(filterDates.start);
      if (!isNaN(dStart.getTime()) && bOut < dStart) matchesDate = false;
    }
    if (filterDates.end) {
      const dEnd = new Date(filterDates.end);
      if (!isNaN(dEnd.getTime()) && bIn > dEnd) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsData, roomsData, blocksData, reasonsData] = await Promise.all([
          roomService.getAdminBookings().catch(() => []),
          roomService.getHousekeepingTasks().catch(() => []),
          roomService.getMaintenanceBlocks().catch(() => []),
          roomService.getCancellationReasons().catch(() => [])
        ]);
        
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setAllRooms(Array.isArray(roomsData) ? roomsData : []);
        setMaintenanceBlocks(Array.isArray(blocksData) ? blocksData : []);
        setReasons(Array.isArray(reasonsData) ? reasonsData : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setLoading(false);
      }
    };
    fetchData();

    // Listen for external refreshes
    const handleRefresh = () => fetchData();
    window.addEventListener('refresh-calendar', handleRefresh);
    return () => window.removeEventListener('refresh-calendar', handleRefresh);
  }, []);

  const handleDragStart = (e, booking) => {
    e.dataTransfer.setData('bookingId', booking.id);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDrop = async (e, targetRoom, targetDayIndex) => {
    e.preventDefault();
    const bookingId = e.dataTransfer.getData('bookingId');
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Calculate new check-in maintaining duration
    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / msPerDay);
    const newCheckIn = new Date(dates[targetDayIndex]);
    newCheckIn.setHours(12, 0, 0, 0);
    const newCheckOut = new Date(newCheckIn.getTime() + (durationDays * msPerDay));

    // Collision check
    const collision = bookings.find(b => 
      b.id !== bookingId &&
      b.roomId === targetRoom.id &&
      b.status !== 'CANCELLED' &&
      new Date(b.checkIn) < newCheckOut &&
      new Date(b.checkOut) > newCheckIn
    );

    if (collision) {
      alert("⚠️ SPACE OCCUPIED: You cannot move the booking to this room on these dates.");
      return;
    }

    // Price difference simulation
    const oldPricePerNight = booking.totalPrice / durationDays;
    const newPricePerNight = targetRoom.roomType.basePrice;
    const newTotal = newPricePerNight * durationDays;
    setPriceDiff(newTotal - booking.totalPrice);

    setConfirmMove({
      booking,
      targetRoom,
      newCheckIn,
      newCheckOut,
      newTotal
    });
  };

  const executeMove = async () => {
    try {
      await roomService.updateBookingPos(confirmMove.booking.id, {
        roomId: confirmMove.targetRoom.id,
        checkIn: confirmMove.newCheckIn.toISOString(),
        checkOut: confirmMove.newCheckOut.toISOString()
      });
      // Refresh data
      const bookingsData = await roomService.getAdminBookings();
      setBookings(bookingsData);
      setConfirmMove(null);
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Error moving booking";
      alert(`⚠️ ERROR: ${msg}`);
      setConfirmMove(null);
    }
  };

  const handleCancel = async () => {
    try {
      await roomService.cancelBooking(selectedBooking.id, {
        reasonId: cancelReasonId,
        details: cancelDetails
      });
      // Refresh
      const bookingsData = await roomService.getAdminBookings();
      setBookings(bookingsData);
      setIsCancelling(false);
      setSelectedBooking(null);
    } catch (error) {
      alert("Error cancelling");
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await roomService.updateBookingStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating booking status');
    }
  };

  const handleUpdateManual = () => {
    if (!selectedBooking?.id) {
      alert("❌ ERROR: Booking ID is undefined.");
      return;
    }

    const targetRoom = allRooms.find(r => r.id === editFormData.roomId);
    if (!targetRoom) {
      alert("❌ ERROR: Selected room not found.");
      return;
    }

    const newCheckIn = new Date(editFormData.checkIn + 'T12:00:00Z');
    const newCheckOut = new Date(editFormData.checkOut + 'T12:00:00Z');

    if (newCheckIn >= newCheckOut) {
      alert("⚠️ ERROR: Check-in must be before check-out.");
      return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.ceil((newCheckOut - newCheckIn) / msPerDay);

    const collision = filteredBookings.find(b => 
      b.id !== selectedBooking.id && 
      b.roomId === targetRoom.id &&
      b.status !== 'CANCELLED' &&
      new Date(b.checkIn) < newCheckOut &&
      new Date(b.checkOut) > newCheckIn
    );

    if (collision) {
      alert("⚠️ SPACE OCCUPIED: You cannot move the booking to this room on these dates (Collision detected).");
      return;
    }

    const oldDuration = Math.ceil((new Date(selectedBooking.checkOut) - new Date(selectedBooking.checkIn)) / msPerDay);
    const oldPricePerNight = selectedBooking.totalPrice / (oldDuration || 1);
    const newPricePerNight = targetRoom.roomType?.basePrice || oldPricePerNight;
    const newTotal = newPricePerNight * durationDays;
    setPriceDiff(newTotal - selectedBooking.totalPrice);

    setConfirmMove({
      booking: selectedBooking,
      targetRoom,
      newCheckIn,
      newCheckOut,
      newTotal
    });

    setIsEditing(false);
    setSelectedBooking(null);
  };

  // Resizing Logic
  const handleResizeStart = (e, booking) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeBooking(booking);
    
    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      
      const grid = document.querySelector('.min-w-\\[800px\\]').getBoundingClientRect();
      const x = upEvent.clientX - grid.left - 128;
      const cellWidth = (grid.width - 128) / dates.length;
      const dayIndex = Math.floor(x / cellWidth);
      
      if (dayIndex >= 0 && dayIndex < dates.length) {
        const newCheckOut = new Date(dates[dayIndex]);
        newCheckOut.setHours(12, 0, 0, 0);
        
        if (newCheckOut <= new Date(booking.checkIn)) {
          alert("Checkout must be after check-in");
          return;
        }

        const targetRoom = allRooms.find(r => r.id === booking.roomId);
        const msPerDay = 1000 * 60 * 60 * 24;
        const durationDays = Math.round((newCheckOut - new Date(booking.checkIn)) / msPerDay);
        const newTotal = targetRoom.roomType.basePrice * durationDays;
        
        setPriceDiff(newTotal - booking.totalPrice);
        setConfirmMove({
          booking,
          targetRoom,
          newCheckIn: new Date(booking.checkIn),
          newCheckOut: newCheckOut,
          newTotal
        });
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) return <div className="p-10 text-center text-xs text-gray-500 uppercase tracking-widest font-semibold">Loading Calendar...</div>;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'chart' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <i className="fa-solid fa-calendar-days mr-2"></i>Calendar
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <i className="fa-solid fa-list-ul mr-2"></i>List
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden lg:block"></div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button onClick={handleToday} className="px-3 py-1.5 text-[9px] font-black uppercase text-[#111] hover:bg-gray-100 rounded-md">Today</button>
            <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap flex-1 items-center gap-3 justify-end min-w-full lg:min-w-0">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input 
              type="text" 
              placeholder="Search guest..."
              value={searchGuest}
              onChange={(e) => setSearchGuest(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/10 transition-all shadow-sm"
            />
          </div>

          <div className="flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-gray-100 text-[#111]' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'PENDING' ? 'bg-amber-400 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'CONFIRMED' ? 'bg-[#111] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Paid
            </button>
            <button 
              onClick={() => setStatusFilter('OTAS')}
              className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${statusFilter === 'OTAS' ? 'bg-[#C5A059] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Agencies
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[#111]">
            {viewMode === 'chart' ? 'Occupancy Calendar' : 'Registered Bookings List'}
          </h3>
          {viewMode === 'chart' && (
            <button 
              onClick={() => setShowOnlyWithBookings(!showOnlyWithBookings)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[9px] font-black uppercase tracking-tighter ${
                showOnlyWithBookings 
                ? 'bg-[#111] text-white border-[#111] shadow-lg scale-105' 
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
            >
              {showOnlyWithBookings ? 'ONLY WITH BOOKINGS' : 'ALL ROOMS'}
            </button>
          )}
        </div>
      </div>
      
      {viewMode === 'chart' ? (
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            {/* Header Dates */}
            <div className="flex border-b border-gray-100 pb-2 mb-4">
              <div className="w-32 flex-shrink-0 text-[10px] font-bold text-gray-400 tracking-wider uppercase pt-2">
                Room
              </div>
              <div className="flex flex-1">
                {dates.map((date, i) => (
                  <div key={i} className="flex-1 min-w-[40px] text-center border-l border-transparent">
                    <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{date.toLocaleDateString('en', { weekday: 'short' })}</div>
                    <div className={`text-xs font-bold mt-1 ${i === 0 ? 'text-[#C5A059]' : 'text-[#111]'}`}>{date.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            {allRooms
              .filter(room => {
                if (!showOnlyWithBookings) return true;
                const startRange = dates[0];
                const endRange = dates[dates.length - 1];
                return bookings.some(b => {
                  if (b.roomId !== room.id || b.status === 'CANCELLED') return false;
                  const bIn = new Date(b.checkIn);
                  const bOut = new Date(b.checkOut);
                  return bIn < endRange && bOut > startRange;
                });
              })
              .map(room => {
              const roomBookings = filteredBookings.filter(b => b.roomId === room.id && b.status !== 'CANCELLED');
              
              return (
                <div key={room.id} className="flex border-b border-gray-50 py-3 items-center group hover:bg-gray-50/50 transition-colors">
                  <div className="w-32 flex-shrink-0">
                    <div className="text-sm font-bold text-[#111]">{room.number}</div>
                    <div className="text-[10px] text-gray-400">{room.roomType?.name}</div>
                  </div>
                  
                    <div className="flex flex-1 relative h-8 bg-gray-50/30 rounded-lg">
                      {dates.map((date, i) => (
                        <div 
                          key={i} 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, room, i)}
                          onDoubleClick={() => onOpenBookingModal({ 
                            roomId: room.id, 
                            checkIn: date.toISOString().split('T')[0],
                            checkOut: new Date(date.getTime() + 86400000).toISOString().split('T')[0],
                            totalPrice: room.roomType.basePrice
                          })}
                          className="flex-1 border-l border-white h-full z-0 hover:bg-[#C5A059]/10 transition-colors cursor-crosshair"
                        ></div>
                      ))}
                    
                    {/* Booking Blocks */}
                    {roomBookings.map(booking => {
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const gridStart = dates[0].getTime();
                      const gridEnd = dates[dates.length - 1].getTime() + msPerDay;
                      
                      const bStart = new Date(booking.checkIn);
                      bStart.setHours(0, 0, 0, 0);
                      const bEnd = new Date(booking.checkOut);
                      bEnd.setHours(23, 59, 59, 999);

                      const bStartMs = bStart.getTime();
                      const bEndMs = bEnd.getTime();

                      const visibleStart = Math.max(bStartMs, gridStart);
                      const visibleEnd = Math.min(bEndMs, gridEnd);

                      if (visibleStart >= visibleEnd) return null;

                      const totalGridDuration = gridEnd - gridStart;
                      const leftPercent = ((visibleStart - gridStart) / totalGridDuration) * 100;
                      const widthPercent = ((visibleEnd - visibleStart) / totalGridDuration) * 100;

                      let colorClass = booking.source !== 'LOCAL' ? 'bg-[#C5A059]' : (booking.status === 'PENDING' ? 'bg-amber-400' : 'bg-[#111]');

                      return (
                        <div 
                          key={booking.id}
                          draggable={!isResizing}
                          onDragStart={(e) => handleDragStart(e, booking)}
                          onClick={() => {
                            setSelectedBooking({ ...booking, roomNumber: room?.number });
                            setEditFormData({
                              roomId: booking.roomId,
                              checkIn: formatDateForInput(booking.checkIn),
                              checkOut: formatDateForInput(booking.checkOut)
                            });
                            setIsEditing(false); 
                          }}
                          className={`absolute z-10 flex items-center px-2 text-[9px] font-black text-white shadow-md overflow-hidden cursor-pointer hover:scale-[1.01] transition-all group/booking ${colorClass} rounded-md border border-white/20 opacity-90`}
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, top: '4px', bottom: '4px' }}
                        >
                          <span className="truncate flex-1 font-black">{booking.guestName || booking.source}</span>
                          
                          {/* Resize Handle */}
                          {viewMode === 'chart' && (
                            <div 
                              onMouseDown={(e) => handleResizeStart(e, booking)}
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-black/10 hover:bg-black/30 opacity-0 group-hover/booking:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <div className="w-[1px] h-3 bg-white/50"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Maintenance Blocks */}
                    {maintenanceBlocks.filter(b => b.roomId === room.id).map(block => {
                      const msPerDay = 1000 * 60 * 60 * 24;
                      const gridStart = dates[0].getTime();
                      const gridEnd = dates[dates.length - 1].getTime() + msPerDay;
                      const bStart = new Date(block.startDate);
                      const bEnd = new Date(block.endDate);
                      const visibleStart = Math.max(bStart.getTime(), gridStart);
                      const visibleEnd = Math.min(bEnd.getTime(), gridEnd);
                      if (visibleStart >= visibleEnd) return null;
                      const totalGridDuration = gridEnd - gridStart;
                      const leftPercent = ((visibleStart - gridStart) / totalGridDuration) * 100;
                      const widthPercent = ((visibleEnd - visibleStart) / totalGridDuration) * 100;

                      return (
                        <div 
                          key={block.id}
                          className="absolute z-20 flex items-center px-2 text-[8px] font-black shadow-lg overflow-hidden transition-all group/block border-y border-red-500/30"
                          style={{ 
                            left: `${leftPercent}%`, width: `${widthPercent}%`, top: '2px', bottom: '2px',
                            backgroundColor: 'rgba(220, 38, 38, 0.35)', 
                            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(220, 38, 38, 0.1) 10px, rgba(220, 38, 38, 0.1) 20px)`,
                            color: '#991b1b', cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenMaintenanceModal) onOpenMaintenanceModal(block);
                          }}
                        >
                          <div className="flex items-center gap-1 w-full justify-center">
                            <i className="fa-solid fa-screwdriver-wrench text-[10px]"></i>
                            <span className="tracking-tighter uppercase whitespace-nowrap">OUT OF SERVICE</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-hidden border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Guest</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Room</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Dates</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.slice().reverse().map(booking => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-[#111]">{booking.guestName || 'No Name'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: {booking.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-semibold text-[#C5A059] bg-[#C5A059]/5 px-2 py-0.5 rounded inline-block">
                        {allRooms.find(r => r.id === booking.roomId)?.number || '??'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] font-medium text-[#111]">
                        {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => {
                          const room = allRooms.find(r => r.id === booking.roomId);
                          setSelectedBooking({ ...booking, roomNumber: room?.number });
                          setEditFormData({
                            roomId: booking.roomId,
                            checkIn: formatDateForInput(booking.checkIn),
                            checkOut: formatDateForInput(booking.checkOut)
                          });
                          setIsEditing(false);
                        }}
                        className="p-2 text-gray-400 hover:text-[#111] transition-colors"
                      >
                        <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-xs text-gray-400">
                    No bookings found with those filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#111]"></div><span className="text-[10px] text-gray-500 uppercase font-semibold">Web (Local)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#C5A059]"></div><span className="text-[10px] text-gray-500 uppercase font-semibold">Agencies (iCal)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-[10px] text-gray-500 uppercase font-semibold">Pending Payment</span></div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
            <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isEditing ? 'bg-blue-50' : 'bg-[#FAFAFA]'}`}>
              <div>
                <h4 className={`font-bold uppercase tracking-wider text-xs ${isEditing ? 'text-blue-600' : 'text-[#111]'}`}>
                  {isEditing ? 'Editing Booking' : 'Booking Details'}
                </h4>
                <div className="text-[8px] text-gray-400 font-mono mt-1 uppercase tracking-widest">ID: {selectedBooking?.id || 'N/A'}</div>
              </div>
              <button onClick={() => { setSelectedBooking(null); setIsEditing(false); }} className="text-gray-400 hover:text-[#111] transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Room Change</label>
                    <select 
                      value={editFormData?.roomId || ''}
                      onChange={(e) => setEditFormData({...editFormData, roomId: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                    >
                      {allRooms.map(r => <option key={r.id} value={r.id}>{r.number} ({r.roomType?.name || 'Room'})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Check-in</label>
                      <input 
                        type="date"
                        value={editFormData?.checkIn || ''}
                        onChange={(e) => setEditFormData({...editFormData, checkIn: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Check-out</label>
                      <input 
                        type="date"
                        value={editFormData?.checkOut || ''}
                        onChange={(e) => setEditFormData({...editFormData, checkOut: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Guest</label>
                    <div className="text-sm font-semibold text-[#111]">{selectedBooking.guestName || 'No name'}</div>
                    <div className="text-[10px] text-gray-500">{selectedBooking.guestEmail}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Check-in</label>
                      <div className="text-xs font-medium text-[#111]">
                        {selectedBooking?.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Check-out</label>
                      <div className="text-xs font-medium text-[#111]">
                        {selectedBooking?.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Room</label>
                      <div className="text-xs font-bold text-[#C5A059]">{selectedBooking?.roomNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Source</label>
                      <div className="text-xs font-medium text-[#111] flex items-center gap-1 uppercase">
                        {selectedBooking?.source || 'WEB'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4">
                <div className={`text-center py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                  selectedBooking?.status === 'CONFIRMED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  Status: {selectedBooking?.status || 'PENDING'}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 space-y-2">
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                {!isEditing && selectedBooking.status === 'PENDING' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'CONFIRMED')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Confirm Payment and Mark as Paid
                  </button>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex-1 ${isEditing ? 'bg-gray-200 text-gray-700' : 'bg-[#111] text-white'} py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95`}
                  >
                    {isEditing ? 'Cancel Edition' : 'Modify Dates / Room'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-xl">Cancel</button>
                  <button onClick={handleUpdateManual} className="flex-[2] py-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">Save Changes</button>
                </div>
              ) : (
                <button onClick={() => setIsCancelling(true)} className="w-full py-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-xl">Delete / Cancel Booking</button>
              )}
              <button onClick={() => setSelectedBooking(null)} className="w-full py-3 bg-[#111] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">Close Panel</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Confirmation Modal */}
      {confirmMove && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-arrows-up-down-left-right text-2xl"></i>
              </div>
              <h4 className="text-lg font-bold text-[#111] mb-2">Confirm Move?</h4>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                You are moving <b>{confirmMove.booking.guestName}</b> to room <b>{confirmMove.targetRoom.number}</b>.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-sm border border-gray-100">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200/50">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Room:</span>
                  <span className="font-bold text-[#111]">{confirmMove.targetRoom.number}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-1 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase text-gray-400 font-bold">Previous</span>
                    <div className="text-[11px] text-gray-500 line-through">
                      {new Date(confirmMove.booking.checkIn).toLocaleDateString()} - {new Date(confirmMove.booking.checkOut).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1 border-l border-gray-200 pl-4">
                    <span className="text-[9px] uppercase text-blue-500 font-bold tracking-tight">New</span>
                    <div className="text-[11px] font-bold text-[#111]">
                      {new Date(confirmMove.newCheckIn).toLocaleDateString()} - {new Date(confirmMove.newCheckOut).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Difference:</span>
                  <span className={`text-[10px] font-bold ${priceDiff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {priceDiff > 0 ? `+$${priceDiff.toFixed(2)}` : `-$${Math.abs(priceDiff).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#111]">
                  <span>New Total:</span>
                  <span>${confirmMove.newTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setConfirmMove(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-xl">Cancel</button>
                <button onClick={executeMove} className="flex-1 py-3 bg-[#111] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {isCancelling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <h4 className="font-bold text-red-600 uppercase tracking-wider text-xs">Cancel Booking</h4>
              <button onClick={() => setIsCancelling(false)} className="text-gray-400 hover:text-red-600"><i className="fa-solid fa-xmark"></i></button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-[11px] text-gray-500">Please select the reason for cancellation to keep your statistics clean.</p>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Primary Reason</label>
                <select 
                  value={cancelReasonId}
                  onChange={(e) => setCancelReasonId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Select reason...</option>
                  {reasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              {(cancelReasonId === 'other' || cancelReasonId.includes('Other')) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Additional details</label>
                  <textarea 
                    value={cancelDetails}
                    onChange={(e) => setCancelDetails(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-500 h-24 resize-none"
                    placeholder="Write the reason here..."
                  ></textarea>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2">
              <button 
                onClick={handleCancel}
                disabled={!cancelReasonId}
                className="w-full py-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TapeChart;
