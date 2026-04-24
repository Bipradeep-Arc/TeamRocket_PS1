import { useEffect, useState } from 'react';
import { useInvoiceStore } from './store/useInvoiceStore';
import { Download, Share2, Plus, Trash2, CheckCircle2, GripVertical, Percent, Eye, ArrowLeft, Globe, Search, ChevronDown, ImagePlus, Save, Printer, Lock, KeyRound, AlertCircle, FileUp, FileDown } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import pako from 'pako';
import CryptoJS from 'crypto-js';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" }
];

const formatMoney = (amount, currencyCode) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
  }).format(amount);
};

const CurrencySelector = ({ currentCurrency, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activeCurrency = CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];
  
  const filteredCurrencies = CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <button 
        onClick={() => { setIsOpen(true); setSearchTerm(""); }}
        className="w-full flex items-center justify-between rounded-xl border border-white/50 bg-white/60 p-3 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-white outline-none transition-all shadow-inner text-slate-800 font-bold"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Globe size={16} className="text-slate-500 shrink-0" />
          <span className="whitespace-nowrap truncate">{activeCurrency.code} ({activeCurrency.symbol})</span>
        </div>
        <ChevronDown size={16} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 backdrop-blur-xl border border-white/50 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-slate-100 bg-white/50 relative">
              <Search size={14} className="absolute left-4 top-4 text-slate-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search currency..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all text-slate-800"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-hide">
              {filteredCurrencies.length === 0 ? (
                <div className="p-3 text-xs text-center text-slate-400">No currencies found</div>
              ) : (
                filteredCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => {
                      onChange(currency.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${currentCurrency === currency.code ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="w-6 text-center font-mono font-medium text-slate-400 shrink-0">{currency.symbol}</span>
                      <span className="whitespace-nowrap text-slate-800">{currency.code}</span>
                    </div>
                    <span className="text-xs text-slate-400 truncate ml-2 text-right">{currency.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const SVGTaxEngine = ({ subtotal, taxRate, discountRate, themeColor, currency }) => {
  const [anim, setAnim] = useState({ sub: 0, tax: 0, disc: 0, total: 0 });

  useEffect(() => {
    const safeTax = Number(taxRate) || 0;
    const safeDisc = Number(discountRate) || 0;
    const targetTax = subtotal * (safeTax / 100);
    const targetDisc = subtotal * (safeDisc / 100);
    const targetTotal = subtotal + targetTax - targetDisc;

    let frameId;
    const startTime = performance.now();
    const duration = 600; 
    const startVals = { ...anim };

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnim({
        sub: startVals.sub + (subtotal - startVals.sub) * ease,
        tax: startVals.tax + (targetTax - startVals.tax) * ease,
        disc: startVals.disc + (targetDisc - startVals.disc) * ease,
        total: startVals.total + (targetTotal - startVals.total) * ease,
      });
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [subtotal, taxRate, discountRate]);

  const maxTotal = anim.sub + anim.tax;
  const subPct = maxTotal === 0 ? 0 : (anim.sub / maxTotal) * 100;
  const taxPct = maxTotal === 0 ? 0 : (anim.tax / maxTotal) * 100;

  return (
    <div className="w-72 space-y-4">
       <svg width="100%" height="8" className="rounded-full bg-slate-100 overflow-hidden shadow-inner">
          <rect x="0" y="0" height="100%" width={`${subPct}%`} fill="#cbd5e1" className="transition-all duration-75" />
          <rect x={`${subPct}%`} y="0" height="100%" width={`${taxPct}%`} fill={themeColor} className="transition-all duration-75" />
       </svg>
       
       <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
             <span>Subtotal</span>
             <span className="font-mono">{formatMoney(anim.sub, currency)}</span>
          </div>
          {Number(taxRate) > 0 && (
            <div className="flex justify-between text-slate-500">
               <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }}/>
                  Tax ({taxRate}%)
               </span>
               <span className="font-mono">+{formatMoney(anim.tax, currency)}</span>
            </div>
          )}
          {Number(discountRate) > 0 && (
            <div className="flex justify-between text-emerald-500">
               <span>Discount ({discountRate}%)</span>
               <span className="font-mono">-{formatMoney(anim.disc, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-900 font-bold text-xl pt-3 border-t border-slate-100 mt-2">
             <span>Total Due</span>
             <span className="font-mono">{formatMoney(anim.total, currency)}</span>
          </div>
       </div>
    </div>
  );
};

function SortableLineItem({ item, updateItem, removeItem, currency }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-4 items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/60 shadow-sm relative group transition-all hover:bg-white/80">
      <div {...attributes} {...listeners} className="text-slate-400 hover:text-slate-900 cursor-grab active:cursor-grabbing touch-none opacity-50 group-hover:opacity-100 transition-opacity">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 relative">
         <input type="text" placeholder="Service Description" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} className="md:col-span-7 w-full text-sm p-3 rounded-lg border border-slate-200/50 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all shadow-inner text-slate-800" />
         <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} className="md:col-span-2 w-full text-sm p-3 rounded-lg border border-slate-200/50 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all shadow-inner text-slate-800" />
         <div className="md:col-span-3 relative">
           <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">{currency}</span>
           <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} className="w-full text-sm p-3 pr-10 rounded-lg border border-slate-200/50 bg-white/70 outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition-all shadow-inner text-slate-800" />
         </div>
      </div>
      <button onClick={() => removeItem(item.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function App() {
  const data = useInvoiceStore((state) => state.data);
  const updateField = useInvoiceStore((state) => state.updateField);
  const updateItem = useInvoiceStore((state) => state.updateItem);
  const addItem = useInvoiceStore((state) => state.addItem);
  const removeItem = useInvoiceStore((state) => state.removeItem);
  const hydrateData = useInvoiceStore((state) => state.hydrateData);
  const reorderItems = useInvoiceStore((state) => state.reorderItems);

  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isLocked, setIsLocked] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [encryptedPayload, setEncryptedPayload] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");

  const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && Array.isArray(importedData.items)) {
          hydrateData(importedData);
          document.documentElement.style.setProperty('--theme-color', importedData.themeColor || '#0f172a');
        } else {
          alert("Invalid InvoiceForge JSON file.");
        }
      } catch (err) {
        alert("Error parsing the JSON file. Ensure the file is not corrupted.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    const safeFileName = data.companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'template';
    link.download = `invoiceforge_${safeFileName}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadFromBase64 = (base64Str) => {
    try {
      const decompressed = pako.inflate(new Uint8Array(atob(base64Str).split('').map(c => c.charCodeAt(0))), { to: 'string' });
      const parsedData = JSON.parse(decompressed);
      
      if (parsedData._expiresAt && Date.now() > parsedData._expiresAt) {
         setIsExpired(true);
         setIsLocked(false);
         window.history.replaceState(null, '', window.location.pathname);
         return false;
      }

      hydrateData(parsedData);
      document.documentElement.style.setProperty('--theme-color', parsedData.themeColor);
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (err) { 
      console.error("Invalid URL data", err);
      return false;
    }
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      if (hash.startsWith('locked_')) {
        setIsLocked(true);
        setEncryptedPayload(hash.replace('locked_', ''));
      } else {
        loadFromBase64(hash);
      }
    } else {
      document.documentElement.style.setProperty('--theme-color', data.themeColor);
    }
  }, [hydrateData, data.themeColor]);

  const handleUnlock = (e) => {
    e.preventDefault();
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPayload, unlockPassword);
      const decryptedBase64 = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedBase64) throw new Error("Decryption failed");
      
      const success = loadFromBase64(decryptedBase64);
      if (success) {
        setIsLocked(false);
      } else if (!isExpired) {
        throw new Error("Corrupted Data");
      }
    } catch (error) {
      setUnlockError("Incorrect secret code. Access denied.");
    }
  };

  const generateShareLink = () => {
    const secretCode = window.prompt("To encrypt this invoice, enter a secret password.\n\nLeave blank for a public link.\n\n(Note: All links self-destruct after 24 hours).");
    
    const payloadWithTimer = {
      ...data,
      _expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    const compressed = pako.deflate(JSON.stringify(payloadWithTimer));
    const base64Data = btoa(Array.from(compressed).map(c => String.fromCharCode(c)).join(''));

    if (secretCode) {
      const encrypted = CryptoJS.AES.encrypt(base64Data, secretCode).toString();
      window.location.hash = `locked_${encrypted}`;
    } else {
      window.location.hash = base64Data;
    }

    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      pdf.save(`Invoice-${data.companyName.replace(/\s+/g, '-')}.pdf`);
    } catch (error) { console.error("Failed to generate PDF:", error); }
  };

  const handlePrint = () => {
    window.print();
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (e) => { if (e.active.id !== e.over?.id) reorderItems(e.active.id, e.over.id); };


  // =========================================
  // VIEW: THE EXPIRED SCREEN
  // =========================================
  if (isExpired) {
    return (
      <div className="flex h-screen w-full items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
        
        {/* Vibrant Colorful Background Mesh */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-[120px] opacity-40" />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-fuchsia-400 to-pink-500 blur-[120px] opacity-30" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-400 to-purple-500 blur-[120px] opacity-40" />
        </div>

        <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[24px] shadow-2xl p-10 text-center relative z-10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-200">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Link Expired</h2>
          <p className="text-sm text-slate-600 mb-8">For security, InvoiceForge links automatically self-destruct after 24 hours. Please request a new link from the sender.</p>
          <button 
            onClick={() => setIsExpired(false)} 
            className="w-full p-3 text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all font-bold text-sm"
          >
            Create New Invoice
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // VIEW: THE DECRYPTION VAULT
  // =========================================
  if (isLocked) {
    return (
      <div className="flex h-screen w-full items-center justify-center relative overflow-hidden bg-slate-50 font-sans">
        
        {/* Vibrant Colorful Background Mesh */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-[120px] opacity-40" />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-fuchsia-400 to-pink-500 blur-[120px] opacity-30" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-400 to-purple-500 blur-[120px] opacity-40" />
        </div>

        <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl border border-white/60 rounded-[24px] shadow-2xl p-10 text-center relative z-10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/60">
            <Lock size={32} className="text-slate-800" />
          </div>
          <h2 className="text-2xl font-light tracking-tight text-slate-900 mb-2">Confidential Invoice</h2>
          <p className="text-sm text-slate-600 mb-8">This document is protected with AES-256 encryption. Enter the secret code to view.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input 
                type="password" 
                placeholder="Secret Code" 
                autoFocus
                value={unlockPassword}
                onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(""); }}
                className="w-full rounded-xl border border-white/60 bg-white/80 p-3 pl-12 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-white outline-none transition-all shadow-inner text-slate-800 font-medium placeholder-slate-400" 
              />
            </div>
            {unlockError && <p className="text-xs font-bold text-red-500">{unlockError}</p>}
            <button type="submit" className="w-full p-3 text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg transition-all font-bold text-sm">
              Decrypt & View
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================
  // VIEW: THE MAIN APP
  // =========================================
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      `}</style>

      <div className="flex h-screen w-full p-4 md:p-8 font-sans antialiased items-center justify-center relative overflow-hidden bg-slate-50 print:p-0 print:bg-white print:h-auto">
        
        {/* Vibrant Colorful Background Mesh (Hidden on Print) */}
        <div className="absolute inset-0 z-0 overflow-hidden print:hidden pointer-events-none">
          <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 blur-[120px] opacity-40" />
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-fuchsia-400 to-pink-500 blur-[120px] opacity-30" />
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-400 to-purple-500 blur-[120px] opacity-40" />
        </div>

        <div className="flex w-full h-full max-w-6xl bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[20px] shadow-2xl overflow-hidden ring-1 ring-black/5 relative z-10 print:border-none print:shadow-none print:backdrop-blur-none print:bg-transparent print:ring-0">
          
          {!showPreview && (
            <div className="w-full h-full flex flex-col z-10 animate-in fade-in duration-300 print:hidden">
              
              <div className="h-16 px-6 border-b border-white/50 flex items-center justify-between bg-white/50 backdrop-blur-md">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] shadow-inner"></div>
                  </div>
                  <h2 className="text-sm font-bold tracking-tight text-slate-800 hidden md:block drop-shadow-sm">InvoiceForge Workspace</h2>
                  
                  <div className="flex items-center ml-2 md:ml-4 gap-2 bg-white/60 px-3 py-1 rounded-full border border-white/50 shadow-sm backdrop-blur-sm">
                    <Save size={12} className="text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Auto-Saved</span>
                  </div>
                </div>
                
                <div className="flex gap-2 md:gap-3 items-center">
                   
                   <div className="flex bg-white/60 rounded-lg p-1 border border-white/50 backdrop-blur-sm mr-2 shadow-sm">
                     <input type="file" id="json-upload" accept=".json" className="hidden" onChange={handleImportJSON} />
                     <label htmlFor="json-upload" className="cursor-pointer p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-md transition-all" title="Import JSON Data">
                       <FileUp size={16} />
                     </label>
                     <div className="w-px bg-slate-300 mx-1"></div>
                     <button onClick={handleExportJSON} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-md transition-all" title="Export JSON Template">
                       <FileDown size={16} />
                     </button>
                   </div>

                   <button onClick={generateShareLink} className="p-2 text-white bg-blue-500 hover:bg-blue-600 border border-blue-600/50 rounded-lg shadow-sm transition-all flex items-center gap-2 w-10 md:w-36 justify-center">
                     {copied ? <CheckCircle2 size={16} className="text-white" /> : <><Lock size={14} /> <span className="text-xs font-bold hidden md:inline">Secure Share</span></>}
                   </button>
                   <button onClick={() => setShowPreview(true)} className="p-2 text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/50 rounded-lg shadow-sm transition-all flex items-center gap-2 px-5 backdrop-blur-md">
                     <Eye size={16} /> <span className="text-xs font-bold pr-1 hidden md:inline">Preview & Export</span>
                   </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 scrollbar-hide flex flex-col items-center">
                <div className="w-full max-w-3xl space-y-10 pb-20">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest drop-shadow-sm">Brand Identity</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          <input type="text" value={data.companyName} onChange={(e) => updateField('companyName', e.target.value)} className="flex-1 w-full rounded-xl border border-white/50 bg-white/70 p-3 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-white outline-none transition-all shadow-inner placeholder-slate-400 text-slate-800 font-medium" placeholder="Your Company Name" />
                          <div className="flex items-center gap-3 bg-white/70 p-2.5 rounded-xl border border-white/50 shadow-inner shrink-0">
                              <input type="color" value={data.themeColor} onChange={(e) => { updateField('themeColor', e.target.value); document.documentElement.style.setProperty('--theme-color', e.target.value); }} className="h-8 w-12 cursor-pointer rounded border border-white/50 p-0 bg-transparent" />
                              <span className="text-sm font-mono text-slate-700 uppercase font-bold tracking-wider">{data.themeColor}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                           <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                           <label htmlFor="logo-upload" className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white border border-white/50 rounded-xl shadow-sm transition-all text-sm font-bold text-slate-700">
                              <ImagePlus size={18} className="text-blue-500" /> Upload Company Logo
                           </label>
                           {data.logo && (
                             <button onClick={() => updateField('logo', '')} className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-md hover:bg-red-50 transition-colors">Remove Logo</button>
                           )}
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest drop-shadow-sm">Global Financials</h3>
                      <div className="flex gap-3 items-end">
                        <div className="w-44 shrink-0 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 drop-shadow-sm">Base Currency</label>
                          <CurrencySelector currentCurrency={data.currency || 'USD'} onChange={(code) => updateField('currency', code)} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 drop-shadow-sm">Tax Rate</label>
                          <div className="relative">
                            <Percent size={14} className="absolute left-3 top-3.5 text-slate-400" />
                            <input type="number" placeholder="0" value={data.taxRate !== undefined ? data.taxRate : 8} onChange={(e) => updateField('taxRate', e.target.value)} className="w-full rounded-xl border border-white/50 bg-white/70 p-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-white outline-none transition-all shadow-inner text-slate-800 font-medium" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 drop-shadow-sm">Discount</label>
                          <div className="relative">
                            <Percent size={14} className="absolute left-3 top-3.5 text-slate-400" />
                            <input type="number" placeholder="0" value={data.discountRate !== undefined ? data.discountRate : 0} onChange={(e) => updateField('discountRate', e.target.value)} className="w-full rounded-xl border border-white/50 bg-white/70 p-3 pl-9 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-white outline-none transition-all shadow-inner text-slate-800 font-medium" />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <hr className="border-slate-300/50" />

                  <section className="space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest drop-shadow-sm">Invoice Items</h3>
                        <button onClick={addItem} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 transition-colors bg-white/70 hover:bg-white shadow-sm border border-white/60 px-4 py-2 rounded-lg backdrop-blur-md">
                          <Plus size={16}/> Add Service
                        </button>
                     </div>
                     
                     <div className="space-y-4">
                       <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                         <SortableContext items={data.items} strategy={verticalListSortingStrategy}>
                            {data.items.map((item) => (
                               <SortableLineItem key={item.id} item={item} updateItem={updateItem} removeItem={removeItem} currency={data.currency} />
                            ))}
                         </SortableContext>
                       </DndContext>
                     </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* VIEW 2: THE FULL SCREEN PREVIEW           */}
          {/* ========================================= */}
          {showPreview && (
            <div className="w-full h-full overflow-y-auto bg-slate-900/5 flex flex-col items-center relative shadow-inner animate-in zoom-in-95 duration-300 print:bg-transparent print:overflow-visible">
              
              <div className="sticky top-6 z-50 flex gap-4 mb-8 bg-white/60 backdrop-blur-xl border border-white/50 p-2 rounded-2xl shadow-xl print:hidden">
                 <button onClick={() => setShowPreview(false)} className="p-2.5 text-slate-700 bg-white/80 hover:bg-white border border-slate-200/50 rounded-xl shadow-sm transition-all flex items-center gap-2 px-5">
                   <ArrowLeft size={18} /> <span className="text-sm font-bold">Back to Editor</span>
                 </button>
                 
                 <button onClick={handlePrint} className="p-2.5 text-slate-700 bg-white/80 hover:bg-white border border-slate-200/50 rounded-xl shadow-sm transition-all flex items-center gap-2 px-6">
                   <Printer size={18} /> <span className="text-sm font-bold">Print</span>
                 </button>
                 
                 <button onClick={handleDownload} className="p-2.5 text-white bg-blue-500 hover:bg-blue-600 border border-blue-600/50 rounded-xl shadow-md transition-all flex items-center gap-2 px-6">
                   <Download size={18} /> <span className="text-sm font-bold pr-1">Download PDF</span>
                 </button>
              </div>

              <div className="pb-12 px-4 w-full flex justify-center print:p-0">
                
                <div id="invoice-preview" className="bg-white shadow-[0_30px_60px_rgba(0,0,0,0.15)] w-[210mm] min-h-[297mm] ring-1 ring-slate-900/5 relative overflow-hidden flex flex-col rounded-sm print:shadow-none print:ring-0 print:w-full">
                   <div className="h-4 w-full transition-colors duration-200 flex-shrink-0" style={{ backgroundColor: `var(--theme-color, ${data.themeColor})` }} />
                   
                   <div className="p-12 flex-1 flex flex-col">
                      <div className="flex justify-between items-end mb-16">
                          <div>
                              {data.logo && <img src={data.logo} alt="Company Logo" className="max-h-16 object-contain mb-4" />}
                              <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-2">INVOICE</h1>
                              <p className="text-sm font-mono text-slate-400">#INV-{new Date().getFullYear()}-001</p>
                          </div>
                          <div className="text-right">
                              <h3 className="text-xl font-bold transition-colors duration-200" style={{ color: `var(--theme-color, ${data.themeColor})` }}>
                                {data.companyName || 'Your Company'}
                              </h3>
                          </div>
                      </div>

                      <table className="w-full text-left border-collapse mb-8">
                        <thead>
                          <tr className="border-b-2 transition-colors duration-200" style={{ borderBottomColor: `var(--theme-color, ${data.themeColor})` }}>
                            <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-1/2">Description</th>
                            <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Qty</th>
                            <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Rate</th>
                            <th className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-4 text-sm text-slate-800">{item.description}</td>
                              <td className="py-4 text-sm text-slate-500 text-right font-mono">{item.qty}</td>
                              <td className="py-4 text-sm text-slate-500 text-right font-mono">{formatMoney(item.rate, data.currency)}</td>
                              <td className="py-4 text-sm font-semibold text-slate-900 text-right font-mono">
                                {formatMoney(item.qty * item.rate, data.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-auto pt-8 border-t-2 flex justify-end transition-colors duration-200" style={{ borderTopColor: `var(--theme-color, ${data.themeColor})` }}>
                          <SVGTaxEngine 
                            subtotal={subtotal} 
                            taxRate={data.taxRate !== undefined ? data.taxRate : 8} 
                            discountRate={data.discountRate !== undefined ? data.discountRate : 0} 
                            themeColor={data.themeColor} 
                            currency={data.currency}
                          />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}