import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  COMPLETED: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
};

const VisualTableLayout = ({ onRefreshReservations }) => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selection states
  const [selectedTableId, setSelectedTableId] = useState(null);
  
  // Dragging states
  const [draggingTableId, setDraggingTableId] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, tableX: 0, tableY: 0 });
  const canvasRef = useRef(null);

  // Form states for adding/editing tables
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState(4);
  const [editingTableNum, setEditingTableNum] = useState('');
  const [editingTableCap, setEditingTableCap] = useState(4);

  // Fetch stations and tables
  const fetchStations = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants?_t=${Date.now()}`);
      setRestaurants(res.data);
      if (res.data.length > 0 && !selectedStationId) {
        setSelectedStationId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching stations', err);
    }
  };

  // Fetch reservations
  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/admin/bookings?_t=${Date.now()}`);
      // Filter for restaurant bookings
      const restaurantBookings = res.data.filter(b =>
        b.room && b.room.roomType.name.toLowerCase().includes('restaurant')
      );
      setBookings(restaurantBookings);
    } catch (err) {
      console.error('Error fetching bookings', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStations(), fetchBookings()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedStation = restaurants.find(r => r.id === selectedStationId);
  const tables = selectedStation?.tables || [];

  // Helper to find booking for a specific table on the selected date
  const getBookingForTable = (tableNumber) => {
    return bookings.find(b => {
      if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;
      
      const bDate = new Date(b.checkIn).toISOString().split('T')[0];
      if (bDate !== selectedDate) return false;

      const orderTable = b.order?.tableNumber;
      const orderStation = b.order?.restaurantId;
      const roomTable = b.room?.number;

      if (orderTable && orderStation) {
        return String(orderTable) === String(tableNumber) && orderStation === selectedStationId;
      }
      
      return String(roomTable) === String(tableNumber);
    });
  };

  // List of bookings on selected date that DO NOT have a table assigned yet
  const getUnassignedBookings = () => {
    return bookings.filter(b => {
      if (b.status === 'CANCELLED' || b.status === 'COMPLETED') return false;
      
      const bDate = new Date(b.checkIn).toISOString().split('T')[0];
      if (bDate !== selectedDate) return false;

      const orderTable = b.order?.tableNumber;
      const orderStation = b.order?.restaurantId;
      
      // If it has order specifying a table, it is assigned
      if (orderTable && orderStation) return false;
      
      // If it doesn't match any table in the current station, it's unassigned for this station
      return true;
    });
  };

  // Add Table
  const handleAddTable = async () => {
    if (!newTableNum) return alert('Please enter a table number');
    
    // Default position is center of the canvas (400x250)
    const positionX = 360;
    const positionY = 210;

    try {
      setSaving(true);
      await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants/${selectedStationId}/tables`, {
        number: newTableNum,
        capacity: parseInt(newTableCap) || 4,
        positionX,
        positionY
      });
      setNewTableNum('');
      await fetchStations();
    } catch (err) {
      alert('Error creating table');
    } finally {
      setSaving(false);
    }
  };

  // Edit Table Number/Capacity
  const handleUpdateTable = async (tableId) => {
    if (!editingTableNum) return alert('Table number cannot be empty');
    try {
      setSaving(true);
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/tables/${tableId}`, {
        number: editingTableNum,
        capacity: parseInt(editingTableCap) || 4
      });
      await fetchStations();
      alert('Table updated!');
    } catch (err) {
      alert('Error updating table properties');
    } finally {
      setSaving(false);
    }
  };

  // Delete Table
  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      setSaving(true);
      await axios.delete(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/tables/${tableId}`);
      setSelectedTableId(null);
      await fetchStations();
    } catch (err) {
      alert('Error deleting table');
    } finally {
      setSaving(false);
    }
  };

  // Assign a pending reservation to a table
  const handleAssignBooking = async (booking, tableNumber) => {
    try {
      setSaving(true);
      
      // Update Booking status to CONFIRMED
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/admin/bookings/${booking.id}/status`, {
        status: 'CONFIRMED'
      });

      // Update or Create order for that booking
      const payload = {
        restaurantId: selectedStationId,
        tableNumber: String(tableNumber),
        status: 'PREPARING'
      };

      if (booking.order) {
        await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders/${booking.order.id}`, payload);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders`, {
          ...payload,
          guestName: booking.guestName,
          bookingId: booking.id,
          peopleCount: booking.people || 2,
          items: []
        });
      }

      await loadData();
      if (onRefreshReservations) onRefreshReservations();
      alert(`Reservation for ${booking.guestName} assigned to Table #${tableNumber}!`);
    } catch (err) {
      alert('Error assigning reservation to table');
    } finally {
      setSaving(false);
    }
  };

  // Unassign/Free a table
  const handleFreeTable = async (booking) => {
    if (!window.confirm(`Free Table and mark reservation as completed?`)) return;
    try {
      setSaving(true);
      
      // Mark booking status as COMPLETED
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/admin/bookings/${booking.id}/status`, {
        status: 'COMPLETED'
      });

      // Update Order Status to SERVED or similar
      if (booking.order) {
        await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/orders/${booking.order.id}`, {
          status: 'SERVED'
        });
      }

      await loadData();
      if (onRefreshReservations) onRefreshReservations();
    } catch (err) {
      alert('Error updating reservation status');
    } finally {
      setSaving(false);
    }
  };

  // Drag handlers
  const handlePointerDown = (e, table) => {
    if (!isEditMode) return;
    e.preventDefault();
    setSelectedTableId(table.id);
    setEditingTableNum(table.number);
    setEditingTableCap(table.capacity);

    const canvasRect = canvasRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      tableX: table.positionX,
      tableY: table.positionY
    };

    setDraggingTableId(table.id);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (draggingTableId === null) return;
    e.preventDefault();

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    let newX = dragStartRef.current.tableX + dx;
    let newY = dragStartRef.current.tableY + dy;

    // Canvas boundary clamping
    const canvasWidth = 800;
    const canvasHeight = 500;
    
    // Snapping logic (20px grid)
    newX = Math.round(newX / 20) * 20;
    newY = Math.round(newY / 20) * 20;

    // Clamp coordinates
    newX = Math.max(0, Math.min(canvasWidth - 80, newX));
    newY = Math.max(0, Math.min(canvasHeight - 80, newY));

    // Update in local state for smooth rendering
    setRestaurants(prev => prev.map(rest => {
      if (rest.id !== selectedStationId) return rest;
      return {
        ...rest,
        tables: rest.tables.map(t => {
          if (t.id !== draggingTableId) return t;
          return { ...t, positionX: newX, positionY: newY };
        })
      };
    }));
  };

  const handlePointerUp = async (e) => {
    if (draggingTableId === null) return;
    e.preventDefault();
    
    e.target.releasePointerCapture(e.pointerId);
    
    const tableId = draggingTableId;
    setDraggingTableId(null);

    // Save final position to server
    const finalTable = tables.find(t => t.id === tableId);
    if (!finalTable) return;

    try {
      setSaving(true);
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/tables/${tableId}/position`, {
        positionX: finalTable.positionX,
        positionY: finalTable.positionY
      });
    } catch (err) {
      console.error('Error saving table position', err);
    } finally {
      setSaving(false);
    }
  };

  // Helper to render chairs around tables for premium visual detail
  const renderChairs = (capacity, shapeType) => {
    const chairs = [];
    const radius = shapeType === 'circle' ? 36 : 40;
    
    for (let i = 0; i < capacity; i++) {
      const angle = (i * 2 * Math.PI) / capacity;
      const x = Math.cos(angle) * radius + 40; // center offset
      const y = Math.sin(angle) * radius + 40; // center offset
      
      chairs.push(
        <div 
          key={i} 
          className="absolute w-3.5 h-3.5 bg-neutral-800 border border-neutral-700/60 rounded-full shadow-inner -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}px`, top: `${y}px` }}
        />
      );
    }
    return chairs;
  };

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeBooking = selectedTable ? getBookingForTable(selectedTable.number) : null;
  const unassignedBookings = getUnassignedBookings();

  return (
    <div className="flex flex-col xl:flex-row gap-8 bg-neutral-950 p-6 rounded-3xl border border-neutral-900 shadow-2xl overflow-hidden text-neutral-100">
      
      {/* Left side: Toolbar + Canvas */}
      <div className="flex-1 space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/50 p-4 rounded-2xl border border-neutral-900">
          
          {/* Station selector */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest">Station:</span>
            <select
              value={selectedStationId}
              onChange={(e) => {
                setSelectedStationId(e.target.value);
                setSelectedTableId(null);
              }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:border-[#C5A059]/50 tracking-wider"
            >
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {/* Date Picker (Live mode only) */}
          {!isEditMode && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-[#C5A059]/50"
              />
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-850">
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedTableId(null);
              }}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isEditMode ? 'bg-[#C5A059] text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-calendar-days mr-2"></i>Live view
            </button>
            <button
              onClick={() => {
                setIsEditMode(true);
                setSelectedTableId(null);
              }}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-neutral-850 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              <i className="fa-solid fa-pencil mr-2"></i>Edit layout
            </button>
          </div>
        </div>

        {/* Floor Map Canvas */}
        <div className="relative">
          {/* Canvas status header */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-neutral-950/80 backdrop-blur border border-neutral-900 rounded-full px-4 py-1.5 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
              {saving ? 'Saving positions...' : 'Layout Synced'}
            </span>
          </div>

          {/* Grid canvas wrapper */}
          <div className="w-full overflow-auto bg-neutral-950 rounded-3xl border border-neutral-900 shadow-inner">
            <div
              ref={canvasRef}
              className="relative w-[800px] h-[500px] select-none"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(197, 160, 89, 0.15) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: 'center',
              }}
            >
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin"></div>
                </div>
              ) : tables.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500">
                  <i className="fa-solid fa-map-location-dot text-4xl mb-3 opacity-25"></i>
                  <span className="text-xs uppercase font-black tracking-widest">No tables in this station</span>
                  {isEditMode && <span className="text-[10px] mt-1 text-neutral-600">Use the right panel to add table #1</span>}
                </div>
              ) : (
                tables.map(table => {
                  const booking = getBookingForTable(table.number);
                  const isOccupied = !isEditMode && !!booking;
                  const isSelected = selectedTableId === table.id;
                  
                  // Shape type based on capacity
                  const shapeType = table.capacity <= 2 ? 'circle' : 'square';

                  return (
                    <div
                      key={table.id}
                      onPointerDown={(e) => handlePointerDown(e, table)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onClick={() => {
                        setSelectedTableId(table.id);
                        setEditingTableNum(table.number);
                        setEditingTableCap(table.capacity);
                      }}
                      className={`absolute w-[80px] h-[80px] flex items-center justify-center transition-shadow cursor-pointer ${isEditMode ? 'active:cursor-grabbing hover:scale-102' : ''}`}
                      style={{
                        left: `${table.positionX}px`,
                        top: `${table.positionY}px`,
                        touchAction: 'none'
                      }}
                    >
                      {/* Interactive table shell */}
                      <div
                        className={`w-14 h-14 relative flex flex-col items-center justify-center border-2 shadow-lg transition-all ${
                          shapeType === 'circle' ? 'rounded-full' : 'rounded-2xl'
                        } ${
                          isEditMode 
                            ? isSelected
                              ? 'bg-neutral-900 border-[#C5A059] text-[#C5A059] shadow-[#C5A059]/10'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                            : isOccupied
                              ? 'bg-[#1a0f12] border-red-500/80 text-red-400 shadow-red-500/5'
                              : 'bg-[#0f1912] border-green-500/60 text-green-400 shadow-green-500/5'
                        }`}
                      >
                        {/* Table Text */}
                        <span className="text-xs font-black tracking-tighter">#{table.number}</span>
                        <span className="text-[8px] opacity-60 font-black">{table.capacity} pax</span>

                        {/* Occupied tag inside table */}
                        {isOccupied && (
                          <span className="absolute -top-2 px-1.5 py-0.5 bg-red-500 text-black text-[7px] font-black rounded uppercase tracking-wider">
                            OCC
                          </span>
                        )}
                      </div>

                      {/* Surrounding chairs */}
                      {renderChairs(table.capacity, shapeType)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Detail & Edit Panel */}
      <div className="w-full xl:w-[320px] bg-neutral-900 rounded-3xl p-6 border border-neutral-850 flex flex-col min-h-[400px]">
        
        {/* Dynamic header */}
        <div className="border-b border-neutral-800 pb-4 mb-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A059]">
            {isEditMode ? 'Layout Settings' : 'Details'}
          </h3>
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
            {isEditMode ? 'Configure floor plan layout' : 'Real-time assignments'}
          </p>
        </div>

        {/* Panel Content */}
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Edit mode controls */}
          {isEditMode ? (
            <div className="space-y-6">
              {/* Add Table form */}
              <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl space-y-4">
                <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Add new table</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 5"
                      value={newTableNum}
                      onChange={e => setNewTableNum(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C5A059]/40"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Capacity</label>
                    <select
                      value={newTableCap}
                      onChange={e => setNewTableCap(parseInt(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                    >
                      <option value={2}>2 Pax</option>
                      <option value={4}>4 Pax</option>
                      <option value={6}>6 Pax</option>
                      <option value={8}>8 Pax</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddTable}
                  className="w-full py-2.5 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
                >
                  <i className="fa-solid fa-plus mr-2"></i>Create Table
                </button>
              </div>

              {/* Selected table details editor */}
              {selectedTable ? (
                <div className="bg-neutral-950 border border-[#C5A059]/10 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-neutral-300 tracking-wider">Table #{selectedTable.number}</h4>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A059] px-2 py-0.5 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/20">Selected</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Edit Table Number</label>
                      <input 
                        type="text" 
                        value={editingTableNum}
                        onChange={e => setEditingTableNum(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C5A059]/40"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Edit Capacity</label>
                      <select
                        value={editingTableCap}
                        onChange={e => setEditingTableCap(parseInt(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                      >
                        <option value={2}>2 Pax</option>
                        <option value={4}>4 Pax</option>
                        <option value={6}>6 Pax</option>
                        <option value={8}>8 Pax</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTable(selectedTable.id)}
                      className="flex-1 py-2 bg-neutral-800 text-neutral-200 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-750 transition-all"
                    >
                      Save Info
                    </button>
                    <button
                      onClick={() => handleDeleteTable(selectedTable.id)}
                      className="px-3.5 py-2 bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-xl hover:bg-red-950 transition-all text-xs"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 italic text-[10px] uppercase font-black tracking-widest">
                  Select a table on the floor map to configure properties or drag to position.
                </div>
              )}
            </div>
          ) : (
            
            /* Live mode controls */
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Selected table reservation details */}
              {selectedTable ? (
                <div className="space-y-4">
                  {/* Table title card */}
                  <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-2xl">
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Mesa Seleccionada</span>
                    <div className="flex justify-between items-end mt-1">
                      <h4 className="text-xl font-black text-white">Table #{selectedTable.number}</h4>
                      <span className="text-[9px] font-black text-neutral-400">{selectedTable.capacity} pax capacity</span>
                    </div>
                  </div>

                  {/* Active reservation or blank state */}
                  {activeBooking ? (
                    <div className="bg-neutral-950 border border-red-500/10 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Active Booking</span>
                          <h5 className="font-bold text-white text-md mt-0.5 leading-tight">{activeBooking.guestName}</h5>
                        </div>
                        <span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-wider rounded-md border ${STATUS_COLORS[activeBooking.status] || 'border-neutral-700 text-neutral-400'}`}>
                          {activeBooking.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-[10px] text-neutral-400 font-medium">
                        <div className="flex justify-between">
                          <span>Time window:</span>
                          <span className="font-bold text-neutral-200">
                            {new Date(activeBooking.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeBooking.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Guests:</span>
                          <span className="font-bold text-neutral-200">{activeBooking.people || 2} pax</span>
                        </div>
                      </div>

                      {/* Order items if any */}
                      {activeBooking.order && activeBooking.order.items?.length > 0 && (
                        <div className="border-t border-neutral-900 pt-3">
                          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-2">Pre-selected Dishes</span>
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {activeBooking.order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-[10px] py-1 border-b border-neutral-900/50">
                                <span className="font-semibold text-neutral-300">{item.dish?.name}</span>
                                <span className="font-black text-[#C5A059]">{item.quantity}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Complete / Free table button */}
                      <button
                        onClick={() => handleFreeTable(activeBooking)}
                        className="w-full py-3 bg-red-950/20 text-red-400 border border-red-900/30 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-950 hover:text-red-300 transition-all mt-4"
                      >
                        Free Table & Complete
                      </button>
                    </div>
                  ) : (
                    /* Free table: assign reservation panel */
                    <div className="bg-neutral-950 border border-green-500/10 p-5 rounded-2xl flex-1 flex flex-col">
                      <div className="mb-4">
                        <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Table is vacant</span>
                        <h5 className="font-bold text-neutral-200 text-xs uppercase tracking-wider mt-1">Assign Reservation</h5>
                      </div>

                      {unassignedBookings.length === 0 ? (
                        <div className="text-center py-6 text-neutral-600 italic text-[10px] uppercase font-black tracking-widest border border-dashed border-neutral-900 rounded-xl">
                          No pending bookings for this day.
                        </div>
                      ) : (
                        <div className="space-y-2 flex-1 max-h-[190px] overflow-y-auto pr-1">
                          {unassignedBookings.map(b => (
                            <div 
                              key={b.id} 
                              onClick={() => handleAssignBooking(b, selectedTable.number)}
                              className="group p-3 bg-neutral-900 hover:bg-[#C5A059]/10 border border-neutral-850 hover:border-[#C5A059]/30 rounded-xl cursor-pointer transition-all flex justify-between items-center"
                            >
                              <div className="pr-2">
                                <div className="font-bold text-neutral-200 group-hover:text-[#C5A059] text-xs transition-colors truncate max-w-[140px]">{b.guestName}</div>
                                <div className="text-[9px] text-neutral-500 font-semibold mt-0.5">
                                  {new Date(b.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {b.people || 2}p
                                </div>
                              </div>
                              <i className="fa-solid fa-plus text-[9px] text-neutral-600 group-hover:text-[#C5A059] transition-colors bg-neutral-950 rounded-lg p-1.5 border border-neutral-850"></i>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 italic text-[10px] uppercase font-black tracking-widest">
                  Select a table on the floor map to assign guests or view active bookings.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default VisualTableLayout;
