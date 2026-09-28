import React from 'react';
import { Flame, Check, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { dataStore } from '../../lib/supabase';
import { Product } from '../../types';

interface ProductsModuleProps {
  onGenerateQuotationForProduct: (product: Product) => void;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({
  onGenerateQuotationForProduct,
}) => {
  const products = dataStore.getProducts();

  return (
    <div id="products-catalog-container" className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Kerala Incinerator Product Lines
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          High-temperature smokeless & odorless waste disposal systems manufactured for Kerala's high-humidity conditions.
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Product Image */}
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                  {prod.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-blue-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                  ₹{prod.defaultPrice.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {prod.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#2563EB] mt-0.5">
                    Capacity: {prod.capacity}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {prod.description}
                </p>

                {/* Features checklist */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {(prod.features || []).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-5 pt-0">
              <button
                onClick={() => onGenerateQuotationForProduct(prod)}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Quotation for This Model</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

