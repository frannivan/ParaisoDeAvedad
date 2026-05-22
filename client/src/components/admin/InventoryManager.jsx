import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InventoryManager = ({ adminMode = 'all' }) => {
  const [activeSubTab, setActiveSubTab] = useState(adminMode === 'restaurant' ? 'dishes' : 'rooms'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  
  // State for adding a new table to a station
  const [newTable, setNewTable] = useState({ restaurantId: null, number: '', capacity: 2 });

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeSubTab === 'rooms') endpoint = '/admin/inventory/room-types';
      else if (activeSubTab === 'dishes') endpoint = '/admin/inventory/dishes';
      else if (activeSubTab === 'services') endpoint = '/admin/inventory/extra-services';
      else if (activeSubTab === 'stations') endpoint = '/kitchen/restaurants';

      const timestamp = new Date().getTime();
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}?_t=${timestamp}`);
      setData(res.data);

      const restRes = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants?_t=${timestamp}`);
      setRestaurants(restRes.data);
    } catch (err) {
      console.error("Error fetching inventory", err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      let endpoint = '';
      if (activeSubTab === 'rooms') endpoint = `/admin/inventory/room-types/${id}`;
      else if (activeSubTab === 'dishes') endpoint = `/admin/inventory/dishes/${id}`;
      else if (activeSubTab === 'services') endpoint = `/admin/inventory/extra-services/${id}`;
      else if (activeSubTab === 'stations') endpoint = `/kitchen/restaurants/${id}`;

      await axios.delete(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}`);
      fetchData();
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const handleAddTable = async (restaurantId) => {
    if (!newTable.number) return alert("Please enter a table number");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants/${restaurantId}/tables`, {
        number: newTable.number,
        capacity: parseInt(newTable.capacity)
      });
      setNewTable({ restaurantId: null, number: '', capacity: 2 });
      fetchData();
    } catch (err) {
      alert("Error adding table");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Delete this table?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/tables/${tableId}`);
      fetchData();
    } catch (err) {
      alert("Error deleting table");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/upload`, {
          image: reader.result,
          name: file.name
        });
        setFormData({ ...formData, imageUrl: res.data.url });
      } catch (err) {
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      if (activeSubTab === 'rooms') endpoint = '/admin/inventory/room-types';
      else if (activeSubTab === 'dishes') endpoint = '/admin/inventory/dishes';
      else if (activeSubTab === 'services') endpoint = '/admin/inventory/extra-services';
      else if (activeSubTab === 'stations') endpoint = '/kitchen/restaurants';

      if (editingItem) {
        await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}/${editingItem.id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || '/api'}${endpoint}`, formData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (err) {
      console.error("Save Error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Error saving item. Check console.");
    }
  };

  const tabs = adminMode === 'restaurant' 
    ? [
        { id: 'dishes', label: 'Dishes & Drinks' },
        { id: 'stations', label: 'Stations' }
      ]
    : [
        { id: 'rooms', label: 'Rooms' },
        { id: 'dishes', label: 'Dishes' },
        { id: 'services', label: 'Services' },
        { id: 'stations', label: 'Stations' }
      ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Sub Tabs */}
      <div className="flex bg-gray-50 border-b border-gray-100 p-2">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeSubTab === tab.id ? 'bg-white text-[#C5A059] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >{tab.label}</button>
        ))}
      </div>

      <div className="p-8 flex justify-between items-center">
        <h3 className="text-sm font-black uppercase tracking-tighter">
          Managing <span className="text-[#C5A059]">{tabs.find(t => t.id === activeSubTab)?.label}</span>
        </h3>
        <button 
          onClick={() => { setEditingItem(null); setFormData({ category: 'FOOD' }); setShowModal(true); }}
          className="px-6 py-3 bg-[#111] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-lg active:scale-95"
        >
          <i className="fa-solid fa-plus mr-2"></i> Add New
        </button>
      </div>

      <div className="px-8 pb-8">
        {loading ? (
          <div className="py-20 text-center text-gray-300 animate-pulse">Loading...</div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center text-gray-300 italic border border-dashed border-gray-100 rounded-3xl uppercase text-[10px] font-black tracking-widest">No items found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map(item => (
              <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-3xl relative group overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                <div className="h-44 bg-gray-200 relative overflow-hidden">
                   {item.imageUrl ? (
                     <img src={item.imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || ''}${item.imageUrl}` : item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100"><i className="fa-solid fa-image text-3xl opacity-20"></i></div>
                   )}
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl text-blue-500 shadow-sm flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      <button onClick={() => handleDelete(item.id)} className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl text-red-500 shadow-sm flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-trash-can text-xs"></i></button>
                   </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest">
                       {activeSubTab === 'dishes' ? (item.category || 'FOOD') : activeSubTab === 'rooms' ? `Pax: ${item.capacity}` : 'Restaurant'}
                    </span>
                    <span className="text-xs font-black text-[#111]">
                       {activeSubTab === 'stations' ? `${item.tables?.length || 0} Tables` : `$${item.price || item.basePrice || 0}`}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#111] mb-4 text-lg tracking-tight leading-tight">
                    {item.name}
                    {item.isChefRecommendation && (
                      <span className="block mt-1 px-2 py-0.5 bg-[#C5A059]/10 text-[#C5A059] text-[10px] font-black uppercase tracking-widest rounded w-max">
                        <i className="fa-solid fa-star mr-1"></i> Chef's Rec
                      </span>
                    )}
                  </h4>
                  
                  {activeSubTab === 'stations' ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-inner">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">Managed Tables</div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.tables?.map(t => (
                            <div key={t.id} className="group/t flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 transition-all hover:border-red-200">
                              <span className="text-[10px] font-bold text-[#111]">#{t.number} <span className="opacity-40 ml-1">({t.capacity}p)</span></span>
                              <button onClick={() => handleDeleteTable(t.id)} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-xmark text-[8px]"></i></button>
                            </div>
                          ))}
                        </div>
                        {/* Inline Add Table Form */}
                        <div className="flex gap-2 items-center pt-3 border-t border-gray-50">
                          <input 
                            type="text" placeholder="No." 
                            value={newTable.restaurantId === item.id ? newTable.number : ''}
                            onChange={e => setNewTable({ ...newTable, restaurantId: item.id, number: e.target.value })}
                            className="w-12 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
                          />
                          <input 
                            type="number" placeholder="Pax"
                            value={newTable.restaurantId === item.id ? newTable.capacity : ''}
                            onChange={e => setNewTable({ ...newTable, restaurantId: item.id, capacity: e.target.value })}
                            className="w-12 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
                          />
                          <button 
                            onClick={() => handleAddTable(item.id)}
                            className="bg-[#111] text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#C5A059]"
                          >Add</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    item.description && <p className="text-xs text-gray-400 line-clamp-3 mb-6 flex-1 leading-relaxed">{item.description}</p>
                  )}

                  <div className="pt-4 border-t border-gray-100 mt-auto flex justify-end items-center">
                    <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} className="text-[10px] font-black text-gray-400 hover:text-[#C5A059] uppercase tracking-widest">Edit</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal (Dishes, Rooms, etc) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-6" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 animate-in zoom-in shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">{editingItem ? 'Edit' : 'Create'} <span className="text-[#C5A059]">{activeSubTab.slice(0,-1)}</span></h3>
              <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-black transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center">
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || ''}${formData.imageUrl}` : formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                      <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-xl shadow-lg flex items-center justify-center"><i className="fa-solid fa-trash-can text-xs"></i></button>
                    </>
                  ) : (
                    <>
                      <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin text-[#C5A059]' : 'fa-cloud-arrow-up text-gray-400'} text-3xl mb-2`}></i>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{uploading ? 'Uploading...' : 'Click to Upload Image'}</p>
                    </>
                  )}
               </div>

               <div className="space-y-4">
                  <input type="text" placeholder="Name" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-[#C5A059]/50 transition-all" />
                  {activeSubTab !== 'stations' && (
                    <textarea placeholder="Description" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold h-24 outline-none focus:border-[#C5A059]/50 transition-all resize-none"></textarea>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {activeSubTab !== 'stations' && (
                      <input type="number" placeholder="Price" required value={formData.price || formData.basePrice || ''} onChange={e => setFormData({...formData, [activeSubTab === 'rooms' ? 'basePrice' : 'price']: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />
                    )}
                    {activeSubTab === 'rooms' && <input type="number" placeholder="Capacity" required value={formData.capacity || ''} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none" />}
                    
                    {activeSubTab === 'dishes' && (
                      <select value={formData.category || 'FOOD'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                        <option value="FOOD">FOOD</option>
                        <option value="DRINK">DRINK</option>
                      </select>
                    )}
                  </div>

                  {activeSubTab === 'dishes' && (
                    <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" checked={formData.isChefRecommendation || false} onChange={e => setFormData({...formData, isChefRecommendation: e.target.checked})} className="w-5 h-5 accent-[#C5A059] rounded" />
                      <span className="text-sm font-bold text-gray-700">Chef's Recommendation</span>
                    </label>
                  )}

                </div>

               <button type="submit" className="w-full py-5 bg-[#111] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#C5A059] transition-all transform active:scale-95 mt-4">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
