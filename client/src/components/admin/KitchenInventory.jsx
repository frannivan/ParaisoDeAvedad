import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KitchenInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, FOOD, EQUIPMENT
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, LOW, IN_STOCK
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('GRID'); // GRID, LIST
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'units', category: 'FOOD', lowStockAlert: 5 });

  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    fetchItems();
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const restRes = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/kitchen/restaurants`);
      setRestaurants(restRes.data);
    } catch (err) {
      console.error("Error fetching restaurants", err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/items`);
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching inventory items", err);
    }
    setLoading(false);
  };

  const handleUpdateQuantity = async (id, newQty) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/items/${id}`, { quantity: parseFloat(newQty) });
      fetchItems();
    } catch (err) {
      alert("Error updating quantity");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/items/${id}`);
      fetchItems();
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/admin/inventory/items`, newItem);
      setShowAddModal(false);
      setNewItem({ name: '', quantity: 0, unit: 'units', category: 'FOOD', lowStockAlert: 5 });
      fetchItems();
    } catch (err) {
      alert("Error adding item");
    }
  };

  const filteredItems = items.filter(i => {
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;
    const isLow = i.quantity <= (i.lowStockAlert || 5);
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'LOW' ? isLow : !isLow);
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Kitchen <span className="text-[#C5A059]">Inventory</span></h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage food supplies and equipment</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${viewMode === 'GRID' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
              ><i className="fa-solid fa-grip"></i></button>
              <button 
                onClick={() => setViewMode('LIST')}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-[#111] text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
              ><i className="fa-solid fa-list"></i></button>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-[#C5A059] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#C5A059]/20"
            >Add Item</button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm"></i>
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-[#C5A059]/50 transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="FOOD">Food / Ingredients</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW">Low Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="py-20 text-center text-gray-300">
             <div className="w-8 h-8 border-2 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin mx-auto mb-4"></div>
             Loading inventory...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center text-gray-300 italic border border-dashed border-gray-100 rounded-3xl">No items found matching your filters.</div>
        ) : viewMode === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="p-6 bg-gray-50 border border-gray-100 rounded-2xl group transition-all hover:border-[#C5A059]/30">
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${item.category === 'FOOD' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.category}
                   </div>
                   <button onClick={() => handleDelete(item.id)} className="text-gray-200 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                </div>
                
                <h4 className="font-bold text-[#111] mb-4">{item.name}</h4>
                
                <div className="flex items-center justify-between gap-4">
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-[#111] hover:text-white transition-all"
                      >-</button>
                      <div className="flex flex-col items-center min-w-[60px]">
                         <span className="text-sm font-black">{item.quantity}</span>
                         <span className="text-[9px] text-gray-400 font-bold uppercase">{item.unit}</span>
                      </div>
                      <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-[#111] hover:text-white transition-all"
                      >+</button>
                   </div>
                   
                    <div className="text-right">
                      <div className={`text-[9px] font-black uppercase ${item.quantity <= (item.lowStockAlert || 5) ? 'text-red-500' : 'text-green-500'}`}>
                         {item.quantity <= (item.lowStockAlert || 5) ? 'Low Stock' : 'In Stock'}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="pb-4 pl-4">Item Name</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4">Quantity</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map(item => (
                  <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 pl-4">
                      <span className="text-sm font-bold text-[#111]">{item.name}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${item.category === 'FOOD' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))} className="text-gray-300 hover:text-black">
                          <i className="fa-solid fa-minus text-[10px]"></i>
                        </button>
                        <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="text-gray-300 hover:text-black">
                          <i className="fa-solid fa-plus text-[10px]"></i>
                        </button>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-[9px] font-black uppercase ${item.quantity <= (item.lowStockAlert || 5) ? 'text-red-500' : 'text-green-500'}`}>
                        {item.quantity <= (item.lowStockAlert || 5) ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button onClick={() => handleDelete(item.id)} className="text-gray-200 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6">New <span className="text-[#C5A059]">Inventory Item</span></h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="text" placeholder="Item Name (e.g. Tomato, Fork)" required
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
              />
              
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Initial Qty</label>
                  <input 
                    type="number" step="0.01" required
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-2">Low Stock Alert At</label>
                  <input 
                    type="number" step="0.01" required
                    value={newItem.lowStockAlert}
                    onChange={e => setNewItem({...newItem, lowStockAlert: parseFloat(e.target.value)})}
                    className="w-full bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>
              </div>

              <select 
                  onChange={e => setNewItem({...newItem, unit: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                >
                  <option value="units">Units</option>
                  <option value="kg">Kilograms</option>
                  <option value="liters">Liters</option>
                  <option value="boxes">Boxes</option>
                </select>

              <select 
                onChange={e => setNewItem({...newItem, category: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
              >
                <option value="FOOD">Food / Ingredients</option>
                <option value="EQUIPMENT">Equipment (Plates, Spoons, etc.)</option>
              </select>

              <select 
                onChange={e => setNewItem({...newItem, restaurantId: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
              >
                <option value="">Select Station/Restaurant (Optional)</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-[#111] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#C5A059]">Add to Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenInventory;
