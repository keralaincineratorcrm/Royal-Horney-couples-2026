import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Power,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  Tag,
  Info,
  X,
} from 'lucide-react';
import { dataStore } from '../../../lib/supabase';
import { Product } from '../../../types';

interface ProductSettingsSectionProps {
  canEdit: boolean;
}

export const ProductSettingsSection: React.FC<ProductSettingsSectionProps> = ({ canEdit }) => {
  const [products, setProducts] = useState<Product[]>(() => dataStore.getProducts());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    category: 'Commercial',
    model: 'Standard',
    description: '',
    defaultPrice: 0,
    gstRate: 18,
    specifications: '',
    active: true,
  });

  const refreshProducts = () => {
    setProducts(dataStore.getProducts());
  };

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.model && p.model.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.active) ||
      (statusFilter === 'inactive' && !p.active);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Commercial Incinerator',
      model: 'Standard',
      description: '',
      defaultPrice: 45000,
      gstRate: 18,
      specifications: 'Stainless steel 304 combustion chamber, multi-layer refractory insulation',
      active: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category || 'Commercial Incinerator',
      model: prod.model || 'Standard',
      description: prod.description || '',
      defaultPrice: prod.defaultPrice || 0,
      gstRate: prod.gstRate ?? 18,
      specifications: prod.specification || '',
      active: prod.active ?? true,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    dataStore.addProduct({
      name: formData.name.trim(),
      category: formData.category,
      model: formData.model.trim(),
      description: formData.description.trim(),
      defaultPrice: Number(formData.defaultPrice) || 0,
      gstRate: Number(formData.gstRate) || 18,
      specification: formData.specifications.trim(),
      active: formData.active,
    });
    refreshProducts();
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !canEdit) return;
    dataStore.updateProduct(selectedProduct.id, {
      name: formData.name.trim(),
      category: formData.category,
      model: formData.model.trim(),
      description: formData.description.trim(),
      defaultPrice: Number(formData.defaultPrice) || 0,
      gstRate: Number(formData.gstRate) || 18,
      specification: formData.specifications.trim(),
      active: formData.active,
    });
    refreshProducts();
    setIsEditModalOpen(false);
  };

  const handleToggleActive = (prod: Product) => {
    if (!canEdit) return;
    dataStore.toggleProductActive(prod.id, !prod.active);
    refreshProducts();
  };

  return (
    <div className="space-y-6">
      {/* Header & Protection Notice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Product & Pricing Catalog</h3>
            <p className="text-xs text-slate-500">
              Manage Kerala Incinerator units, base prices, GST rates, and models.
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Product Model
            </button>
          )}
        </div>

        {/* Invariant guarantee banner */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Historical Transaction Protection:</strong> Changing catalog prices only sets the default for <em>future</em> quotations. Existing quotes and orders retain their original contracted prices permanently.
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search products, models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active In Catalog</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-sm ${
              prod.active ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200/60 bg-slate-50/50 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{prod.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-600">{prod.category}</span>
                      {prod.model && <span>• Model: {prod.model}</span>}
                    </div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prod.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {prod.active ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Deactivated
                    </>
                  )}
                </span>
              </div>

              {prod.description && (
                <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                  {prod.description}
                </p>
              )}

              {prod.specification && (
                <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 border border-slate-100 line-clamp-2">
                  <span className="font-semibold text-slate-700">Specs: </span>
                  {prod.specification}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Catalog Base Price
                </span>
                <span className="text-base font-black text-slate-900 flex items-center">
                  ₹{prod.defaultPrice?.toLocaleString('en-IN')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (+{prod.gstRate ?? 18}% GST)
                  </span>
                </span>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 min-h-[38px] min-w-[38px] text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit Product Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(prod)}
                    className={`p-2 min-h-[38px] min-w-[38px] rounded-xl transition-colors ${
                      prod.active
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={prod.active ? 'Deactivate Product' : 'Activate Product'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            No products match the selected criteria.
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAdd}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Incinerator Model</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kerala Incinerator KI-25 Solid Waste Unit"
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Commercial / Domestic"
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Model Code
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. KI-50-AUTO"
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Base Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                    min={0}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    min={0}
                    max={28}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Key features, capacity, target establishment..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Technical Specifications
                </label>
                <textarea
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  rows={2}
                  placeholder="Materials, chimney dimensions, burner rating..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Add to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit {selectedProduct.name}</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Model Code
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Base Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: Number(e.target.value) })}
                    min={0}
                    required
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Will not affect existing past quotations/orders.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    GST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    min={0}
                    max={28}
                    className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Technical Specifications
                </label>
                <textarea
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-slate-200 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
              >
                Update Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
