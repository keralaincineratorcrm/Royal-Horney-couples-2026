import React, { useState, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Phone,
  MessageCircle,
  FileText,
  ShoppingCart,
  Calendar,
  Camera,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CustomerVisit,
  CustomerLead,
  VisitOutcome,
  CustomerResponseOption,
  OrderChance,
  ContactType,
} from '../../types';
import { dataStore } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface VisitCheckInModalProps {
  visit: CustomerVisit;
  onClose: () => void;
  onComplete: (visitId: string, outcome: string) => void;
  onCreateQuotation?: (customer: CustomerLead, visit: CustomerVisit) => void;
  onCreateOrder?: (customer: CustomerLead, visit: CustomerVisit) => void;
}

const CUSTOMER_RESPONSES: CustomerResponseOption[] = [
  'Interested',
  'Very Interested',
  'Quotation Required',
  'Need More Information',
  'Will Discuss Internally',
  'Order Expected',
  'Not Interested',
  'Purchased Another Brand',
  'No Decision Yet',
  'Other',
];

const VISIT_OUTCOMES: VisitOutcome[] = [
  'Quotation Required',
  'Follow-up Required',
  'Order Confirmed',
  'Product Demonstration Required',
  'Site Requirement Pending',
  'Customer Not Interested',
  'Purchased Another Brand',
  'No Further Action',
  'Other',
];

