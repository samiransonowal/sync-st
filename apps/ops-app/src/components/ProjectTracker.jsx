import React from 'react';
import {
  Activity, AlertCircle, ClipboardCopy, Search, BarChart2, Users, Timer, CheckCircle2
} from 'lucide-react';

const ProjectTracker = ({
  projects,
  tasks,
  bookings,
  expandedBillingId,
  setExpandedBillingId,
  billingRates,
  setBillingRates,
  bookingSearchQueries,
  setBookingSearchQueries,
  currentUserProfile,
  PERMISSIONS,
  hasPermission,
  getTaskTotalMinutes,
  formatTime,
  calculateDays,
  showToast,
  linkBookingToProject,
  formatMinutes,
  USERS,
  getUserName,
  getProjectName
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
            <Activity className="mr-3 text-indigo-400" /> Project & Resource Tracker
          </h2>
          <p className="text-slate-400 font-medium text-sm md:text-base">Day-to-day color grading metrics to prevent burnout and spot problematic projects.</p>
        </div>
      </header>

      {/* Project Health / Problematic Matrix (Now First) */}
      <div className="pt-6">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center">
          <AlertCircle className="mr-3 text-indigo-400" size={24} /> Project Health Matrix
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.filter(p => p.status !== 'Completed' && !p.isArchived).map(project => {
            const projTasks = tasks.filter(t => (t.projectId === project.id || (t.title && t.title.toLowerCase().includes(project.name.toLowerCase()))) && !t.isDeleted);
            const prepTime = projTasks.filter(t => t.status === 'Conform' || t.status === 'Assist').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
            const gradeTime = projTasks.filter(t => t.status === 'Grade').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
            const deliveryTime = projTasks.filter(t => t.status === 'Delivery' || t.status === 'Drive Sync').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
            const totalTime = prepTime + gradeTime + deliveryTime;

            const isPrepHeavy = prepTime > 0 && prepTime > (gradeTime * 1.5);
            const isRevisionHeavy = gradeTime > 600;
            const projectDuration = calculateDays(project.createdAt, new Date().toISOString());
            const efficiency = totalTime > 0 ? Math.round((gradeTime / totalTime) * 100) : 0;
            const deliveryTasks = projTasks.filter(t => t.status === 'Delivery' || t.status === 'Drive Sync');

            return (
              <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-6">
                  <div className="pr-4">
                    <h4 className="text-xl md:text-2xl font-black text-white leading-tight mb-1">{project.name}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{project.client}</p>
                    <div className="flex gap-4 mt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                        <span className="text-sm font-bold text-slate-300">{projectDuration} Days</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Delivery</span>
                        <span className={`text-sm font-bold ${deliveryTasks.length > 0 ? 'text-indigo-400' : 'text-slate-500'}`}>
                          {deliveryTasks.length === 0 ? 'Pending' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xl md:text-2xl font-black text-indigo-400">{formatTime(totalTime)}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Time</span>
                    <div className="mt-2 text-right">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Efficiency</span>
                      <span className={`text-xs font-bold ${efficiency > 70 ? 'text-emerald-400' : efficiency > 40 ? 'text-indigo-300' : 'text-amber-400'}`}>{efficiency}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-400 uppercase tracking-widest">Prep (Conform/Assist)</span>
                      <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{formatTime(prepTime)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all duration-500 ${isPrepHeavy ? 'bg-amber-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(100, (prepTime / Math.max(1, totalTime)) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-400 uppercase tracking-widest">Grading</span>
                      <span className="text-white bg-slate-800 px-2 py-0.5 rounded">{formatTime(gradeTime)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full transition-all duration-500 ${isRevisionHeavy ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (gradeTime / Math.max(1, totalTime)) * 100)}%` }}></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {isPrepHeavy && <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-amber-500/20">Messy Conform</span>}
                      {isRevisionHeavy && <span className="bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-red-500/20">High Revisions</span>}
                      {projectDuration > 14 && <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-orange-500/20">Long Project</span>}
                      {!isPrepHeavy && !isRevisionHeavy && totalTime > 0 && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-emerald-500/20">Healthy Pipeline</span>}
                      {totalTime === 0 && <span className="bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-700">Not Started</span>}
                    </div>
                    {totalTime > 0 && (
                      <button
                        onClick={() => setExpandedBillingId(expandedBillingId === project.id ? null : project.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${expandedBillingId === project.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        <ClipboardCopy size={12} />
                        {expandedBillingId === project.id ? 'Hide Billing' : 'Billing Compiler'}
                      </button>
                    )}
                  </div>

                  {expandedBillingId === project.id && (() => {
                    const conformMins = projTasks.filter(t => t.status === 'Conform').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
                    const assistMins = projTasks.filter(t => t.status === 'Assist').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
                    const gradeMins = projTasks.filter(t => t.status === 'Grade').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
                    const deliveryMins = projTasks.filter(t => t.status === 'Delivery' || t.status === 'Drive Sync' || t.status === 'Delivery Sync').reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);

                    const conformHrs = Number((conformMins / 60).toFixed(2));
                    const assistHrs = Number((assistMins / 60).toFixed(2));
                    const gradeHrs = Number((gradeMins / 60).toFixed(2));
                    const deliveryHrs = Number((deliveryMins / 60).toFixed(2));

                    const conformRate = billingRates[`${project.id}-conform`] !== undefined ? billingRates[`${project.id}-conform`] : 75;
                    const assistRate = billingRates[`${project.id}-assist`] !== undefined ? billingRates[`${project.id}-assist`] : 50;
                    const gradeRate = billingRates[`${project.id}-grade`] !== undefined ? billingRates[`${project.id}-grade`] : 150;
                    const deliveryRate = billingRates[`${project.id}-delivery`] !== undefined ? billingRates[`${project.id}-delivery`] : 60;

                    const conformCost = conformHrs * conformRate;
                    const assistCost = assistHrs * assistRate;
                    const gradeCost = gradeHrs * gradeRate;
                    const deliveryCost = deliveryHrs * deliveryRate;
                    const totalCost = conformCost + assistCost + gradeCost + deliveryCost;

                    // Studio Bookings Calculations
                    const projBookings = bookings.filter(b => b.projectId === project.id && !b.isDeleted && !b.isVaulted);
                    let totalBookingMins = 0;
                    projBookings.forEach(b => {
                      if (b.startTime && b.endTime) {
                        const [sH, sM] = b.startTime.split(':').map(Number);
                        const [eH, eM] = b.endTime.split(':').map(Number);
                        totalBookingMins += ((eH * 60 + eM) - (sH * 60 + sM));
                      }
                    });
                    const bookingHrs = Number((totalBookingMins / 60).toFixed(2));
                    const studioRate = billingRates[`${project.id}-studio`] !== undefined ? billingRates[`${project.id}-studio`] : 200;
                    const studioCost = bookingHrs * studioRate;
                    const grandTotalCost = totalCost + studioCost;

                    const copyBillingBrief = () => {
                      const briefText = `💼 BILLING BREAKDOWN BRIEF: ${project.name} (${project.client})\n` +
                        `--------------------------------------------------\n` +
                        `OPERATIONAL TASKS (Pipeline Tracked Time):\n` +
                        `Department   | Time Spent   | Rate/Hr  | Subtotal\n` +
                        `--------------------------------------------------\n` +
                        `Conform      | ${formatTime(conformMins).padEnd(12)} | $${String(conformRate).padEnd(7)} | $${conformCost.toFixed(2)}\n` +
                        `Assist       | ${formatTime(assistMins).padEnd(12)} | $${String(assistRate).padEnd(7)} | $${assistCost.toFixed(2)}\n` +
                        `Grading      | ${formatTime(gradeMins).padEnd(12)} | $${String(gradeRate).padEnd(7)} | $${gradeCost.toFixed(2)}\n` +
                        `Delivery Sync| ${formatTime(deliveryMins).padEnd(12)} | $${String(deliveryRate).padEnd(7)} | $${deliveryCost.toFixed(2)}\n` +
                        `--------------------------------------------------\n` +
                        `Pipeline Subtotal: $${totalCost.toFixed(2)}\n\n` +
                        `STUDIO ROOM BOOKINGS (Physical Studio Space Time):\n` +
                        `Total Time   | Rate/Hr  | Total Cost\n` +
                        `--------------------------------------------------\n` +
                        `${formatTime(totalBookingMins).padEnd(12)} | $${String(studioRate).padEnd(7)} | $${studioCost.toFixed(2)}\n` +
                        `--------------------------------------------------\n` +
                        `GRAND TOTAL BILLING: $${grandTotalCost.toFixed(2)}\n`;

                      navigator.clipboard.writeText(briefText).then(() => {
                        showToast('Invoice brief copied to clipboard!', 'success');
                      });
                    };

                    return (
                      <div className="mt-6 pt-6 border-t border-slate-800 space-y-6 animate-in fade-in duration-300">
                        
                        {/* Department Hours Compiler */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Department Billing Compiler</h5>
                            <button
                              onClick={copyBillingBrief}
                              className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white bg-slate-800 hover:bg-indigo-600 px-2.5 py-1 rounded border border-indigo-500/10 transition-all flex items-center gap-1"
                              title="Copy breakdown invoice brief to clipboard"
                            >
                              <ClipboardCopy size={10} />
                              Copy Invoice Brief
                            </button>
                          </div>

                          <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">
                              ⚙️ Pipeline Tasks
                            </div>
                            
                            {/* Conform Row */}
                            <div className="flex items-center justify-between gap-4 text-xs font-bold border-b border-slate-900 pb-2">
                              <div className="w-1/3">
                                <span className="text-slate-400 block">Conform</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatTime(conformMins)} ({conformHrs}h)</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-1/3 justify-center">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={conformRate}
                                  onChange={(e) => setBillingRates({ ...billingRates, [`${project.id}-conform`]: Number(e.target.value) })}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500">/hr</span>
                              </div>
                              <div className="w-1/3 text-right text-slate-200 font-mono">
                                ${conformCost.toFixed(2)}
                              </div>
                            </div>

                            {/* Assist Row */}
                            <div className="flex items-center justify-between gap-4 text-xs font-bold border-b border-slate-900 pb-2">
                              <div className="w-1/3">
                                <span className="text-slate-400 block">Assist</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatTime(assistMins)} ({assistHrs}h)</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-1/3 justify-center">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={assistRate}
                                  onChange={(e) => setBillingRates({ ...billingRates, [`${project.id}-assist`]: Number(e.target.value) })}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500">/hr</span>
                              </div>
                              <div className="w-1/3 text-right text-slate-200 font-mono">
                                ${assistCost.toFixed(2)}
                              </div>
                            </div>

                            {/* Grading Row */}
                            <div className="flex items-center justify-between gap-4 text-xs font-bold border-b border-slate-900 pb-2">
                              <div className="w-1/3">
                                <span className="text-slate-400 block">Grading</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatTime(gradeMins)} ({gradeHrs}h)</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-1/3 justify-center">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={gradeRate}
                                  onChange={(e) => setBillingRates({ ...billingRates, [`${project.id}-grade`]: Number(e.target.value) })}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500">/hr</span>
                              </div>
                              <div className="w-1/3 text-right text-slate-200 font-mono">
                                ${gradeCost.toFixed(2)}
                              </div>
                            </div>

                            {/* Delivery Sync Row */}
                            <div className="flex items-center justify-between gap-4 text-xs font-bold pb-2">
                              <div className="w-1/3">
                                <span className="text-slate-400 block">Delivery Sync</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatTime(deliveryMins)} ({deliveryHrs}h)</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-1/3 justify-center">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={deliveryRate}
                                  onChange={(e) => setBillingRates({ ...billingRates, [`${project.id}-delivery`]: Number(e.target.value) })}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500">/hr</span>
                              </div>
                              <div className="w-1/3 text-right text-slate-200 font-mono">
                                ${deliveryCost.toFixed(2)}
                              </div>
                            </div>

                            <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest border-t border-slate-900 pt-3 pb-1.5 flex items-center justify-between">
                              <span>🎬 Physical Studio Bookings</span>
                              <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[8px] font-bold border border-rose-500/20">{projBookings.length} Linked</span>
                            </div>

                            {/* Studio Booking Row */}
                            <div className="flex items-center justify-between gap-4 text-xs font-bold pb-1">
                              <div className="w-1/3">
                                <span className="text-slate-400 block">Studio Room Hours</span>
                                <span className="text-[10px] text-slate-500 font-mono">{formatTime(totalBookingMins)} ({bookingHrs}h)</span>
                              </div>
                              <div className="flex items-center gap-1.5 w-1/3 justify-center">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={studioRate}
                                  onChange={(e) => setBillingRates({ ...billingRates, [`${project.id}-studio`]: Number(e.target.value) })}
                                  className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                                />
                                <span className="text-[10px] text-slate-500">/hr</span>
                              </div>
                              <div className="w-1/3 text-right text-slate-200 font-mono">
                                ${studioCost.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total Summary Row */}
                        <div className="flex items-center justify-between p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Grand Total Project Billing</span>
                            <p className="text-xs text-slate-400 font-bold mt-0.5">Pipeline Tasks + Studio Bookings</p>
                          </div>
                          <div className="text-xl md:text-2xl font-black text-white font-mono">
                            ${grandTotalCost.toFixed(2)}
                          </div>
                        </div>

                        {/* Past Bookings Linker & Search Engine */}
                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Past Bookings Linker</h5>
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                              Relational Mapping
                            </span>
                          </div>
                          
                          {/* Suggested Matches Section */}
                          {(() => {
                            const suggestedBookings = bookings.filter(b => 
                              !b.isDeleted && 
                              (!b.projectId || b.projectId === 'general') && 
                              b.project && 
                              (b.project.toLowerCase().includes(project.name.toLowerCase()) || 
                               b.project.toLowerCase().includes(project.code.toLowerCase()) ||
                               (b.projectCode && b.projectCode.toLowerCase() === project.code.toLowerCase()))
                            );
                            
                            if (suggestedBookings.length === 0) return null;
                            
                            return (
                              <div className="space-y-2 bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/10">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">💡 Suggested Past Matches</span>
                                <div className="max-h-36 overflow-y-auto space-y-2 custom-scrollbar">
                                  {suggestedBookings.map(b => (
                                    <div key={b.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs">
                                      <div>
                                        <p className="font-bold text-white">{b.project}</p>
                                        <p className="text-[10px] text-slate-500">{b.date} | {b.startTime} - {b.endTime} | {b.studio}</p>
                                      </div>
                                      <button
                                        onClick={() => linkBookingToProject(b.id, project.id, project.code, project.name)}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                      >
                                        Link
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Manual Search Section */}
                          <div className="space-y-3">
                            <div className="relative group">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                              <input
                                type="text"
                                placeholder="Search past bookings by name, client, date or colorist..."
                                value={bookingSearchQueries[project.id] || ''}
                                onChange={(e) => setBookingSearchQueries({
                                  ...bookingSearchQueries,
                                  [project.id]: e.target.value
                                })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 transition-all font-medium"
                              />
                            </div>
                            
                            {/* Search Results */}
                            {(() => {
                              const queryText = (bookingSearchQueries[project.id] || '').trim().toLowerCase();
                              if (!queryText) return null;
                              
                              const filteredBookings = bookings.filter(b => 
                                !b.isDeleted && 
                                b.projectId !== project.id && // Don't show bookings already linked to THIS project
                                (
                                  (b.project && b.project.toLowerCase().includes(queryText)) ||
                                  (b.client && b.client.toLowerCase().includes(queryText)) ||
                                  (b.date && b.date.toLowerCase().includes(queryText)) ||
                                  (b.colorist && b.colorist.toLowerCase().includes(queryText)) ||
                                  (b.studio && b.studio.toLowerCase().includes(queryText)) ||
                                  (b.projectCode && b.projectCode.toLowerCase().includes(queryText))
                                )
                              ).slice(0, 5); // Limit to top 5 results for clean UI
                              
                              return (
                                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Search Results ({filteredBookings.length})</span>
                                  {filteredBookings.length === 0 ? (
                                    <p className="text-[11px] text-slate-600 italic p-1">No matching bookings found.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {filteredBookings.map(b => (
                                        <div key={b.id} className="flex justify-between items-center bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-xs hover:border-slate-700 hover:bg-slate-900 transition-colors">
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-bold text-white">{b.project || 'Untitled'}</span>
                                              {b.projectCode && <span className="bg-slate-800 text-slate-400 font-mono text-[9px] px-1 rounded">[{b.projectCode}]</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{b.date} | {b.startTime} - {b.endTime} | {b.studio} | {b.colorist || 'No Colorist'}</p>
                                          </div>
                                          <button
                                            onClick={() => linkBookingToProject(b.id, project.id, project.code, project.name)}
                                            className="px-2.5 py-1 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                                          >
                                            Link to Project
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
          {projects.filter(p => p.status !== 'Completed' && !p.isArchived).length === 0 && (
            <div className="col-span-full text-center p-12 bg-slate-800/20 rounded-3xl border border-slate-800 border-dashed">
              <Activity size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400 font-medium text-lg">No active projects to track.</p>
              <p className="text-slate-500 text-sm mt-1">Metrics will generate once bookings are active.</p>
            </div>
          )}
        </div>
      </div>

      {/* Resource Allocation Matrix (Now Second) */}
      <div className="pt-6">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center">
          <BarChart2 className="mr-3 text-indigo-400" size={24} /> Resource Allocation Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {USERS.filter(u => !u.isArchived).map(u => {
            const userTasks = tasks.filter(t => t.assigneeId === u.id && t.status !== 'Delivered' && !t.isDeleted);
            const userTotalTime = userTasks.reduce((acc, t) => acc + getTaskTotalMinutes(t), 0);
            const isOverburdened = userTasks.length >= 4 || userTotalTime > 600;

            return (
              <div key={u.id} className={`bg-slate-900 border-2 rounded-3xl p-6 transition-all shadow-xl ${isOverburdened ? 'border-red-500/50 shadow-red-500/10' : 'border-slate-800'}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-lg">{u.name.charAt(0)}</div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{u.name}</h4>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.role}</p>
                    </div>
                  </div>
                  {isOverburdened && <span className="bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center"><AlertCircle size={12} className="mr-1.5" /> High Load</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                    <p className={`text-3xl font-black ${isOverburdened && userTasks.length >= 4 ? 'text-red-400' : 'text-white'}`}>{userTasks.length}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Queue</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 text-center">
                    <p className={`text-3xl font-black ${isOverburdened && userTotalTime > 600 ? 'text-red-400' : 'text-indigo-400'}`}>{formatTime(userTotalTime)}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Time Logged</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectTracker;
