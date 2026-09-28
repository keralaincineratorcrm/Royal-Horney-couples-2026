import React from 'react';
import { Filter, GitCommit, ArrowRight, DollarSign, Users, Globe } from 'lucide-react';
import { ManagementAnalyticsData } from '../../types';

interface PipelineFunnelSectionProps {
  pipeline: ManagementAnalyticsData['pipeline'];
  leadSources: ManagementAnalyticsData['leadSources'];
  onNavigateTab?: (tab: string, filter?: any) => void;
}

export const PipelineFunnelSection: React.FC<PipelineFunnelSectionProps> = ({
  pipeline,
  leadSources,
  onNavigateTab,
}) => {
  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1);
  const totalPipelineValue = pipeline.reduce((sum, p) => sum + p.estimatedValue, 0);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New Lead':
        return 'bg-blue-500';
      case 'Contacted':
        return 'bg-sky-500';
      case 'Interested':
        return 'bg-indigo-500';
      case 'Quotation Sent':
        return 'bg-purple-500';
      case 'Follow-up':
        return 'bg-amber-500';
      case 'Ordered':
        return 'bg-teal-500';
      case 'Delivered':
        return 'bg-emerald-500';
      case 'Completed':
        return 'bg-green-600';
      case 'No Need':
        return 'bg-slate-400';
      case 'Purchased Another Brand':
        return 'bg-rose-400';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-6">
      {/* Pipeline Funnel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-blue-600" />
            Lead Progression Pipeline & Conversion Stages
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active customer distribution and potential deal valuation across sequential sales lifecycle stages
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Pipeline Value</span>
          <div className="text-lg font-black text-blue-700">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Visual Pipeline Funnel Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Active Conversion Funnel
          </h3>
          {pipeline
            .filter((p) => p.stage !== 'No Need' && p.stage !== 'Purchased Another Brand')
            .map((item) => {
              const widthPct = Math.max(12, Math.round((item.count / maxPipelineCount) * 100));
              return (
                <div
                  key={item.stage}
                  onClick={() =>
                    onNavigateTab &&
                    onNavigateTab('customers', {
                      status: item.stage === 'Follow-up' ? undefined : item.stage,
                    })
                  }
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.stage}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{item.count} Leads</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-600">
                        ₹{item.estimatedValue.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStageColor(item.stage)} transition-all duration-500`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Drop-offs & Inactive / Lost Stages */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pipeline Exits & Non-Conversions
            </h3>
            {pipeline
              .filter((p) => p.stage === 'No Need' || p.stage === 'Purchased Another Brand')
              .map((item) => (
                <div
                  key={item.stage}
                  onClick={() => onNavigateTab && onNavigateTab('customers', { status: item.stage })}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800">{item.stage}</div>
                    <div className="text-[11px] text-slate-500">
                      Closed without incinerator order
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-700">{item.count} Leads</div>
                    <div className="text-[10px] text-slate-400">
                      ₹{item.estimatedValue.toLocaleString('en-IN')} val
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Quick Summary insight */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 space-y-1 text-xs text-blue-900">
            <div className="font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Pipeline Velocity Insight
            </div>
            <p className="text-blue-700 text-[11px] leading-relaxed">
              Customers progressing past the quotation stage into negotiation and active follow-up exhibit an estimated 78% win rate toward finalized purchase orders in Kerala districts.
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Lead Source Analytics */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          Lead Source Acquisition & Revenue Attribution
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Acquisition Source</th>
                <th className="py-2.5 px-3 text-center">Total Inquiries</th>
                <th className="py-2.5 px-3 text-center">Interested</th>
                <th className="py-2.5 px-3 text-center">Quotations</th>
                <th className="py-2.5 px-3 text-center">Orders Won</th>
                <th className="py-2.5 px-3 text-right">Revenue Generated (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leadSources.map((src) => (
                <tr key={src.source} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{src.source}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                    {src.leadCount}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{src.interestedCount}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{src.quotationCount}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                    {src.orderCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    ₹{src.orderValue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