export const VisitCheckInModal: React.FC<VisitCheckInModalProps> = ({
  visit,
  onClose,
  onComplete,
  onCreateQuotation,
  onCreateOrder,
}) => {
  const { currentUser } = useAuth();
  const products = dataStore.getProducts();
  const customer = dataStore.getCustomers('owner').find((c) => c.id === visit.customerId);

  // Workflow step: If visit already 'In Progress' or checked in, step = 2 (in progress/completion)
  // Else step = 1 (Check-in screen)
  const [step, setStep] = useState<number>(visit.status === 'In Progress' ? 2 : 1);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    captured: boolean;
    lat?: number;
    lng?: number;
    accuracy?: number;
    unavailable?: boolean;
    message?: string;
  }>(
    visit.gpsLatitude && visit.gpsLongitude
      ? {
          captured: true,
          lat: visit.gpsLatitude,
          lng: visit.gpsLongitude,
          accuracy: visit.gpsAccuracy,
          message: 'Location captured successfully',
        }
      : visit.gpsUnavailable
      ? { captured: false, unavailable: true, message: 'GPS unavailable - manual check-in' }
      : { captured: false }
  );

  // Discussion & Outcome Form state
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    visit.productsDiscussed && visit.productsDiscussed.length > 0
      ? visit.productsDiscussed
      : [customer?.productInterestedName || '10kg SS Burner Incinerator']
  );
  const [discussionNotes, setDiscussionNotes] = useState(visit.discussionNotes || '');
  const [customerRequirements, setCustomerRequirements] = useState(visit.customerRequirements || '');
  const [quantityRequirement, setQuantityRequirement] = useState(visit.quantityRequirement || '1 Unit');
  const [customerQuestions, setCustomerQuestions] = useState(visit.customerQuestions || '');
  const [competitorMentioned, setCompetitorMentioned] = useState(visit.competitorMentioned || '');
  const [customerResponse, setCustomerResponse] = useState<CustomerResponseOption | string>(
    visit.customerResponse || 'Interested'
  );
  const [orderChance, setOrderChance] = useState<OrderChance>(visit.orderChance || 'Medium');
  const [estimatedOrderValue, setEstimatedOrderValue] = useState<string>(
    visit.estimatedOrderValue ? String(visit.estimatedOrderValue) : customer?.expectedValue ? String(customer.expectedValue) : '55000'
  );

  // Site Photos
  const [photos, setPhotos] = useState<string[]>(visit.photos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Completion states
  const [outcome, setOutcome] = useState<VisitOutcome | string>(visit.outcome || 'Interested');
  const [visitRemarks, setVisitRemarks] = useState(visit.visitRemarks || '');

  // Next follow-up
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const defaultNextDate = tomorrow.toISOString().split('T')[0];

  const [createFollowUp, setCreateFollowUp] = useState(
    outcome === 'Follow-up Required' || !!visit.nextFollowUpDate
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState(visit.nextFollowUpDate || defaultNextDate);
  const [nextFollowUpTime, setNextFollowUpTime] = useState(visit.nextFollowUpTime || '11:00');
  const [nextFollowUpType, setNextFollowUpType] = useState<ContactType>('Call');
  const [nextFollowUpRemarks, setNextFollowUpRemarks] = useState(
    'Review incinerator quotation and installation specifications'
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Whenever outcome changes to Follow-up Required, ensure createFollowUp is checked
  const handleOutcomeChange = (newOutcome: string) => {
    setOutcome(newOutcome);
    if (newOutcome === 'Follow-up Required') {
      setCreateFollowUp(true);
    }
  };

  // 4. GPS LOCATION CAPTURE
  const handleGpsCheckIn = () => {
    setGpsLoading(true);
    setErrorMessage('');

    if (!navigator.geolocation) {
      // Fallback: Manual check-in
      setGpsStatus({
        captured: false,
        unavailable: true,
        message: 'Geolocation is not supported by your browser/device. Manual check-in applied.',
      });
      setGpsLoading(false);
      proceedToInProgress({ unavailable: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setGpsStatus({
          captured: true,
          lat,
          lng,
          accuracy,
          unavailable: false,
          message: 'Location captured successfully',
        });
        setGpsLoading(false);

        // Record check-in in dataStore
        proceedToInProgress({ lat, lng, accuracy, unavailable: false });
      },
      (error) => {
        console.warn('GPS location error:', error.message);
        setGpsStatus({
          captured: false,
          unavailable: true,
          message: 'GPS unavailable - manual check-in recorded (Permission denied or signal weak)',
        });
        setGpsLoading(false);

        // Fallback: Manual check-in allows the executive to proceed without blocking
        proceedToInProgress({ unavailable: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualCheckInFallback = () => {
    setGpsStatus({
      captured: false,
      unavailable: true,
      message: 'GPS unavailable - manual check-in',
    });
    proceedToInProgress({ unavailable: true });
  };

  const proceedToInProgress = (gpsData: {
    lat?: number;
    lng?: number;
    accuracy?: number;
    unavailable?: boolean;
  }) => {
    dataStore.startVisitCheckIn(visit.id, gpsData);
    setStep(2);
  };

  // Photo uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        if (base64) {
          setPhotos((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const toggleProduct = (prodName: string) => {
    if (selectedProducts.includes(prodName)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter((p) => p !== prodName));
      }
    } else {
      setSelectedProducts([...selectedProducts, prodName]);
    }
  };

  // 8. COMPLETE VISIT
  const handleCompleteVisit = () => {
    setErrorMessage('');

    if (!visitRemarks.trim()) {
      setErrorMessage('Visit Remarks are mandatory before completing the visit.');
      return;
    }

    if (outcome === 'Follow-up Required' && !nextFollowUpDate) {
      setErrorMessage('Next Follow-up Date is required when outcome is Follow-up Required.');
      return;
    }

    setIsSubmitting(true);

    try {
      dataStore.completeVisit(visit.id, {
        outcome,
        visitRemarks,
        discussionNotes,
        discussionPoints: discussionNotes,
        customerRequirements,
        quantityRequirement,
        customerQuestions,
        competitorMentioned,
        customerResponse,
        orderChance,
        estimatedOrderValue: estimatedOrderValue ? Number(estimatedOrderValue) : undefined,
        productsDiscussed: selectedProducts,
        photos,
        nextFollowUp:
          createFollowUp && nextFollowUpDate
            ? {
                date: nextFollowUpDate,
                time: nextFollowUpTime || '11:00',
                contactType: nextFollowUpType,
                remarks: nextFollowUpRemarks,
              }
            : undefined,
      });

      onComplete(visit.id, outcome);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete visit. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 text-xs">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#2563EB] text-white">
                  {step === 1 ? 'CHECK-IN' : 'VISIT IN PROGRESS'}
                </span>
                <span className="text-[#38BDF8] font-bold text-xs">
                  {visit.purpose || 'Customer Site Visit'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight truncate">
                {visit.customerName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-slate-300 text-xs mt-1">
                <span className="flex items-center gap-1 text-[#38BDF8] font-semibold">
                  <MapPin className="w-3.5 h-3.5" />
                  {visit.location || visit.customerPlace}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {visit.customerPhone}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP 1: GPS CHECK-IN SCREEN */}
        {step === 1 && (
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Privacy Notice (Section 5) */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-bold text-slate-900 block mb-0.5">
                  GPS Privacy Guarantee
                </span>
                Your location is used <strong>only</strong> to record the customer visit check-in. Kerala Incinerator CRM does not continuously track employee location.
              </div>
            </div>

            {/* Visit Details Confirmation */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Visit Scheduled Details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Scheduled Time</span>
                  <span className="text-slate-900 font-black text-sm">
                    {visit.visitDate} at {visit.visitTime}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Field Executive</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {visit.assignedToName || currentUser.name}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Products Discussed</span>
                <span className="text-slate-800 font-bold text-xs">
                  {visit.productsDiscussed?.join(', ') || '10kg SS Burner Incinerator'}
                </span>
              </div>
            </div>

            {/* GPS Feedback & Button */}
            {gpsStatus.message && (
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-2.5 font-bold text-xs ${
                  gpsStatus.captured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {gpsStatus.captured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>{gpsStatus.message}</span>
              </div>
            )}

            {/* Large Check-in Call to Action (Minimum 44px touch) */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleGpsCheckIn}
                className="w-full min-h-[52px] py-3.5 px-6 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.99] text-white text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5"
              >
                <Navigation className={`w-5 h-5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Capturing GPS Location...' : 'CHECK IN & START VISIT'}</span>
              </button>

              <button
                type="button"
                onClick={handleManualCheckInFallback}
                className="w-full py-2.5 text-center text-slate-500 hover:text-slate-800 font-bold text-xs transition-colors"
              >
                Having GPS issues? Continue with Manual Check-in →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: VISIT IN PROGRESS / COMPLETION WORKFLOW */}
        {step === 2 && (
          <div className="p-5 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Check-in Verified Banner */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 block text-xs">
                    Visit Started & Checked In
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {visit.checkInTime ? `Checked in at ${visit.checkInTime}` : 'In progress'}{' '}
                    {gpsStatus.lat ? `(GPS verified ±${Math.round(gpsStatus.accuracy || 0)}m)` : '(Manual Check-in)'}
                  </span>
                </div>
              </div>

              {gpsStatus.lat && gpsStatus.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${gpsStatus.lat},${gpsStatus.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-300 text-[11px] flex items-center gap-1 transition-colors"
                >
                  <span>Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Products Discussed (Section 6 & 9) */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 uppercase text-[11px] tracking-wide flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Products Discussed (Multi-select Catalog)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                {products.map((prod) => {
                  const isSelected = selectedProducts.includes(prod.name);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => toggleProduct(prod.name)}
                      className={`p-2 rounded-lg text-left text-xs font-medium border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate pr-1">{prod.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discussion Notes & Requirements */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                  Discussion Points & Key Topics Covered
                </label>
                <textarea
                  rows={2}
                  value={discussionNotes}
                  onChange={(e) => setDiscussionNotes(e.target.value)}
                  placeholder="e.g. Discussed hospital waste daily volume (approx 15kg/day), dual combustion chamber benefits, Kerala Pollution Control Board compliance."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Customer Requirements
                  </label>
                  <input
                    type="text"
                    value={customerRequirements}
                    onChange={(e) => setCustomerRequirements(e.target.value)}
                    placeholder="e.g. Biomedical & sanitary waste"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Quantity / Capacity Needed
                  </label>
                  <input
                    type="text"
                    value={quantityRequirement}
                    onChange={(e) => setQuantityRequirement(e.target.value)}
                    placeholder="e.g. 1 Unit (15kg batch)"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Customer Questions / Objections
                  </label>
                  <input
                    type="text"
                    value={customerQuestions}
                    onChange={(e) => setCustomerQuestions(e.target.value)}
                    placeholder="e.g. Chimney height clearance requirement?"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Competitor Mentioned (if any)
                  </label>
                  <input
                    type="text"
                    value={competitorMentioned}
                    onChange={(e) => setCompetitorMentioned(e.target.value)}
                    placeholder="e.g. Local metal workshop / None"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Customer Response & Order Probability */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                  Customer Response
                </label>
                <select
                  value={customerResponse}
                  onChange={(e) => setCustomerResponse(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CUSTOMER_RESPONSES.map((resp) => (
                    <option key={resp} value={resp}>
                      {resp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                  Order Chance
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['High', 'Medium', 'Low'] as OrderChance[]).map((oc) => (
                    <button
                      key={oc}
                      type="button"
                      onClick={() => setOrderChance(oc)}
                      className={`py-1.5 text-center rounded-lg font-bold border text-xs transition-all ${
                        orderChance === oc
                          ? oc === 'High'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : oc === 'Medium'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-700 text-white border-slate-700'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {oc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                  Est. Value (₹)
                </label>
                <input
                  type="number"
                  value={estimatedOrderValue}
                  onChange={(e) => setEstimatedOrderValue(e.target.value)}
                  placeholder="e.g. 55000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Site Photos (Section 7) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  Site Photos ({photos.length})
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-[#2563EB] border border-blue-200 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Add Photo / Take Picture</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {photos.map((pic, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 relative group"
                    >
                      <img
                        src={pic}
                        alt={`Site ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] italic">
                  No site photos attached yet. You can photograph the proposed incinerator installation site, premises or waste generation area.
                </p>
              )}
            </div>

            {/* Section 8: Outcome & Mandatory Remarks */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
              <div className="text-slate-900 font-bold uppercase text-[11px] tracking-wide">
                Final Visit Completion Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Visit Outcome <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => handleOutcomeChange(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {VISIT_OUTCOMES.map((out) => (
                      <option key={out} value={out}>
                        {out}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px] tracking-wide">
                    Visit Remarks <span className="text-rose-500">* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    value={visitRemarks}
                    onChange={(e) => setVisitRemarks(e.target.value)}
                    placeholder="Summary of meeting and agreed next step..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Next Follow-up Section */}
              <div className="pt-2 border-t border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="checkbox"
                      checked={createFollowUp}
                      onChange={(e) => setCreateFollowUp(e.target.checked)}
                      className="w-4 h-4 text-[#2563EB] rounded"
                    />
                    <span>Schedule Next Follow-up from this Visit</span>
                  </label>
                  {outcome === 'Follow-up Required' && (
                    <span className="text-rose-600 font-bold text-[10px]">
                      Required for this outcome
                    </span>
                  )}
                </div>

                {createFollowUp && (
                  <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Follow-up Date
                        </span>
                        <input
                          type="date"
                          value={nextFollowUpDate}
                          onChange={(e) => setNextFollowUpDate(e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Time
                        </span>
                        <input
                          type="time"
                          value={nextFollowUpTime}
                          onChange={(e) => setNextFollowUpTime(e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Contact Type
                        </span>
                        <select
                          value={nextFollowUpType}
                          onChange={(e) => setNextFollowUpType(e.target.value as ContactType)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="Call">Call</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Visit">Customer Visit</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Follow-up Objective
                      </span>
                      <input
                        type="text"
                        value={nextFollowUpRemarks}
                        onChange={(e) => setNextFollowUpRemarks(e.target.value)}
                        placeholder="Action item for follow-up..."
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Visit Button (Minimum 44px touch) */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCompleteVisit}
                className="w-full min-h-[50px] py-3 px-6 bg-[#16A34A] hover:bg-emerald-700 active:scale-[0.99] text-white text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Saving Visit Details...' : 'COMPLETE VISIT'}</span>
              </button>

              {/* Instant integration shortcuts */}
              {outcome === 'Quotation Required' && customer && onCreateQuotation && (
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteVisit();
                    onCreateQuotation(customer, visit);
                  }}
                  className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Complete Visit & Create Quotation Now</span>
                </button>
              )}

              {outcome === 'Order Confirmed' && customer && onCreateOrder && (
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteVisit();
                    onCreateOrder(customer, visit);
                  }}
                  className="w-full py-2.5 bg-[#16A34A] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Complete Visit & Create Order Now</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

