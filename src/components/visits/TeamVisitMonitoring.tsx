import React from 'react';
import { Users, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { CustomerVisit, UserProfile } from '../../types';

interface TeamVisitMonitoringProps {
  teamMembers: UserProfile[];
  allVisits: CustomerVisit[];
  todayStr: string;
  onSelectExecutive: (executiveId: string) => void;
  selectedExecutiveId?: string;
}

export const TeamVisitMonitoring: React.FC<TeamVisitMonitoringProps> = ({
  teamMembers,
  allVisits,
  todayStr,
  onSelectExecutive,
  selectedExecutiveId,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mb-6 text-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Team Visit Performance & Field Monitoring</h3>
            <p className="text-slate-500 text-[11px]">Real-time customer visit progress across Kerala sales territories</p>
          </div>
        </div>

        {selectedExecutiveId && (
          <button
            onClick={() => onSelectExecutive('All')}
            className="text-[11px] font-bold text-[#2563EB] hover:underline"
          >
            Clear Team Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold border-y border-slate-200 uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Sales Executive</th>
              <th className="py-2.5 px-3 text-center">Today's Visits</th>
              <th className="py-2.5 px-3 text-center">Completed</th>
              <th className="py-2.5 px-3 text-center">In Progress</th>
              <th className="py-2.5 px-3 text-center">Upcoming</th>
              <th className="py-2.5 px-3 text-center">Missed</th>
              <th className="py-2.5 px-3 text-center">Completion Rate</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teamMembers.map((member) => {
              const memberTodayVisits = allVisits.filter(
                (v) => v.assignedToId === member.id && v.visitDate === todayStr
              );
              const totalToday = memberTodayVisits.length;
              const completed = memberTodayVisits.filter((v) => v.status === 'Completed').length;
              const inProgress = memberTodayVisits.filter((v) => v.status === 'In Progress').length;
              const upcoming = memberTodayVisits.filter((v) => v.status === 'Scheduled').length;
              const missed = memberTodayVisits.filter((v) => v.status === 'Missed').length;

              const rate = totalToday > 0 ? Math.round((completed / totalToday) * 100) : 0;
              const isSelected = selectedExecutiveId === member.id;

              return (
                <tr
                  key={member.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    isSelected ? 'bg-blue-50/60 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{member.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {member.role.replace(/_/g, ' ')}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {totalToday}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {completed}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                      {inProgress}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center font-semibold text-sky-700">
                    {upcoming}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {missed > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[11px]">
                        <AlertTriangle className="w-3 h-3" />
                        {missed}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            rate >= 75 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 text-[11px] w-8 text-right">
                        {rate}%
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectExecutive(isSelected ? 'All' : member.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ml-auto ${
                        isSelected
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{isSelected ? 'Viewing' : 'View'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
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

