import React from 'react';
import { Package, Download, Award } from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';
import { exportToCSV } from './exportUtils';

interface ProductPerformanceSectionProps {
  productPerformance: ManagementAnalyticsData['productPerformance'];
}

export const ProductPerformanceSection: React.FC<ProductPerformanceSectionProps> = ({
  productPerformance,
}) => {
  const totalRevenue = productPerformance.reduce((s, p) => s + p.orderValue, 0);

  const handleExportCSV = () => {
    const exportData = productPerformance.map((p) => ({
      productName: p.productName,
      category: p.category,
      quotationCount: p.quotationCount,
      orderCount: p.orderCount,
      quantitySold: p.quantitySold,
      orderValue: p.orderValue,
      rankTag: p.rankTag,
    }));

    exportToCSV('Product_Performance_Analytics', exportData, [
      { key: 'productName', label: 'Incinerator Model / Product' },
      { key: 'category', label: 'Product Category' },
      { key: 'quotationCount', label: 'Quotations Created' },
      { key: 'orderCount', label: 'Orders Won' },
      { key: 'quantitySold', label: 'Units Sold' },
      { key: 'orderValue', label: 'Total Revenue (₹)' },
      { key: 'rankTag', label: 'Order Volume Ranking' },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Product-Wise Sales & Model Revenue Contribution
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Incinerator model volume ranking, quotation interest, and sales revenue realization
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Product CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-2.5 px-3">Incinerator Model / Specification</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-center">Quotations</th>
              <th className="py-2.5 px-3 text-center">Orders Won</th>
              <th className="py-2.5 px-3 text-center">Units Sold</th>
              <th className="py-2.5 px-3 text-right font-black text-slate-900">Total Sales (₹)</th>
              <th className="py-2.5 px-3 text-center">Volume Benchmark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {productPerformance.map((prod) => {
              const revShare =
                totalRevenue > 0 ? Math.round((prod.orderValue / totalRevenue) * 100) : 0;

              return (
                <tr key={prod.productId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{prod.productName}</div>
                    <div className="w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${revShare}%` }} />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{prod.category}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{prod.quotationCount}</td>
                  <td className="py-3 px-3 text-center font-bold text-blue-700">{prod.orderCount}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900">{prod.quantitySold}</td>
                  <td className="py-3 px-3 text-right font-black text-slate-900">
                    <div>₹{prod.orderValue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{revShare}% share</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.rankTag === 'Highest Order Volume'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : prod.rankTag === 'Lowest Order Volume'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {prod.rankTag}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

