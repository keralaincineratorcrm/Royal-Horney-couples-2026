import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  MapPin,
  Truck,
  CheckCircle2,
  Building,
  User,
  AlertTriangle,
} from 'lucide-react';
import { CustomerLead, Order, OrderItem, PaymentMethod } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: (order: Order) => void;
  initialCustomer?: CustomerLead | null;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  const { currentUser } = useAuth();
  const customers = dataStore.getCustomers(currentUser.role, currentUser.id);
  const products = dataStore.getProducts();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomer?.id || '');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || initialCustomer;

  const todayStr = new Date().toISOString().split('T')[0];
  const [orderDate, setOrderDate] = useState<string>(todayStr);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    selectedCustomer?.address || selectedCustomer?.place || ''
  );
  const [installationRequired, setInstallationRequired] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Initial Items
  const defaultProduct = products[0];
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: `item_1`,
      productId: defaultProduct?.id || 'prod_1',
      productName: defaultProduct?.name || 'Kerala Incinerator Standard Unit',
      productModel: defaultProduct?.model || 'KI-STD-10',
      quantity: 1,
      unitPrice: defaultProduct?.defaultPrice || 24000,
      discount: 0,
      discountAmount: 0,
      gstPercent: 18,
      gstAmount: Math.round(((defaultProduct?.defaultPrice || 24000) * 1) * 0.18),
      lineTotal: Math.round((defaultProduct?.defaultPrice || 24000) * 1.18),
      amount: Math.round((defaultProduct?.defaultPrice || 24000) * 1.18),
    },
  ]);

  const [transportationCharges, setTransportationCharges] = useState<number>(1500);

  // Advance Payment
  const [advancePaid, setAdvancePaid] = useState<number>(10000);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [initialPaymentRef, setInitialPaymentRef] = useState<string>('');

  // Auto Calculations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const cgstAmount = Math.round(taxableAmount * 0.09);
  const sgstAmount = Math.round(taxableAmount * 0.09);
  const gstAmount = cgstAmount + sgstAmount;
  const grandTotal = taxableAmount + gstAmount + (transportationCharges || 0);
  const balanceDue = Math.max(0, grandTotal - (advancePaid || 0));

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const unitPrice = prod.defaultPrice;
      const baseTotal = unitPrice * item.quantity;
      const discAmt = Math.round((baseTotal * (item.discount || 0)) / 100);
      const taxable = baseTotal - discAmt;
      const gst = Math.round(taxable * 0.18);

      updated[index] = {
        ...item,
        productId: prod.id,
        productName: prod.name,
        productModel: prod.model,
        unitPrice,
        discountAmount: discAmt,
        gstAmount: gst,
        lineTotal: taxable + gst,
        amount: taxable + gst,
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const baseTotal = item.unitPrice * validQty;
      const discAmt = Math.round((baseTotal * (item.discount || 0)) / 100);
      const taxable = baseTotal - discAmt;
      const gst = Math.round(taxable * 0.18);

      updated[index] = {
        ...item,
        quantity: validQty,
        discountAmount: discAmt,
        gstAmount: gst,
        lineTotal: taxable + gst,
        amount: taxable + gst,
      };
      return updated;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    const validPrice = Math.max(0, price);
    setItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const baseTotal = validPrice * item.quantity;
      const discAmt = Math.round((baseTotal * (item.discount || 0)) / 100);
      const taxable = baseTotal - discAmt;
      const gst = Math.round(taxable * 0.18);

      updated[index] = {
        ...item,
        unitPrice: validPrice,
        discountAmount: discAmt,
        gstAmount: gst,
        lineTotal: taxable + gst,
        amount: taxable + gst,
      };
      return updated;
    });
  };

  const handleAddItem = () => {
    const prod = products[0];
    const unitPrice = prod?.defaultPrice || 24000;
    const gst = Math.round(unitPrice * 0.18);

    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        productId: prod?.id || 'prod_custom',
        productName: prod?.name || 'Incinerator Unit',
        productModel: prod?.model || '',
        quantity: 1,
        unitPrice,
        discount: 0,
        discountAmount: 0,
        gstPercent: 18,
        gstAmount: gst,
        lineTotal: unitPrice + gst,
        amount: unitPrice + gst,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer for this order.');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one product item.');
      return;
    }

    const newOrder = dataStore.addOrder({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.customerName,
      customerPhone: selectedCustomer.phone,
      customerPlace: selectedCustomer.place,
      district: selectedCustomer.district,
      alternativePhone: selectedCustomer.alternativePhone,
      contactPerson: selectedCustomer.contactPerson,
      billingAddress: deliveryAddress || selectedCustomer.address || selectedCustomer.place,
      deliveryAddress: deliveryAddress || selectedCustomer.address || selectedCustomer.place,
      assignedToId: selectedCustomer.assignedToId || currentUser.id,
      assignedToName: selectedCustomer.assignedToName || currentUser.name,
      items,
      subtotal,
      discountAmount: discountTotal,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      gstAmount,
      transportationCharges,
      grandTotal,
      amount: grandTotal,
      advancePaid,
      totalPaid: advancePaid,
      balanceDue,
      orderDate,
      expectedDeliveryDate,
      installationRequired,
      orderStatus: 'Processing',
      deliveryStatus: 'Processing',
      installationStatus: installationRequired ? 'Pending' : 'Not Required',
      notes,
      initialPaymentMethod,
      initialPaymentRef,
    });

    onSuccess(newOrder);
  };

  return (
    <div
      id="create-order-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 text-xs relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Create Confirmed Sales Order
              </h3>
              <p className="text-[11px] text-slate-500">
                Register a new confirmed incinerator booking with 18% GST and delivery terms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Customer Selection & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-bold text-slate-800 mb-1">
                Customer <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust) {
                    setDeliveryAddress(cust.address || cust.place);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} — {c.place} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Booking Date</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                required
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Delivery Site Address */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Delivery Site Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Site address with landmarks (e.g. Near St. George Church, Palarivattom, Ernakulam)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Products & Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Order Items (18% GST Applicable)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-blue-50 text-[#2563EB] hover:bg-blue-100 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Product Model</th>
                    <th className="py-2 px-2 text-center w-20">Qty</th>
                    <th className="py-2 px-3 text-right w-28">Unit Price (₹)</th>
                    <th className="py-2 px-3 text-right w-28">GST (18%)</th>
                    <th className="py-2 px-3 text-right w-32">Total (₹)</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.model})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-16 p-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-24 p-1.5 rounded-lg border border-slate-300 text-right font-medium text-xs"
                        />
                      </td>
                      <td className="p-2.5 text-right text-slate-600 font-medium">
                        ₹{(item.gstAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-slate-900">
                        ₹{(item.lineTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary & Advance Collection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {/* Advance Booking Payment Info */}
            <div className="space-y-3">
              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Advance Payment Received</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Booking Advance (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  placeholder="Advance amount collected"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-extrabold text-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {advancePaid > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={initialPaymentMethod}
                      onChange={(e) => setInitialPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-800"
                    >
                      <option value="UPI">UPI / GPay</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Ref / UTR No.
                    </label>
                    <input
                      type="text"
                      value={initialPaymentRef}
                      onChange={(e) => setInitialPaymentRef(e.target.value)}
                      placeholder="Transaction ID"
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={installationRequired}
                    onChange={(e) => setInstallationRequired(e.target.checked)}
                    className="rounded text-[#2563EB] focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-bold text-slate-700 text-xs">
                    Installation & Commissioning Required on Site
                  </span>
                </label>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 py-1">
                <span>Subtotal (Excl. Tax):</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600 py-1">
                <span>CGST (9%) + SGST (9%):</span>
                <span>₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 py-1">
                <span>Transportation & Loading:</span>
                <div className="flex items-center gap-1">
                  <span>₹</span>
                  <input
                    type="number"
                    min={0}
                    value={transportationCharges}
                    onChange={(e) => setTransportationCharges(Number(e.target.value))}
                    className="w-20 p-1 rounded-md border border-slate-300 text-right text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-between py-2 border-t border-slate-300 font-black text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold py-1">
                <span>Advance Paid Now:</span>
                <span>₹{(advancePaid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 text-rose-600 font-extrabold text-sm">
                <span>Balance Due at Delivery:</span>
                <span>₹{balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Dispatch & Installation Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ensure 15-ft standard chimney included; customer site has concrete slab ready."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Place Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

