import React, { useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Wrench,
  AlertCircle,
  PackageCheck,
  Award,
} from 'lucide-react';
import { Order, DeliveryStatus, InstallationStatus } from '../../types';
import { dataStore } from '../../lib/supabase';

interface UpdateDeliveryModalProps {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpdateDeliveryModal: React.FC<UpdateDeliveryModalProps> = ({
  order,
  onClose,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(order.deliveryStatus || 'Pending');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    order.expectedDeliveryDate || todayStr
  );
  const [actualDeliveryDate, setActualDeliveryDate] = useState<string>(
    order.actualDeliveryDate || order.deliveryDate || todayStr
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    order.deliveryAddress || order.billingAddress || order.customerPlace || ''
  );
  const [deliveryRemarks, setDeliveryRemarks] = useState<string>(order.deliveryRemarks || '');
  const [installationStatus, setInstallationStatus] = useState<InstallationStatus>(
    order.installationStatus || 'Pending'
  );
  const [installationDate, setInstallationDate] = useState<string>(
    order.installationDate || todayStr
  );
  const [installationRemarks, setInstallationRemarks] = useState<string>(
    order.installationRemarks || ''
  );

  const deliverySteps: { id: DeliveryStatus; label: string; desc: string; icon: any }[] = [
    { id: 'Processing', label: 'In Production', desc: 'Fabrication and paint finishing in workshop', icon: Clock },
    { id: 'Ready for Dispatch', label: 'Ready for Dispatch', desc: 'QC cleared and packaged for transit', icon: PackageCheck },
    { id: 'In Transit', label: 'Dispatched / In Transit', desc: 'On vehicle moving towards customer site', icon: Truck },
    { id: 'Delivered', label: 'Delivered to Site', desc: 'Safely delivered at customer location', icon: CheckCircle2 },
    { id: 'Installed', label: 'Installed & Tested', desc: 'Erection & trial burn completed', icon: Wrench },
    { id: 'Completed', label: 'Fully Completed', desc: 'Handover complete and paperwork closed', icon: Award },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    dataStore.updateOrderDelivery(order.id, {
      deliveryStatus,
      expectedDeliveryDate,
      actualDeliveryDate: deliveryStatus === 'Delivered' || deliveryStatus === 'Installed' || deliveryStatus === 'Completed'
        ? actualDeliveryDate
        : undefined,
      deliveryAddress,
      deliveryRemarks: deliveryRemarks.trim() || undefined,
      installationStatus,
      installationDate: installationStatus === 'Completed' ? installationDate : undefined,
      installationRemarks: installationRemarks.trim() || undefined,
    });

    onSuccess();
  };

  return (
    <div
      id="update-delivery-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 text-xs relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Update Dispatch & Delivery
              </h3>
              <p className="text-[11px] text-slate-500">
                Order: <span className="font-bold text-slate-700">{order.orderNumber}</span> • {order.customerName}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Status Step Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Select Delivery Milestone</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deliverySteps.map((step) => {
                const Icon = step.icon;
                const isSelected = deliveryStatus === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setDeliveryStatus(step.id);
                      if (step.id === 'Installed' || step.id === 'Completed') {
                        setInstallationStatus('Completed');
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-left ${
                      isSelected
                        ? 'border-[#2563EB] bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className={`font-bold text-xs ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {step.label}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {(deliveryStatus === 'Delivered' || deliveryStatus === 'Installed' || deliveryStatus === 'Completed') && (
              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  Actual Delivery Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={actualDeliveryDate}
                  onChange={(e) => setActualDeliveryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Destination Site Address */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Delivery Destination Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Full delivery address with landmark and district"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Dispatch / Courier / Vehicle Remarks */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Vehicle, Driver & Transit Remarks
            </label>
            <textarea
              value={deliveryRemarks}
              onChange={(e) => setDeliveryRemarks(e.target.value)}
              placeholder="e.g. Dispatched via KL-07-AY-8821 (Driver: Suresh, 9847123456). Access road steep, 4WD pickup recommended."
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Installation Section */}
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-700" />
                <span className="font-extrabold text-purple-900 text-xs">
                  Installation & Commissioning
                </span>
              </div>
              <span className="text-[10px] text-purple-600 font-semibold">
                {order.installationRequired ? 'Required by Customer' : 'Not Required'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  Installation Status
                </label>
                <select
                  value={installationStatus}
                  onChange={(e) => setInstallationStatus(e.target.value as InstallationStatus)}
                  className="w-full p-2 rounded-lg border border-purple-300 bg-white font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress (Tech on site)</option>
                  <option value="Completed">Completed & Verified</option>
                  <option value="Not Required">Not Required</option>
                </select>
              </div>

              {installationStatus === 'Completed' && (
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-purple-300 bg-white font-medium text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                value={installationRemarks}
                onChange={(e) => setInstallationRemarks(e.target.value)}
                placeholder="Tech remarks: Chimney erection complete; smoke chamber tested; customer trained."
                className="w-full p-2 rounded-lg border border-purple-200 bg-white text-slate-800 text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Status Updates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

