import React, { useState, useEffect } from 'react';

const Calculator = ({ onUseValue, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState([]);
  const [isReset, setIsReset] = useState(false);

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key } = e;
      if (/[0-9.]/.test(key)) {
        handleNumber(key);
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleOperator(key === '*' ? '×' : key === '/' ? '÷' : key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape') {
        handleClear();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, isReset]);

  const handleNumber = (num) => {
    if (display === '0' || isReset) {
      setDisplay(num);
      setIsReset(false);
    } else {
      if (num === '.' && display.includes('.')) return;
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setEquation(`${display} ${op} `);
    setIsReset(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsReset(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    if (!equation) return;
    
    const fullExpr = equation + display;
    const evalExpr = fullExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/');

    try {
      const result = new Function(`return ${evalExpr}`)();
      const formattedResult = Number(result.toFixed(4)).toString();
      
      setHistory(prev => [`${fullExpr} = ${formattedResult}`, ...prev.slice(0, 4)]);
      setDisplay(formattedResult);
      setEquation('');
      setIsReset(true);
    } catch (err) {
      setDisplay('Error');
      setEquation('');
      setIsReset(true);
    }
  };

  const handlePercentage = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch (err) {}
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl w-full max-w-[320px] select-none text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 drag-handle cursor-grab active:cursor-grabbing py-1 select-none">
        <div className="flex items-center gap-2 pointer-events-none">
          <i className="fa-solid fa-calculator text-[#C5A059] text-xs"></i>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Calculator</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        )}
      </div>

      {/* Screen */}
      <div className="bg-neutral-950 rounded-2xl p-4 mb-4 text-right overflow-hidden border border-neutral-850">
        <div className="text-[10px] text-neutral-500 font-bold min-h-4 tracking-wide truncate">
          {equation}
        </div>
        <div className="text-2xl font-black text-white truncate tracking-tight select-all">
          {display}
        </div>
      </div>

      {/* Mini History */}
      {history.length > 0 && (
        <div className="mb-3 px-2 text-[9px] text-neutral-500 space-y-0.5 border-b border-neutral-850 pb-2">
          {history.slice(0, 2).map((item, idx) => (
            <div key={idx} className="truncate">{item}</div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button onClick={handleClear} className="h-12 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 font-black text-xs transition-colors">C</button>
        <button onClick={handleBackspace} className="h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors">
          <i className="fa-solid fa-backspace"></i>
        </button>
        <button onClick={handlePercentage} className="h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors">%</button>
        <button onClick={() => handleOperator('÷')} className="h-12 rounded-xl bg-neutral-800 hover:bg-[#C5A059] hover:text-black font-black text-xs transition-colors">÷</button>

        <button onClick={() => handleNumber('7')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">7</button>
        <button onClick={() => handleNumber('8')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">8</button>
        <button onClick={() => handleNumber('9')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">9</button>
        <button onClick={() => handleOperator('×')} className="h-12 rounded-xl bg-neutral-800 hover:bg-[#C5A059] hover:text-black font-black text-xs transition-colors">×</button>

        <button onClick={() => handleNumber('4')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">4</button>
        <button onClick={() => handleNumber('5')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">5</button>
        <button onClick={() => handleNumber('6')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">6</button>
        <button onClick={() => handleOperator('-')} className="h-12 rounded-xl bg-neutral-800 hover:bg-[#C5A059] hover:text-black font-black text-xs transition-colors">-</button>

        <button onClick={() => handleNumber('1')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">1</button>
        <button onClick={() => handleNumber('2')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">2</button>
        <button onClick={() => handleNumber('3')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">3</button>
        <button onClick={() => handleOperator('+')} className="h-12 rounded-xl bg-neutral-800 hover:bg-[#C5A059] hover:text-black font-black text-xs transition-colors">+</button>

        <button onClick={() => handleNumber('0')} className="col-span-2 h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">0</button>
        <button onClick={() => handleNumber('.')} className="h-12 rounded-xl bg-neutral-850 hover:bg-neutral-800 font-bold text-xs transition-colors">.</button>
        <button onClick={handleCalculate} className="h-12 rounded-xl bg-[#C5A059] text-black font-black text-xs transition-colors">=</button>
      </div>

      {/* Integration Button */}
      {onUseValue && (
        <button
          onClick={() => onUseValue(parseFloat(display) || 0)}
          className="w-full py-2.5 bg-neutral-800 hover:bg-[#C5A059]/20 hover:text-[#C5A059] border border-neutral-700 hover:border-[#C5A059]/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
        >
          <i className="fa-solid fa-arrow-down-long mr-2"></i>Use in register
        </button>
      )}
    </div>
  );
};

export default Calculator;
