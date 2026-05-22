import React, { useState, useEffect } from 'react';
import Calculator from './Calculator';

// Seed default products in English
const DEFAULT_PRODUCTS = [
  { id: '1', name: '1.5L Water Bottle', price: 35, category: 'Drinks', stock: 25, minStock: 8, barcode: '7501001' },
  { id: '2', name: 'Family Size Soda', price: 45, category: 'Drinks', stock: 15, minStock: 5, barcode: '7501002' },
  { id: '3', name: 'Crispy Potato Chips', price: 30, category: 'Snacks', stock: 20, minStock: 6, barcode: '7501003' },
  { id: '4', name: 'Artisanal Chocolates', price: 120, category: 'Snacks', stock: 4, minStock: 5, barcode: '7501004' }, // low stock
  { id: '5', name: 'SPF 50 Sunscreen', price: 180, category: 'Pharmacy', stock: 12, minStock: 4, barcode: '7501005' },
  { id: '6', name: 'Paraíso Embroidered Cap', price: 250, category: 'Souvenirs', stock: 10, minStock: 3, barcode: '7501006' },
  { id: '7', name: 'Premium Beach Towel', price: 350, category: 'Souvenirs', stock: 2, minStock: 3, barcode: '7501007' }, // low stock
];

const POSMain = () => {
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || 'luxury');
  
  const toggleTheme = () => {
    const themes = ['luxury', 'green', 'plain'];
    const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    setTheme(nextTheme);
    localStorage.setItem('pos_theme', nextTheme);
  };

  // Local DB States
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null); // { status: 'CLOSED' | 'OPEN', initialCash: 0, currentCash: 0, startTime, log: [] }
  const [salesHistory, setSalesHistory] = useState([]);

  // Active view tabs
  const [activeTab, setActiveTab] = useState('sales'); // sales, inventory, history
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Sales state
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  
  // Checkout Modal/Process state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, ROOM_CHARGE
  const [amountReceived, setAmountReceived] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [cardRef, setCardRef] = useState('');

  // Cash adjustment modal state (Inflow / Outflow)
  const [showCashAdjModal, setShowCashAdjModal] = useState(false);
  const [adjType, setAdjType] = useState('INFLOW'); // INFLOW, OUTFLOW
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Session start state
  const [startCashInput, setStartCashInput] = useState('1000');

  // Session reconciliation / closing modal state
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [physicalCashInput, setPhysicalCashInput] = useState('');

  // Inventory forms
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Drinks', stock: '', minStock: '5', barcode: '' });

  // Draggable Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calcPos, setCalcPos] = useState({ x: window.innerWidth - 340, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - calcPos.x,
        y: e.clientY - calcPos.y
      });
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 330, e.clientX - dragStart.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 380, e.clientY - dragStart.y));
      setCalcPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Initialize DB from LocalStorage
  useEffect(() => {
    const localProducts = localStorage.getItem('pos_products');
    if (localProducts) {
      let parsed = JSON.parse(localProducts);
      const translationMap = {
        "Botella de Agua 1.5L": "1.5L Water Bottle",
        "Refresco Familiar": "Family Size Soda",
        "Papas Fritas Crujientes": "Crispy Potato Chips",
        "Chocolates Artesanales": "Artisanal Chocolates",
        "Protector Solar SPF 50": "SPF 50 Sunscreen",
        "Gorra Bordada Paraíso": "Paraíso Embroidered Cap",
        "Toalla de Playa Premium": "Premium Beach Towel"
      };
      const categoryMap = {
        "Bebidas": "Drinks",
        "Snacks": "Snacks",
        "Souvenirs": "Souvenirs",
        "Farmacia": "Pharmacy"
      };
      let hasChanges = false;
      const migrated = parsed.map(p => {
        let updated = { ...p };
        if (translationMap[p.name]) {
          updated.name = translationMap[p.name];
          hasChanges = true;
        }
        if (categoryMap[p.category]) {
          updated.category = categoryMap[p.category];
          hasChanges = true;
        }
        return updated;
      });
      if (hasChanges) {
        localStorage.setItem('pos_products', JSON.stringify(migrated));
        setProducts(migrated);
      } else {
        setProducts(parsed);
      }
    } else {
      localStorage.setItem('pos_products', JSON.stringify(DEFAULT_PRODUCTS));
      setProducts(DEFAULT_PRODUCTS);
    }

    const localSession = localStorage.getItem('pos_session');
    if (localSession) {
      setSession(JSON.parse(localSession));
    } else {
      const closedSession = { status: 'CLOSED' };
      localStorage.setItem('pos_session', JSON.stringify(closedSession));
      setSession(closedSession);
    }

    const localHistory = localStorage.getItem('pos_sales_history');
    if (localHistory) {
      setSalesHistory(JSON.parse(localHistory));
    }
  }, []);

  // Save helpers
  const saveProducts = (updated) => {
    localStorage.setItem('pos_products', JSON.stringify(updated));
    setProducts(updated);
  };

  const saveSession = (updated) => {
    localStorage.setItem('pos_session', JSON.stringify(updated));
    setSession(updated);
  };

  const saveSalesHistory = (updated) => {
    localStorage.setItem('pos_sales_history', JSON.stringify(updated));
    setSalesHistory(updated);
  };

  // Cash Register Actions
  const handleOpenSession = () => {
    const cash = parseFloat(startCashInput) || 0;
    const newSess = {
      status: 'OPEN',
      initialCash: cash,
      currentCash: cash,
      startTime: new Date().toISOString(),
      log: [{ time: new Date().toISOString(), type: 'OPEN', amount: cash, reason: 'Initial Register Cash' }]
    };
    saveSession(newSess);
  };

  const handleCloseSession = () => {
    const realCash = parseFloat(physicalCashInput) || 0;
    const expectedCash = session.currentCash;
    const difference = realCash - expectedCash;

    // Create session audit log
    const closedLog = {
      startTime: session.startTime,
      endTime: new Date().toISOString(),
      initialCash: session.initialCash,
      expectedCash: expectedCash,
      realCash: realCash,
      difference: difference,
      log: session.log
    };

    // Save to historical reports
    const auditHistory = JSON.parse(localStorage.getItem('pos_audit_history') || '[]');
    localStorage.setItem('pos_audit_history', JSON.stringify([closedLog, ...auditHistory]));

    // Update current session to CLOSED
    const closedSess = { status: 'CLOSED' };
    saveSession(closedSess);
    setShowReconcileModal(false);
    setPhysicalCashInput('');
    alert(`Register closed successfully.\nDifference: $${difference.toFixed(2)} (${difference >= 0 ? 'Surplus' : 'Deficit'})`);
  };

  const handleCashAdjustment = () => {
    const amt = parseFloat(adjAmount) || 0;
    if (amt <= 0 || !adjReason) return alert('Invalid inputs');

    const amountChange = adjType === 'INFLOW' ? amt : -amt;
    const newLog = {
      time: new Date().toISOString(),
      type: adjType,
      amount: amt,
      reason: adjReason
    };

    const updatedSess = {
      ...session,
      currentCash: session.currentCash + amountChange,
      log: [...session.log, newLog]
    };

    saveSession(updatedSess);
    setShowCashAdjModal(false);
    setAdjAmount('');
    setAdjReason('');
  };

  // Shopping Cart Actions
  const addToCart = (product) => {
    if (product.stock <= 0) return alert('Product is out of stock');
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('Cannot exceed available stock');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    const product = products.find(p => p.id === id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = item.qty + delta;
        if (nextQty <= 0) return null;
        if (nextQty > product.stock) {
          alert('Cannot exceed available stock');
          return item;
        }
        return { ...item, qty: nextQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    const matched = products.find(p => p.barcode === barcodeQuery || p.id === barcodeQuery);
    if (matched) {
      addToCart(matched);
      setBarcodeQuery('');
    } else {
      alert('Barcode not found');
    }
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckoutSubmit = () => {
    const total = getCartTotal();
    
    if (paymentMethod === 'CASH') {
      const cashRec = parseFloat(amountReceived) || 0;
      if (cashRec < total) return alert('Insufficient cash received');
    }

    if (paymentMethod === 'ROOM_CHARGE' && (!roomNumber || !guestName)) {
      return alert('Please enter room number and guest name');
    }

    // Deduct Stock
    const updatedProducts = products.map(prod => {
      const cartItem = cart.find(item => item.id === prod.id);
      if (cartItem) {
        return { ...prod, stock: prod.stock - cartItem.qty };
      }
      return prod;
    });

    // Create Sale record
    const newSale = {
      id: `V-${Date.now()}`,
      time: new Date().toISOString(),
      items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, qty: item.qty })),
      total,
      paymentMethod,
      details: paymentMethod === 'ROOM_CHARGE' 
        ? `Room ${roomNumber} - ${guestName}` 
        : paymentMethod === 'CARD' 
          ? `Ref Code: ${cardRef}` 
          : `Cash Paid: $${amountReceived}`
    };

    // Update Session cash if paid in CASH
    const cashAddition = paymentMethod === 'CASH' ? total : 0;
    const updatedSession = {
      ...session,
      currentCash: session.currentCash + cashAddition,
      log: [
        ...session.log,
        { time: new Date().toISOString(), type: 'SALE', amount: total, reason: `Sale ${newSale.id} - ${paymentMethod}` }
      ]
    };

    saveProducts(updatedProducts);
    saveSession(updatedSession);
    saveSalesHistory([newSale, ...salesHistory]);

    // Reset checkout states
    setCart([]);
    setShowCheckoutModal(false);
    setAmountReceived('');
    setRoomNumber('');
    setGuestName('');
    setCardRef('');
    alert('Sale completed successfully!');
  };

  // Inventory Management Actions
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (editingProduct) {
      // Edit
      const updated = products.map(p => p.id === editingProduct.id ? { 
        ...p, 
        name: editingProduct.name,
        price: parseFloat(editingProduct.price) || 0,
        category: editingProduct.category,
        stock: parseInt(editingProduct.stock) || 0,
        minStock: parseInt(editingProduct.minStock) || 0,
        barcode: editingProduct.barcode
      } : p);
      saveProducts(updated);
      setEditingProduct(null);
    } else {
      // Create
      if (!newProduct.name || !newProduct.price) return alert('Please complete required fields');
      const item = {
        id: `P-${Date.now()}`,
        name: newProduct.name,
        price: parseFloat(newProduct.price) || 0,
        category: newProduct.category,
        stock: parseInt(newProduct.stock) || 0,
        minStock: parseInt(newProduct.minStock) || 0,
        barcode: newProduct.barcode || `B-${Date.now().toString().slice(-6)}`
      };
      saveProducts([...products, item]);
      setNewProduct({ name: '', price: '', category: 'Drinks', stock: '', minStock: '5', barcode: '' });
    }
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
  };

  // Inventory Alerts check
  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  // Calculator Integration Callback
  const handleUseCalculatorValue = (value) => {
    if (showCheckoutModal && paymentMethod === 'CASH') {
      setAmountReceived(value.toString());
    } else if (showCashAdjModal) {
      setAdjAmount(value.toString());
    } else {
      alert(`Calculated Value: $${value}. Enter it manually in the desired input field.`);
    }
  };

  // Filtering
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  return (
    <div className={`theme-${theme} flex-1 flex flex-col h-full bg-[#0b0b0b] relative transition-colors duration-300`}>
      
      {/* Top Banner Navigation */}
      <header className="flex justify-between items-center bg-neutral-900 border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C5A059] flex items-center justify-center text-black font-black">
            <i className="fa-solid fa-store text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest text-white">Paraíso de Avedad</h1>
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mt-0.5">Independent Point of Sale</p>
          </div>
        </div>

        {/* Global low stock notification badge */}
        {lowStockItems.length > 0 && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
            <i className="fa-solid fa-triangle-exclamation"></i>
            {lowStockItems.length} Inventory Alerts
          </div>
        )}

        {/* Navigation Tabs & Theme Switcher & Calculator */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCalc(!showCalc)}
            title="Toggle Calculator"
            className={`w-8 h-8 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${showCalc ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-calculator text-xs"></i>
          </button>

          <button 
            onClick={toggleTheme}
            title={`Active Theme: ${theme.toUpperCase()} (Click to change)`}
            className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <i className="fa-solid fa-palette text-xs"></i>
          </button>

          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button 
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'sales' ? 'bg-[#C5A059] text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              Sales
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#C5A059] text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[#C5A059] text-black shadow-md' : 'text-neutral-400 hover:text-white'}`}
            >
              Register & Shifts
            </button>
          </div>
        </div>
      </header>

      {/* Main body split */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Closed session block */}
        {session?.status === 'CLOSED' ? (
          <div className="flex-1 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
              <i className="fa-solid fa-vault text-5xl text-neutral-600"></i>
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest text-[#C5A059]">Register Closed</h3>
                <p className="text-xs text-neutral-400 mt-1">Open a new shift with a starting cash amount to begin operations.</p>
              </div>
              <div className="space-y-3 text-left">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Starting Cash ($)</label>
                <input 
                  type="number"
                  value={startCashInput}
                  onChange={e => setStartCashInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#C5A059]/40"
                />
              </div>
              <button
                onClick={handleOpenSession}
                className="w-full py-3.5 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-97"
              >
                Open Cash Drawer
              </button>
            </div>
          </div>
        ) : (
          
          /* Active App Area */
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT AREA: Switchable Views */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: Sales workspace */}
              {activeTab === 'sales' && (
                <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                  
                  {/* Search and barcode utilities */}
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Catalog search query */}
                    <div className="relative flex-1 w-full">
                      <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm"></i>
                      <input 
                        type="text" 
                        placeholder="Search product by name or barcode..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs font-bold outline-none focus:border-[#C5A059]/50 transition-all"
                      />
                    </div>

                    {/* Barcode scanner simulator */}
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2 w-full md:w-auto">
                      <input 
                        type="text" 
                        placeholder="Scan Barcode..."
                        value={barcodeQuery}
                        onChange={e => setBarcodeQuery(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-[#C5A059]/50"
                      />
                      <button type="submit" className="px-5 py-3 bg-neutral-800 hover:bg-[#C5A059] hover:text-black text-[9px] font-black uppercase tracking-widest rounded-2xl transition-colors">
                        Enter
                      </button>
                    </form>
                  </div>

                  {/* Categories bar */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-[#C5A059] text-black border-[#C5A059]' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Products Grid */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map(prod => {
                        const isLowStock = prod.stock <= prod.minStock;
                        return (
                          <div 
                            key={prod.id} 
                            onClick={() => addToCart(prod)}
                            className="bg-neutral-900 border border-neutral-800 hover:border-[#C5A059]/40 rounded-2xl p-4 cursor-pointer transition-all hover:scale-101 flex flex-col justify-between h-36 relative overflow-hidden group shadow-md"
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1">
                                <span className="text-[8px] font-black uppercase text-[#C5A059] tracking-wider bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/20">{prod.category}</span>
                                {isLowStock && (
                                  <span className="text-[7px] font-black uppercase text-amber-500 animate-pulse bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded">Low Stock</span>
                                )}
                              </div>
                              <h4 className="font-bold text-white text-xs mt-2 group-hover:text-[#C5A059] transition-colors line-clamp-2 leading-tight">{prod.name}</h4>
                            </div>
                            
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-neutral-850">
                              <span className="font-black text-white text-md">${prod.price}</span>
                              <span className={`text-[8px] font-bold ${prod.stock === 0 ? 'text-red-500' : 'text-neutral-500'}`}>{prod.stock} avail.</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Inventory manager */}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  {/* Summary alerts box */}
                  {lowStockItems.length > 0 && (
                    <div className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-2xl">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        Inventory Stock Threshold Alerts
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {lowStockItems.map(item => (
                          <div key={item.id} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-850 text-[10px]">
                            <div className="font-bold text-white truncate">{item.name}</div>
                            <div className="text-neutral-500 font-bold mt-1">Available: <span className="text-amber-400 font-black">{item.stock}</span> (Min: {item.minStock})</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Add / Edit product form */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-[#C5A059] tracking-wider border-b border-neutral-800 pb-2">
                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                      </h3>
                      
                      <form onSubmit={handleSaveProduct} className="space-y-3">
                        <div>
                          <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Product Name</label>
                          <input 
                            type="text" 
                            required
                            value={editingProduct ? editingProduct.name : newProduct.name}
                            onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Retail Price ($)</label>
                            <input 
                              type="number" 
                              required
                              value={editingProduct ? editingProduct.price : newProduct.price}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: e.target.value}) : setNewProduct({...newProduct, price: e.target.value})}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Category</label>
                            <select
                              value={editingProduct ? editingProduct.category : newProduct.category}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none"
                            >
                              <option value="Drinks">Drinks</option>
                              <option value="Snacks">Snacks</option>
                              <option value="Souvenirs">Souvenirs</option>
                              <option value="Pharmacy">Pharmacy</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Initial Stock</label>
                            <input 
                              type="number"
                              value={editingProduct ? editingProduct.stock : newProduct.stock}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, stock: e.target.value}) : setNewProduct({...newProduct, stock: e.target.value})}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Min Alert Stock</label>
                            <input 
                              type="number"
                              value={editingProduct ? editingProduct.minStock : newProduct.minStock}
                              onChange={e => editingProduct ? setEditingProduct({...editingProduct, minStock: e.target.value}) : setNewProduct({...newProduct, minStock: e.target.value})}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[8px] font-black text-neutral-500 uppercase block mb-1">Barcode</label>
                          <input 
                            type="text"
                            value={editingProduct ? editingProduct.barcode : newProduct.barcode}
                            onChange={e => editingProduct ? setEditingProduct({...editingProduct, barcode: e.target.value}) : setNewProduct({...newProduct, barcode: e.target.value})}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button type="submit" className="flex-1 py-2.5 bg-[#C5A059] text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90">
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                          </button>
                          {editingProduct && (
                            <button 
                              type="button" 
                              onClick={() => setEditingProduct(null)}
                              className="py-2.5 px-4 bg-neutral-800 text-neutral-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:text-white"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Catalog products list */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl lg:col-span-2 space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Registered Products</h3>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                        {products.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-neutral-950 border border-neutral-850 rounded-xl">
                            <div>
                              <div className="font-bold text-xs text-white">{p.name}</div>
                              <div className="text-[9px] text-neutral-500 font-bold mt-1">
                                Category: {p.category} · Barcode: {p.barcode} · Price: <span className="text-[#C5A059]">${p.price}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black ${p.stock <= p.minStock ? 'text-amber-500' : 'text-neutral-400'}`}>{p.stock} avail.</span>
                              <button 
                                onClick={() => setEditingProduct({ ...p, price: p.price.toString(), stock: p.stock.toString(), minStock: p.minStock.toString() })}
                                className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-850 flex items-center justify-center border border-neutral-800 text-neutral-400 hover:text-white"
                              >
                                <i className="fa-solid fa-pencil text-xs"></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(p.id)}
                                className="w-8 h-8 rounded-lg bg-red-950/20 hover:bg-red-950/40 flex items-center justify-center border border-red-900/20 text-red-400 hover:text-red-300"
                              >
                                <i className="fa-solid fa-trash-can text-xs"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: History & turn control */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  
                  {/* Cash drawer summary stats card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Starting Shift Cash</span>
                      <h4 className="text-2xl font-black text-white mt-1">${session.initialCash}</h4>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Expected Register Cash</span>
                      <h4 className="text-2xl font-black text-[#C5A059] mt-1">${session.currentCash}</h4>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between">
                      <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Shift Active Since</span>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-xs text-neutral-400 font-bold">
                          {new Date(session.startTime).toLocaleTimeString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setAdjType('INFLOW'); setShowCashAdjModal(true); }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-[#C5A059] hover:text-black text-[8px] font-black uppercase tracking-widest rounded-lg transition-colors border border-neutral-750"
                          >
                            <i className="fa-solid fa-arrow-down-to-bracket mr-1"></i>Inflow
                          </button>
                          <button
                            onClick={() => { setAdjType('OUTFLOW'); setShowCashAdjModal(true); }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-[#C5A059] hover:text-black text-[8px] font-black uppercase tracking-widest rounded-lg transition-colors border border-neutral-750"
                          >
                            <i className="fa-solid fa-arrow-up-from-bracket mr-1"></i>Outflow
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Session Log / Movements */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Shift Audit Trail</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {session.log.slice().reverse().map((lg, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-neutral-950 border border-neutral-850 rounded-xl text-[11px]">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${lg.type === 'SALE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : lg.type === 'INFLOW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {lg.type}
                              </span>
                              <span className="text-neutral-500 font-bold ml-2">
                                {new Date(lg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div className="text-white font-medium mt-1">{lg.reason}</div>
                            </div>
                            <span className="font-black text-white">${lg.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales History list */}
                    <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Sales Ledger</h3>
                        <button
                          onClick={() => setShowReconcileModal(true)}
                          className="px-4 py-2 bg-red-950/20 text-red-400 border border-red-900/30 text-[8px] font-black uppercase tracking-widest rounded-xl hover:bg-red-950 transition-colors"
                        >
                          Reconcile & Close Shift
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {salesHistory.length === 0 ? (
                          <div className="text-center py-8 text-neutral-600 italic text-[10px] uppercase font-black tracking-widest border border-dashed border-neutral-850 rounded-xl">No sales recorded.</div>
                        ) : (
                          salesHistory.map(sl => (
                            <div key={sl.id} className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-xs text-white">{sl.id}</div>
                                  <div className="text-[8px] font-black text-neutral-500 uppercase mt-0.5">
                                    {new Date(sl.time).toLocaleTimeString()} · {sl.paymentMethod}
                                  </div>
                                </div>
                                <span className="font-black text-[#C5A059] text-xs">${sl.total}</span>
                              </div>
                              <div className="text-[9px] text-neutral-400 font-medium">{sl.details}</div>
                              <div className="text-[9px] text-neutral-500 font-bold border-t border-neutral-900 pt-1.5 truncate">
                                {sl.items.map(it => `${it.name} (${it.qty}x)`).join(', ')}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT AREA: Shopping Cart Sidebar (Fixed) */}
            {activeTab === 'sales' && (
              <div className="w-[320px] bg-neutral-900 border-l border-neutral-800 flex flex-col justify-between">
                
                {/* Cart Header */}
                <div className="p-5 border-b border-neutral-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-[#C5A059] tracking-wider">Shopping Cart</span>
                    <span className="text-[9px] font-black bg-neutral-950 px-2 py-0.5 rounded-full text-neutral-400">{cart.length} items</span>
                  </div>
                </div>

                {/* Cart items list */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 py-12">
                      <i className="fa-solid fa-cart-shopping text-3xl opacity-20 mb-2"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Cart is empty</span>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="bg-neutral-950 border border-neutral-850 p-3 rounded-xl flex justify-between items-center">
                        <div className="pr-2 truncate max-w-[170px]">
                          <div className="font-bold text-xs text-white truncate">{item.name}</div>
                          <div className="text-[9px] font-black text-neutral-500 mt-1">${item.price} ea.</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateCartQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
                          >
                            -
                          </button>
                          <span className="font-bold text-xs text-white w-4 text-center">{item.qty}</span>
                          <button 
                            onClick={() => updateCartQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 flex items-center justify-center text-neutral-400"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart totals & checkout trigger */}
                <div className="p-5 border-t border-neutral-800 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Total to Collect</span>
                    <span className="text-2xl font-black text-[#C5A059]">${getCartTotal()}</span>
                  </div>

                  <button
                    disabled={cart.length === 0}
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full py-3.5 bg-[#C5A059] disabled:opacity-20 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-97 disabled:pointer-events-none"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Draggable Calculator Box */}
      {showCalc && (
        <div 
          style={{ left: `${calcPos.x}px`, top: `${calcPos.y}px` }}
          className="fixed z-50 shadow-2xl select-none"
          onMouseDown={handleMouseDown}
        >
          <Calculator 
            onUseValue={handleUseCalculatorValue} 
            onClose={() => setShowCalc(false)}
          />
        </div>
      )}

      {/* MODAL 1: CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A059]">Checkout Process</h3>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Total display */}
            <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-850">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black text-white">${getCartTotal()}</span>
            </div>

            {/* Cash Payment Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Cash Received ($)</label>
                <span className="text-[8px] font-black text-neutral-500 uppercase">Tip: Open calculator & click "Use in register"</span>
              </div>
              <input 
                type="number"
                placeholder="e.g. 500"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#C5A059]/40"
              />
              {parseFloat(amountReceived) >= getCartTotal() && (
                <div className="flex justify-between items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl mt-2">
                  <span>Change to Return:</span>
                  <span className="font-black text-sm">${(parseFloat(amountReceived) - getCartTotal()).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Confirm Submit */}
            <button
              onClick={handleCheckoutSubmit}
              className="w-full py-4 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-97"
            >
              Complete Sale & Print Receipt
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CASH ADJUSTMENT (INFLOW / OUTFLOW) */}
      {showCashAdjModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#C5A059]">
                {adjType === 'INFLOW' ? 'Register Cash Inflow' : 'Register Cash Outflow'}
              </h3>
              <button onClick={() => setShowCashAdjModal(false)} className="text-neutral-500 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Amount ($)</label>
                <input 
                  type="number"
                  value={adjAmount}
                  onChange={e => setAdjAmount(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Reason / Description</label>
                <input 
                  type="text"
                  placeholder="e.g. Register change, local supplier payment"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleCashAdjustment}
              className="w-full py-3.5 bg-[#C5A059] text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90"
            >
              Confirm Transaction
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: TURN RECONCILIATION / CLOSING */}
      {showReconcileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-red-400">Shift Reconciliation & Closing</h3>
              <button onClick={() => setShowReconcileModal(false)} className="text-neutral-500 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-400 font-bold">
              <div className="flex justify-between">
                <span>Starting Cash:</span>
                <span className="text-white">${session.initialCash}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Register Cash:</span>
                <span className="text-white">${session.currentCash}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Actual Physical Cash Counted ($)</label>
              <input 
                type="number"
                placeholder="Count physical bills and coins"
                value={physicalCashInput}
                onChange={e => setPhysicalCashInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-500/40"
              />
            </div>

            <button
              onClick={handleCloseSession}
              className="w-full py-3.5 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-97"
            >
              Complete Shift Reconciliation
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default POSMain;
