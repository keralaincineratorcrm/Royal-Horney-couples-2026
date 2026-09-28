import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FileText, ShoppingCart, ArrowRight, MapPin, Phone } from 'lucide-react';
import { CustomerLead, Quotation, Order } from '../../types';
import { dataStore } from '../../lib/supabase';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerLead) => void;
  onSelectQuotation: (qtn: Quotation) => void;
  onSelectOrder: (order: Order) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSelectQuotation,
  onSelectOrder,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customers = dataStore.getCustomers();
  const quotations = dataStore.getQuotations();
  const orders = dataStore.getOrders();

  const cleanQ = query.trim().toLowerCase();

  const matchingCustomers = cleanQ
    ? customers.filter(
        (c) =>
          c.customerName.toLowerCase().includes(cleanQ) ||
          c.phone.includes(cleanQ) ||
          c.place.toLowerCase().includes(cleanQ) ||
          c.productInterestedName.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchingQuotations = cleanQ
    ? quotations.filter(
        (q) =>
          q.quotationNumber.toLowerCase().includes(cleanQ) ||
          q.customerName.toLowerCase().includes(cleanQ)
      )
    : [];

  const matchingOrders = cleanQ
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(cleanQ) ||
          o.customerName.toLowerCase().includes(cleanQ) ||
          o.customerPhone.includes(cleanQ)
      )
    : [];

  const totalResults =
    matchingCustomers.length + matchingQuotations.length + matchingOrders.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#2563EB]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer name, phone, place, quotation #, order #..."
            className="flex-1 text-sm md:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-mono px-2 py-1 bg-slate-100 text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!cleanQ ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <p>Type to search customers, places in Kerala, products, or document numbers.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {['Aimury', 'Kothamangalam', 'Perumbavoor', '10kg MS Burner', 'Munnar'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching customers, quotations, or orders found for "{query}".
            </div>
          ) : (
            <>
              {/* Customers Section */}
              {matchingCustomers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Customers & Leads ({matchingCustomers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCustomer(c);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 truncate">
                              {c.customerName}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                              {c.leadStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.place}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {c.phone}
                            </span>
                            <span className="text-[#2563EB] font-medium truncate">
                              {c.productInterestedName}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotations Section */}
              {matchingQuotations.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Quotations ({matchingQuotations.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingQuotations.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          onSelectQuotation(q);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {q.quotationNumber} — {q.customerName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Total: ₹{q.totalAmount.toLocaleString('en-IN')} • Status: {q.status}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Section */}
              {matchingOrders.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Orders ({matchingOrders.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingOrders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          onSelectOrder(o);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-blue-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-blue-100 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {o.orderNumber} — {o.customerName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Amount: ₹{o.amount.toLocaleString('en-IN')} • Delivery:{' '}
                            {o.deliveryStatus} • Payment: {o.paymentStatus}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

