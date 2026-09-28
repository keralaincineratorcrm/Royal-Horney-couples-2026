import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  Eye,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Quotation, QuotationItem, CustomerLead, Product, UserProfile } from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { QuotationPreviewModal } from './QuotationPreviewModal';

interface CreateQuotationModalProps {
  onClose: () => void;
  onSuccess: (quotation: Quotation) => void;
  initialCustomer?: CustomerLead | null;
  editQuotation?: Quotation | null;
}

const DRAFT_STORAGE_KEY = 'kerala_incinerator_qtn_form_draft';

export const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
  onClose,
  onSuccess,
  initialCustomer,
  editQuotation,
}) => {
  const { currentUser, isOwner, isSenior, users } = useAuth();

  const customers = dataStore.getCustomers(currentUser.role, currentUser.id);
  const products = dataStore.getProducts();

  // Mode: existing vs new customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>(
    initialCustomer ? 'existing' : 'existing'
  );
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomer?.id || editQuotation?.customerId || ''
  );

  // New Customer Fields (if creating inline)
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAltPhone, setNewCustAltPhone] = useState('');
  const [newCustPlace, setNewCustPlace] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCareOf, setNewCustCareOf] = useState('');

  // Executive Assignment (Owner / Senior can reassign)
  const [assignedToId, setAssignedToId] = useState<string>(
    editQuotation?.assignedToId || currentUser.id
  );

  // Quotation Meta
  const [quotationNumber, setQuotationNumber] = useState<string>(
    editQuotation?.quotationNumber || dataStore.generateNextQuotationNumber()
  );
  const [quotationDate, setQuotationDate] = useState<string>(
    editQuotation?.quotationDate || new Date().toISOString().split('T')[0]
  );
  const [validityDays, setValidityDays] = useState<number>(editQuotation?.validityDays || 15);

  // Items Table
  const defaultItem: QuotationItem = {
    productId: products[0]?.id || 'p1',
    productName: products[0]?.name || 'EcoSmokeless 100',
    description: products[0]?.description || 'Smokeless Waste Disposal Incinerator',
    capacity: products[0]?.capacity || '10 kg/batch',
    quantity: 1,
    unitPrice: products[0]?.defaultPrice || 32000,
    discount: 0,
    taxRate: 18,
    totalAmount: Math.round((products[0]?.defaultPrice || 32000) * 1.18),
  };

  const [items, setItems] = useState<QuotationItem[]>(
    editQuotation?.items && editQuotation.items.length > 0
      ? editQuotation.items
      : [defaultItem]
  );

  // Financials & Charges
  const [transportationCharges, setTransportationCharges] = useState<number>(
    editQuotation?.transportationCharges ?? 1500
  );

  // Terms & Notes
  const [paymentTerms, setPaymentTerms] = useState<string>(
    editQuotation?.paymentTerms ||
      '50% advance along with confirmed order, balance prior to delivery / on installation.'
  );
  const [deliveryTerms, setDeliveryTerms] = useState<string>(
    editQuotation?.deliveryTerms ||
      'Within 5-7 working days from date of confirmed order across Kerala.'
  );
  const [installationTerms, setInstallationTerms] = useState<string>(
    editQuotation?.installationTerms ||
      'Standard installation, test run and chimney set included by company technician.'
  );
  const [warranty, setWarranty] = useState<string>(
    editQuotation?.warranty ||
      '12 months comprehensive warranty on fabrication and burner assembly.'
  );
  const [remarks, setRemarks] = useState<string>(editQuotation?.remarks || '');

  // UI status
  const [formError, setFormError] = useState<string | null>(null);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewQuotationData, setPreviewQuotationData] = useState<Quotation | null>(null);

  // Auto-save draft to localStorage (only when not in edit mode)
  useEffect(() => {
    if (editQuotation) return;

    const timer = setTimeout(() => {
      const draftData = {
        selectedCustomerId,
        customerMode,
        newCustName,
        newCustPhone,
        newCustAltPhone,
        newCustPlace,
        newCustAddress,
        newCustCareOf,
        assignedToId,
        quotationDate,
        validityDays,
        items,
        transportationCharges,
        paymentTerms,
        deliveryTerms,
        installationTerms,
        warranty,
        remarks,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
        setDraftSavedTime(draftData.timestamp);
      } catch (err) {
        console.error('Failed to auto-save quotation draft', err);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    selectedCustomerId,
    customerMode,
    newCustName,
    newCustPhone,
    newCustAltPhone,
    newCustPlace,
    newCustAddress,
    newCustCareOf,
    assignedToId,
    quotationDate,
    validityDays,
    items,
    transportationCharges,
    paymentTerms,
    deliveryTerms,
    installationTerms,
    warranty,
    remarks,
    editQuotation,
  ]);

  // Load draft on initial mount if available and not editing or initial customer passed
  useEffect(() => {
    if (editQuotation || initialCustomer) return;

    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setSelectedCustomerId(parsed.selectedCustomerId || '');
          setCustomerMode(parsed.customerMode || 'existing');
          setNewCustName(parsed.newCustName || '');
          setNewCustPhone(parsed.newCustPhone || '');
          setNewCustAltPhone(parsed.newCustAltPhone || '');
          setNewCustPlace(parsed.newCustPlace || '');
          setNewCustAddress(parsed.newCustAddress || '');
          setNewCustCareOf(parsed.newCustCareOf || '');
          setAssignedToId(parsed.assignedToId || currentUser.id);
          setValidityDays(parsed.validityDays || 15);
          setItems(parsed.items);
          setTransportationCharges(parsed.transportationCharges ?? 1500);
          setPaymentTerms(parsed.paymentTerms || paymentTerms);
          setDeliveryTerms(parsed.deliveryTerms || deliveryTerms);
          setInstallationTerms(parsed.installationTerms || installationTerms);
          setWarranty(parsed.warranty || warranty);
          setRemarks(parsed.remarks || '');
          setDraftSavedTime(parsed.timestamp || null);
        }
      }
    } catch (e) {
      console.warn('Error reading saved quotation draft', e);
    }
  }, []);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftSavedTime(null);
    setItems([defaultItem]);
    setRemarks('');
  };

  // Calculations
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
    0
  );
  const discountTotal = items.reduce((sum, it) => sum + (Number(it.discount) || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxTotal = Math.round(taxableAmount * 0.18); // standard 18% GST for incinerator equipment
  const grandTotal = taxableAmount + taxTotal + (Number(transportationCharges) || 0);

  // Item handlers
  const handleAddItem = () => {
    const defaultProd = products[0];
    const newItem: QuotationItem = {
      productId: defaultProd?.id || `p_${Date.now()}`,
      productName: defaultProd?.name || 'Incinerator Unit',
      description: defaultProd?.description || 'Commercial Smokeless Waste Incinerator',
      capacity: defaultProd?.capacity || 'Standard',
      quantity: 1,
      unitPrice: defaultProd?.defaultPrice || 25000,
      discount: 0,
      taxRate: 18,
      totalAmount: Math.round((defaultProd?.defaultPrice || 25000) * 1.18),
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Quotation must contain at least one item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        current.productId = prod.id;
        current.productName = prod.name;
        current.description = prod.description || current.description;
        current.capacity = prod.capacity || current.capacity;
        current.unitPrice = prod.defaultPrice;
      }
    } else {
      (current as any)[field] = value;
    }

    // Recalculate item line total
    const qty = Number(current.quantity) || 1;
    const rate = Number(current.unitPrice) || 0;
    const disc = Number(current.discount) || 0;
    const taxR = Number(current.taxRate) || 18;
    const taxable = Math.max(0, rate * qty - disc);
    current.totalAmount = Math.round(taxable * (1 + taxR / 100));

    updated[index] = current;
    setItems(updated);
  };

  // Filtered customer list for search
  const filteredCustomers = customers.filter((c) => {
    if (!customerSearchQuery.trim()) return true;
    const q = customerSearchQuery.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.place.toLowerCase().includes(q)
    );
  });

  const selectedCustomerObj =
    customers.find((c) => c.id === selectedCustomerId) || initialCustomer || null;

  // Selected Executive Name
  const assignedExec = users.find((u) => u.id === assignedToId) || currentUser;

  // Validate form
  const validateForm = (): boolean => {
    setFormError(null);

    if (customerMode === 'existing') {
      if (!selectedCustomerId) {
        setFormError('Please select a customer from the list.');
        return false;
      }
    } else {
      if (!newCustName.trim()) {
        setFormError('Please enter Customer / Organization Name.');
        return false;
      }
      if (!newCustPhone.trim()) {
        setFormError('Please enter Customer Mobile Phone.');
        return false;
      }
      if (!newCustPlace.trim()) {
        setFormError('Please enter Customer Place / District in Kerala.');
        return false;
      }
    }

    if (items.length === 0) {
      setFormError('Please add at least one product item.');
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName) {
        setFormError(`Item #${i + 1} is missing a product name.`);
        return false;
      }
      if (Number(it.quantity) <= 0) {
        setFormError(`Item #${i + 1} quantity must be greater than 0.`);
        return false;
      }
      if (Number(it.unitPrice) < 0) {
        setFormError(`Item #${i + 1} unit price cannot be negative.`);
        return false;
      }
    }

    if (validityDays <= 0) {
      setFormError('Quotation validity days must be at least 1.');
      return false;
    }

    return true;
  };

  // Compile full Quotation Object
  const prepareQuotationObject = (status: 'Draft' | 'Sent'): Quotation => {
    let custId = selectedCustomerId;
    let custName = '';
    let custPhone = '';
    let custAltPhone = '';
    let custPlace = '';
    let custAddress = '';
    let custCareOf = '';

    if (customerMode === 'existing' && selectedCustomerObj) {
      custId = selectedCustomerObj.id;
      custName = selectedCustomerObj.customerName;
      custPhone = selectedCustomerObj.phone;
      custAltPhone = selectedCustomerObj.alternativePhone || '';
      custPlace = selectedCustomerObj.place;
      custAddress = selectedCustomerObj.address || selectedCustomerObj.place;
      custCareOf = selectedCustomerObj.careOf || '';
    } else if (customerMode === 'new') {
      // Save customer to data store if new
      const createdCust = dataStore.addCustomer({
        customerName: newCustName.trim(),
        phone: newCustPhone.trim(),
        alternativePhone: newCustAltPhone.trim(),
        place: newCustPlace.trim(),
        address: newCustAddress.trim() || newCustPlace.trim(),
        careOf: newCustCareOf.trim(),
        district: newCustPlace.trim(),
        leadStatus: status === 'Draft' ? 'New Lead' : 'Quotation Sent',
        orderChance: 'Medium',
        assignedToId: assignedToId,
        assignedToName: assignedExec.name,
        productInterestedName: items[0]?.productName || 'Kerala Incinerator',
        enquiryDate: quotationDate,
        leadSource: 'Walk-in',
        expectedValue: grandTotal,
        remarks: `Created during Quotation creation ${quotationNumber}.`,
      });
      custId = createdCust.id;
      custName = createdCust.customerName;
      custPhone = createdCust.phone;
      custAltPhone = createdCust.alternativePhone || '';
      custPlace = createdCust.place;
      custAddress = createdCust.address;
      custCareOf = createdCust.careOf || '';
    }

    const validUntilDate = new Date(
      new Date(quotationDate).getTime() + validityDays * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];

    const qtnData: Quotation = {
      id: editQuotation?.id || `qtn_${Date.now()}`,
      quotationNumber,
      customerId: custId,
      customerName: custName,
      customerPhone: custPhone,
      alternativePhone: custAltPhone,
      customerPlace: custPlace,
      customerAddress: custAddress,
      careOf: custCareOf,
      assignedToId: assignedToId,
      assignedToName: assignedExec.name,
      preparedById: currentUser.id,
      preparedByName: currentUser.name,
      items,
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      taxPercent: 18,
      transportationCharges: Number(transportationCharges) || 0,
      totalAmount: grandTotal,
      grandTotal: grandTotal,
      validityDays,
      validUntil: validUntilDate,
      quotationDate,
      status: editQuotation ? editQuotation.status : status,
      paymentTerms,
      deliveryTerms,
      installationTerms,
      warranty,
      remarks,
      convertedToOrderId: editQuotation?.convertedToOrderId,
      createdAt: editQuotation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return qtnData;
  };

  const handleOpenPreview = () => {
    if (!validateForm()) return;
    const qtn = prepareQuotationObject('Draft');
    setPreviewQuotationData(qtn);
    setShowPreviewModal(true);
  };

  const handleSubmit = (status: 'Draft' | 'Sent') => {
    if (!validateForm()) return;

    const qtnData = prepareQuotationObject(status);

    let savedQuotation: Quotation;
    if (editQuotation) {
      const updated = dataStore.updateQuotation(editQuotation.id, qtnData);
      savedQuotation = updated || qtnData;
    } else {
      savedQuotation = dataStore.addQuotation(qtnData);
    }

    // Clear auto-saved draft
    localStorage.removeItem(DRAFT_STORAGE_KEY);

    onSuccess(savedQuotation);
  };

  return (
    <>
      <div
        id="create-quotation-modal-backdrop"
        className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      >
        <div
          id="create-quotation-modal-container"
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-[#0F172A] px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#38BDF8]" />
                <h2 className="text-lg font-extrabold tracking-tight">
                  {editQuotation ? 'Edit Quotation' : 'Create Customer Quotation'}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-[#38BDF8] border border-blue-500/30">
                  {quotationNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate official GST-compliant quotations with instant PDF preview and WhatsApp sharing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {draftSavedTime && !editQuotation && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Draft saved at {draftSavedTime}</span>
                </div>
              )}

              <button
                id="modal-btn-close-quotation"
                onClick={onClose}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. CUSTOMER SELECTION SECTION */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider">
                    1. Customer Information
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select an existing prospect or add a new customer inline.
                  </p>
                </div>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCustomerMode('existing')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      customerMode === 'existing'
                        ? 'bg-white text-[#2563EB] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode('new')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      customerMode === 'new'
                        ? 'bg-white text-[#2563EB] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ New Customer</span>
                  </button>
                </div>
              </div>

              {customerMode === 'existing' ? (
                <div className="space-y-3">
                  {/* Search Existing Customer */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search customer by name, phone, or place (e.g. Perumbavoor, Aluva)..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                    {filteredCustomers.length === 0 ? (
                      <div className="col-span-2 p-4 text-center text-xs text-slate-400">
                        No matching customers found.{' '}
                        <button
                          type="button"
                          onClick={() => setCustomerMode('new')}
                          className="text-[#2563EB] font-bold hover:underline ml-1"
                        >
                          Create as new customer
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const isSelected = selectedCustomerId === cust.id;
                        return (
                          <div
                            key={cust.id}
                            onClick={() => setSelectedCustomerId(cust.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-50/70 border-[#2563EB] text-[#2563EB]'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{cust.customerName}</span>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {cust.phone} • {cust.place}
                              </div>
                              {cust.address && (
                                <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {cust.address}
                                </div>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 shrink-0">
                              {cust.leadStatus}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedCustomerObj && (
                    <div className="p-3 bg-blue-50/40 border border-blue-200/60 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 font-semibold mr-1">Selected Customer:</span>
                        <strong className="text-slate-900">{selectedCustomerObj.customerName}</strong>
                        <span className="text-slate-500 ml-2">
                          ({selectedCustomerObj.phone} • {selectedCustomerObj.place})
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* New Customer Inline Form */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Customer / Org Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Mathew / Holy Cross Hospital"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9847123456"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Alternative Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. Landline or second mobile"
                      value={newCustAltPhone}
                      onChange={(e) => setNewCustAltPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Place / District *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Perumbavoor, Ernakulam"
                      value={newCustPlace}
                      onChange={(e) => setNewCustPlace(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Full Address
                    </label>
                    <input
                      type="text"
                      placeholder="Site / Institution address"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Care Of / Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Facility Manager"
                      value={newCustCareOf}
                      onChange={(e) => setNewCustCareOf(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. SALES EXECUTIVE & QUOTATION PARTICULARS */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider border-b border-slate-100 pb-2">
                2. Quotation Particulars & Assignment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Quotation Number
                  </label>
                  <input
                    type="text"
                    value={quotationNumber}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Validity (Days)
                  </label>
                  <select
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days (Standard)</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Sales Executive
                  </label>
                  {isOwner || isSenior ? (
                    <select
                      value={assignedToId}
                      onChange={(e) => setAssignedToId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={currentUser.name}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 3. PRODUCT ITEMS SELECTION (MULTI-ITEM) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider">
                    3. Products & Equipment Items
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add multiple incinerator models, chimney accessories, or custom fabrication.
                  </p>
                </div>

                <button
                  type="button"
                  id="btn-add-product-item"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Product Dropdown */}
                      <div className="sm:col-span-5">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          Product Catalog
                        </label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2563EB]"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.capacity}) - ₹{p.defaultPrice.toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description / Capacity */}
                      <div className="sm:col-span-7">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          Item Description / Capacity
                        </label>
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Commercial smokeless double-chamber unit"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>

                      {/* Qty */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-3">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>

                      {/* Discount */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.discount}
                          onChange={(e) =>
                            handleItemChange(idx, 'discount', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>

                      {/* Tax Rate */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-bold text-[10px] mb-1">
                          GST Tax Rate
                        </label>
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                        >
                          <option value={18}>18% (Standard)</option>
                          <option value={12}>12%</option>
                          <option value={5}>5%</option>
                          <option value={0}>0% (Exempt)</option>
                        </select>
                      </div>

                      {/* Total */}
                      <div className="sm:col-span-3 flex flex-col justify-end">
                        <label className="block text-slate-500 font-bold text-[10px] mb-1">
                          Line Total (incl. GST)
                        </label>
                        <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-extrabold text-slate-900 border border-slate-200 text-right">
                          ₹{Math.round(item.totalAmount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. FINANCIAL SUMMARY & TRANSPORTATION */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider border-b border-slate-100 pb-2">
                4. Pricing Summary & Financial Calculation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Transportation & Delivery Charges (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={transportationCharges}
                      onChange={(e) => setTransportationCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563EB]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Standard delivery across Kerala (Aimury/Perumbavoor hub to customer destination).
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-[11px] mb-1">
                      Special Remarks / Notes for Customer
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Concrete foundation to be completed by customer prior to delivery."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                {/* Real-time Math Summary Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <strong className="text-slate-900">₹{subtotal.toLocaleString('en-IN')}</strong>
                  </div>

                  {discountTotal > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Total Discount:</span>
                      <strong className="font-bold">-₹{discountTotal.toLocaleString('en-IN')}</strong>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount:</span>
                    <strong className="text-slate-900">₹{taxableAmount.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>GST (18% Equipment Tax):</span>
                    <strong className="text-slate-900">₹{taxTotal.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Transportation / Freight:</span>
                    <strong className="text-slate-900">₹{transportationCharges.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-[#0F172A] uppercase tracking-wider">
                      Grand Total:
                    </span>
                    <span className="text-xl font-black text-[#2563EB]">
                      ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. TERMS & CONDITIONS */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-[#2563EB] uppercase tracking-wider border-b border-slate-100 pb-2">
                5. Terms & Conditions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Delivery Terms
                  </label>
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Installation Terms
                  </label>
                  <input
                    type="text"
                    value={installationTerms}
                    onChange={(e) => setInstallationTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold text-[11px] mb-1">
                    Warranty Period & Coverage
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Action Buttons */}
          <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {!editQuotation && draftSavedTime && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  Discard Draft
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="btn-preview-quotation"
                onClick={handleOpenPreview}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Preview PDF</span>
              </button>

              <button
                type="button"
                id="btn-save-draft-quotation"
                onClick={() => handleSubmit('Draft')}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                id="btn-submit-send-quotation"
                onClick={() => handleSubmit('Sent')}
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>{editQuotation ? 'Update Quotation' : 'Create & Send Quotation'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Preview Modal */}
      {showPreviewModal && previewQuotationData && (
        <QuotationPreviewModal
          quotation={previewQuotationData}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  );
};

