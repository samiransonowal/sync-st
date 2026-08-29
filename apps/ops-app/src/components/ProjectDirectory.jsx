import React, { useState } from 'react';
import {
  FolderOpen, Search, LayoutGrid, List, Plus, Archive, RefreshCw, Film, Edit,
  Activity, AlertCircle, ClipboardCopy, BarChart2, Users, Timer, CheckCircle2,
  DollarSign, Link2, ExternalLink, Lock, Unlock, Check
} from 'lucide-react';

const ProjectDirectory = ({
  projects = [],
  bookings = [],
  tasks = [],
  projectSearchQuery = '',
  setProjectSearchQuery,
  projectViewMode = 'grid',
  setProjectViewMode,
  setShowAddProjectModal,
  showArchivedProjects = false,
  setShowArchivedProjects,
  currentUserProfile,
  PERMISSIONS,
  hasPermission,
  toggleLongFormatProject,
  toggleArchiveProject,
  toggleCloseProject,
  syncToGoogleSheets,
  showToast,
  setShowEditProjectModal,
  formatMinutes,
  formatTime,
  getTaskTotalMinutes,
  calculateDays,
  expandedBillingId,
  setExpandedBillingId,
  billingRates = {},
  setBillingRates,
  bookingSearchQueries = {},
  setBookingSearchQueries,
  linkBookingToProject,
  USERS = [],
  getUserName,
  getProjectName
}) => {
  const [activeViewTab, setActiveViewTab] = useState('directory'); // 'directory' | 'closed' | 'health' | 'billing' | 'linker'

  // Filter Active vs Closed Projects
  const activeProjects = projects.filter(p => !p.isClosed && p.status !== 'Closed');
  const closedProjects = projects.filter(p => p.isClosed || p.status === 'Closed');

  const query = (projectSearchQuery || '').toLowerCase();

  const filterList = (list) => {
    return list
      .filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(query) ||
          (p.client && p.client.toLowerCase().includes(query)) ||
          (p.code && p.code.toLowerCase().includes(query)) ||
          (p.director && p.director.toLowerCase().includes(query));
        const matchesArchive = showArchivedProjects ? p.isArchived : !p.isArchived;
        return matchesSearch && matchesArchive;
      })
      .sort((a, b) => new Date(b.closedAt || b.createdAt || 0) - new Date(a.closedAt || a.createdAt || 0));
  };

  const displayedActiveProjects = filterList(activeProjects);
  const displayedClosedProjects = filterList(closedProjects);

  // Find unlinked bookings
  const unlinkedBookings = (bookings || []).filter(b => !b.projectId && !b.isDeleted && !b.isVaulted);

  // Helper to compute bill total for a project
  const calculateProjectCost = (project) => {
    const projTasks = (tasks || []).filter(t => (t.projectId === project.id || (t.title && t.title.toLowerCase().includes(project.name.toLowerCase()))) && !t.isDeleted);
    const conformMins = projTasks.filter(t => t.status === 'Conform').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : 0), 0);
    const assistMins = projTasks.filter(t => t.status === 'Assist').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : 0), 0);
    const gradeMins = projTasks.filter(t => t.status === 'Grade').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : 0), 0);
    const deliveryMins = projTasks.filter(t => t.status === 'Delivery' || t.status === 'Drive Sync' || t.status === 'Delivery Sync').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : 0), 0);

    const conformHrs = Number((conformMins / 60).toFixed(2));
    const assistHrs = Number((assistMins / 60).toFixed(2));
    const gradeHrs = Number((gradeMins / 60).toFixed(2));
    const deliveryHrs = Number((deliveryMins / 60).toFixed(2));

    const conformRate = billingRates[`${project.id}-conform`] !== undefined ? billingRates[`${project.id}-conform`] : 2500;
    const assistRate = billingRates[`${project.id}-assist`] !== undefined ? billingRates[`${project.id}-assist`] : 1500;
    const gradeRate = billingRates[`${project.id}-grade`] !== undefined ? billingRates[`${project.id}-grade`] : 5000;
    const deliveryRate = billingRates[`${project.id}-delivery`] !== undefined ? billingRates[`${project.id}-delivery`] : 2000;

    const totalCost = (conformHrs * conformRate) + (assistHrs * assistRate) + (gradeHrs * gradeRate) + (deliveryHrs * deliveryRate);
    const totalMinutes = conformMins + assistMins + gradeMins + deliveryMins;

    return {
      conformMins, assistMins, gradeMins, deliveryMins,
      conformHrs, assistHrs, gradeHrs, deliveryHrs,
      conformRate, assistRate, gradeRate, deliveryRate,
      totalCost, totalMinutes
    };
  };

  const copyInvoiceBrief = (project) => {
    const cost = calculateProjectCost(project);
    const briefText = `💼 INVOICE BREAKDOWN BRIEF: ${project.name} (${project.client || 'Client'})\n` +
      `Project Code: ${project.code || 'N/A'}\n` +
      `--------------------------------------------------\n` +
      `Department   | Time Spent   | Rate (INR) | Subtotal\n` +
      `--------------------------------------------------\n` +
      `Conform      | ${formatTime ? formatTime(cost.conformMins).padEnd(12) : `${cost.conformHrs}h`} | ₹${String(cost.conformRate).padEnd(8)} | ₹${(cost.conformHrs * cost.conformRate).toFixed(2)}\n` +
      `Assist       | ${formatTime ? formatTime(cost.assistMins).padEnd(12) : `${cost.assistHrs}h`} | ₹${String(cost.assistRate).padEnd(8)} | ₹${(cost.assistHrs * cost.assistRate).toFixed(2)}\n` +
      `Grade        | ${formatTime ? formatTime(cost.gradeMins).padEnd(12) : `${cost.gradeHrs}h`} | ₹${String(cost.gradeRate).padEnd(8)} | ₹${(cost.gradeHrs * cost.gradeRate).toFixed(2)}\n` +
      `Delivery     | ${formatTime ? formatTime(cost.deliveryMins).padEnd(12) : `${cost.deliveryHrs}h`} | ₹${String(cost.deliveryRate).padEnd(8)} | ₹${(cost.deliveryHrs * cost.deliveryRate).toFixed(2)}\n` +
      `--------------------------------------------------\n` +
      `GRAND TOTAL: ₹${cost.totalCost.toFixed(2)}\n`;

    navigator.clipboard.writeText(briefText).then(() => {
      showToast && showToast('Invoice brief copied to clipboard!', 'success');
    });
  };

  const handleDispatchBillAndClose = (project) => {
    copyInvoiceBrief(project);
    if (toggleCloseProject) {
      toggleCloseProject(project.id, false);
      showToast && showToast(`📋 Bill dispatched & ${project.name} moved to Closed Projects!`, 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
      {/* HEADER WITH INTEGRATED VIEW SWITCHER */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 shrink-0 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <FolderOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">Project Directory & Operations Tracker</h2>
              <p className="text-slate-400 font-medium text-sm mt-0.5">Central hub for master catalogs, labor metrics, department billing, and booking reconciliation.</p>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex items-center gap-2 mt-6 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit flex-wrap">
            <button
              onClick={() => setActiveViewTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeViewTab === 'directory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen size={14} /> Active Directory ({displayedActiveProjects.length})
            </button>
            <button
              onClick={() => setActiveViewTab('closed')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeViewTab === 'closed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock size={14} /> Closed & Billed ({displayedClosedProjects.length})
            </button>
            <button
              onClick={() => setActiveViewTab('health')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeViewTab === 'health' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity size={14} /> Health & Labor Matrix
            </button>
            <button
              onClick={() => setActiveViewTab('billing')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeViewTab === 'billing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign size={14} /> Department Billing
            </button>
            <button
              onClick={() => setActiveViewTab('linker')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeViewTab === 'linker' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link2 size={14} /> Booking Linker
              {unlinkedBookings.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black">
                  {unlinkedBookings.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {(activeViewTab === 'directory' || activeViewTab === 'closed') && (
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mr-2">
              <button 
                onClick={() => setProjectViewMode('grid')} 
                className={`p-2 rounded-lg transition-all ${projectViewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} 
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setProjectViewMode('sheet')} 
                className={`p-2 rounded-lg transition-all ${projectViewMode === 'sheet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`} 
                title="Sheet View"
              >
                <List size={18} />
              </button>
            </div>
          )}

          {setShowAddProjectModal && (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} className="mr-1.5" /> ADD NEW PROJECT
            </button>
          )}

          {setShowArchivedProjects && (
            <button
              onClick={() => setShowArchivedProjects(!showArchivedProjects)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center ${
                showArchivedProjects ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Archive size={14} className="mr-1.5" />
              {showArchivedProjects ? 'ACTIVE PROJECTS' : 'ARCHIVE'}
            </button>
          )}

          <button
            onClick={() => {
              const projectsWithMetrics = projects.map(project => {
                const projectBookings = (bookings || []).filter(b => b.projectId === project.id || (b.project && b.project.toLowerCase() === project.name.toLowerCase()));
                let totalBookedMinutes = 0;
                projectBookings.forEach(b => {
                  if (b.startTime && b.endTime) {
                    const [sH, sM] = b.startTime.split(':').map(Number);
                    const [eH, eM] = b.endTime.split(':').map(Number);
                    totalBookedMinutes += ((eH * 60 + eM) - (sH * 60 + sM));
                  }
                });

                const projectTasks = (tasks || []).filter(t => t.projectId === project.id && !t.isDeleted);
                const totalTaskMinutes = projectTasks.reduce((acc, t) => acc + (t.totalActiveMinutes || 0), 0);

                return {
                  ...project,
                  totalBookingTime: formatMinutes ? formatMinutes(totalBookedMinutes) : `${totalBookedMinutes}m`,
                  totalTaskTime: formatMinutes ? formatMinutes(totalTaskMinutes) : `${totalTaskMinutes}m`
                };
              });

              if (syncToGoogleSheets) {
                syncToGoogleSheets('bulk', projectsWithMetrics);
                showToast && showToast('Projects synced to Google Sheets!', 'success');
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center shadow-lg"
            title="Sync all projects with durations to Google Sheets"
          >
            <RefreshCw size={14} className="mr-1.5" /> SYNC TO SHEETS
          </button>
        </div>
      </header>

      {/* SEARCH BAR (For Directory, Closed, Health, & Billing) */}
      {(activeViewTab === 'directory' || activeViewTab === 'closed' || activeViewTab === 'health' || activeViewTab === 'billing') && (
        <div className="relative group max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder={activeViewTab === 'closed' ? "Search closed projects by name, code, or client..." : "Search by project name, project code, or production house..."}
            value={projectSearchQuery}
            onChange={(e) => setProjectSearchQuery && setProjectSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border-2 border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm shadow-inner"
          />
        </div>
      )}

      {/* TAB 1: ACTIVE CATALOG DIRECTORY */}
      {activeViewTab === 'directory' && (
        <div>
          {displayedActiveProjects.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-slate-800">
              <FolderOpen size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-bold text-lg">No active projects found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search query, check Closed Projects, or add a new project.</p>
            </div>
          ) : projectViewMode === 'sheet' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4 pl-6">Project Code</th>
                      <th className="p-4">Project Name</th>
                      <th className="p-4">Client / Production House</th>
                      <th className="p-4">Director / DOP</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Booked Time</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {displayedActiveProjects.map(project => {
                      const projectBookings = (bookings || []).filter(b => b.projectId === project.id || (b.project && b.project.toLowerCase() === project.name.toLowerCase()));
                      let totalBookedMinutes = 0;
                      projectBookings.forEach(b => {
                        if (b.startTime && b.endTime) {
                          const [sH, sM] = b.startTime.split(':').map(Number);
                          const [eH, eM] = b.endTime.split(':').map(Number);
                          totalBookedMinutes += ((eH * 60 + eM) - (sH * 60 + sM));
                        }
                      });

                      return (
                        <tr key={project.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-black rounded-lg border border-indigo-500/20">
                              {project.code || '—'}
                            </span>
                          </td>
                          <td className="p-4 font-black text-white text-sm">
                            {project.name}
                          </td>
                          <td className="p-4 text-slate-300 font-medium">{project.client || '—'}</td>
                          <td className="p-4 text-slate-400">{project.director ? `Dir: ${project.director}` : ''}{project.dop ? ` | DOP: ${project.dop}` : '—'}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {project.status || 'Active'}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-300">{formatTime ? formatTime(totalBookedMinutes) : `${totalBookedMinutes}m`}</td>
                          <td className="p-4 pr-6 text-right space-x-1.5">
                            {toggleCloseProject && (
                              <button 
                                onClick={() => handleDispatchBillAndClose(project)} 
                                className="text-slate-400 hover:text-emerald-400 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Dispatch Bill & Close Project"
                              >
                                <Lock size={14} />
                              </button>
                            )}
                            {setShowEditProjectModal && (
                              <button 
                                onClick={() => setShowEditProjectModal(project)} 
                                className="text-slate-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Edit Project"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {toggleArchiveProject && (
                              <button 
                                onClick={() => toggleArchiveProject(project.id, project.isArchived)} 
                                className="text-slate-400 hover:text-amber-400 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Archive Project"
                              >
                                <Archive size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedActiveProjects.map(project => {
                const projectBookings = (bookings || []).filter(b => b.projectId === project.id || (b.project && b.project.toLowerCase() === project.name.toLowerCase()));
                let totalBookedMinutes = 0;
                projectBookings.forEach(b => {
                  if (b.startTime && b.endTime) {
                    const [sH, sM] = b.startTime.split(':').map(Number);
                    const [eH, eM] = b.endTime.split(':').map(Number);
                    totalBookedMinutes += ((eH * 60 + eM) - (sH * 60 + sM));
                  }
                });

                return (
                  <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                        <div>
                          {project.code && (
                            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-black rounded-lg border border-indigo-500/20 mb-2 inline-block">
                              {project.code}
                            </span>
                          )}
                          <h3 className="text-lg font-black text-white leading-tight">{project.name}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{project.client || 'General Client'}</p>
                        </div>
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {project.status || 'Active'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-400 mb-6">
                        {project.director && <p><span className="font-bold text-slate-500">Director:</span> {project.director}</p>}
                        {project.dop && <p><span className="font-bold text-slate-500">DOP:</span> {project.dop}</p>}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 font-mono">
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-sans">Booked Hours:</span>
                          <span className="font-bold text-indigo-300">{formatTime ? formatTime(totalBookedMinutes) : `${totalBookedMinutes}m`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-800">
                      {toggleCloseProject && (
                        <button
                          onClick={() => handleDispatchBillAndClose(project)}
                          className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center"
                        >
                          <Lock size={12} className="mr-1.5" /> DISPATCH & CLOSE
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        {setShowEditProjectModal && (
                          <button onClick={() => setShowEditProjectModal(project)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors" title="Edit">
                            <Edit size={14} />
                          </button>
                        )}
                        {toggleArchiveProject && (
                          <button onClick={() => toggleArchiveProject(project.id, project.isArchived)} className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors" title="Archive">
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLOSED & BILLED PROJECTS PAGE */}
      {activeViewTab === 'closed' && (
        <div className="space-y-6">
          {displayedClosedProjects.length === 0 ? (
            <div className="text-center p-12 bg-slate-900/50 rounded-3xl border border-slate-800">
              <Lock size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-bold text-lg">No closed projects yet</p>
              <p className="text-slate-500 text-sm mt-1">When a project is completed and its invoice is dispatched, click "Dispatch & Close" to move it here.</p>
            </div>
          ) : projectViewMode === 'sheet' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="p-4 pl-6">Project Code</th>
                      <th className="p-4">Project Name</th>
                      <th className="p-4">Client / Production House</th>
                      <th className="p-4">Billing Status</th>
                      <th className="p-4">Total Labor</th>
                      <th className="p-4">Total Billed (INR)</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {displayedClosedProjects.map(project => {
                      const cost = calculateProjectCost(project);
                      return (
                        <tr key={project.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-black rounded-lg border border-emerald-500/20">
                              {project.code || '—'}
                            </span>
                          </td>
                          <td className="p-4 font-black text-white text-sm">
                            {project.name}
                          </td>
                          <td className="p-4 text-slate-300 font-medium">{project.client || '—'}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              🔒 Bill Dispatched
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-indigo-300">{formatTime ? formatTime(cost.totalMinutes) : `${cost.totalMinutes}m`}</td>
                          <td className="p-4 font-mono font-black text-emerald-400">₹{cost.totalCost.toLocaleString('en-IN')}</td>
                          <td className="p-4 pr-6 text-right space-x-1.5">
                            <button
                              onClick={() => copyInvoiceBrief(project)}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-[10px] font-black tracking-wider transition-all inline-flex items-center"
                              title="Copy Invoice Breakdown"
                            >
                              <ClipboardCopy size={12} className="mr-1" /> BRIEF
                            </button>
                            {toggleCloseProject && (
                              <button
                                onClick={() => toggleCloseProject(project.id, true)}
                                className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Re-open to Active Directory"
                              >
                                <Unlock size={14} />
                              </button>
                            )}
                            {setShowEditProjectModal && (
                              <button 
                                onClick={() => setShowEditProjectModal(project)} 
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
                                title="Edit Project"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedClosedProjects.map(project => {
                const cost = calculateProjectCost(project);
                return (
                  <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between border-l-4 border-l-emerald-500">
                    <div>
                      <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                        <div>
                          {project.code && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-black rounded-lg border border-emerald-500/20 mb-2 inline-block">
                              {project.code}
                            </span>
                          )}
                          <h3 className="text-lg font-black text-white leading-tight">{project.name}</h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{project.client || 'Client'}</p>
                        </div>
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🔒 Closed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Labor</p>
                          <p className="text-sm font-bold text-white font-mono">{formatTime ? formatTime(cost.totalMinutes) : `${cost.totalMinutes}m`}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Final Bill (INR)</p>
                          <p className="text-sm font-black text-emerald-400 font-mono">₹{cost.totalCost.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => copyInvoiceBrief(project)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center shadow-lg shadow-indigo-600/20"
                      >
                        <ClipboardCopy size={12} className="mr-1.5" /> COPY INVOICE
                      </button>

                      {toggleCloseProject && (
                        <button
                          onClick={() => toggleCloseProject(project.id, true)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition-all flex items-center"
                          title="Re-open to Active Directory"
                        >
                          <Unlock size={12} className="mr-1.5 text-amber-400" /> REOPEN
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HEALTH & LABOR MATRIX */}
      {activeViewTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedActiveProjects.map(project => {
              const projTasks = (tasks || []).filter(t => (t.projectId === project.id || (t.title && t.title.toLowerCase().includes(project.name.toLowerCase()))) && !t.isDeleted);
              const prepTime = projTasks.filter(t => t.status === 'Conform' || t.status === 'Assist').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : (t.totalActiveMinutes || 0)), 0);
              const gradeTime = projTasks.filter(t => t.status === 'Grade').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : (t.totalActiveMinutes || 0)), 0);
              const deliveryTime = projTasks.filter(t => t.status === 'Delivery' || t.status === 'Drive Sync' || t.status === 'Delivery Sync').reduce((acc, t) => acc + (getTaskTotalMinutes ? getTaskTotalMinutes(t) : (t.totalActiveMinutes || 0)), 0);
              const totalTime = prepTime + gradeTime + deliveryTime;

              const isPrepHeavy = prepTime > 0 && prepTime > (gradeTime * 1.5);
              const isRevisionHeavy = gradeTime > 600;
              const efficiency = totalTime > 0 ? Math.round((gradeTime / totalTime) * 100) : 0;

              return (
                <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                      <div>
                        {project.code && (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-black rounded border border-indigo-500/20 mb-1 inline-block">
                            {project.code}
                          </span>
                        )}
                        <h4 className="text-xl font-black text-white leading-tight">{project.name}</h4>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{project.client || 'General Client'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-400">{formatTime ? formatTime(totalTime) : `${totalTime}m`}</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Labor</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Prep (Conform & Assist)</span>
                          <span className="text-white font-mono">{formatTime ? formatTime(prepTime) : `${prepTime}m`}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-2.5 rounded-full ${isPrepHeavy ? 'bg-amber-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(100, (prepTime / Math.max(1, totalTime)) * 100)}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Color Grading</span>
                          <span className="text-white font-mono">{formatTime ? formatTime(gradeTime) : `${gradeTime}m`}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-2.5 rounded-full ${isRevisionHeavy ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (gradeTime / Math.max(1, totalTime)) * 100)}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-400 uppercase tracking-widest text-[10px]">Delivery Sync</span>
                          <span className="text-white font-mono">{formatTime ? formatTime(deliveryTime) : `${deliveryTime}m`}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (deliveryTime / Math.max(1, totalTime)) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-6 mt-6 border-t border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPrepHeavy && <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-amber-500/20">Heavy Conform</span>}
                      {isRevisionHeavy && <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-red-500/20">High Revisions</span>}
                      {!isPrepHeavy && !isRevisionHeavy && totalTime > 0 && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-500/20">Optimal Flow</span>}
                    </div>
                    <span className="text-xs font-black text-indigo-400">{efficiency}% Efficiency</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DEPARTMENT BILLING */}
      {activeViewTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {displayedActiveProjects.map(project => {
              const cost = calculateProjectCost(project);
              return (
                <div key={project.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                    <div>
                      {project.code && (
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-mono font-black rounded-lg border border-indigo-500/20 mb-2 inline-block">
                          {project.code}
                        </span>
                      )}
                      <h4 className="text-xl font-black text-white">{project.name}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{project.client || 'Client'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl font-black text-emerald-400">₹{cost.totalCost.toLocaleString('en-IN')}</span>
                      <button
                        onClick={() => copyInvoiceBrief(project)}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center border border-slate-700"
                      >
                        <ClipboardCopy size={14} className="mr-1.5" /> COPY BRIEF
                      </button>
                      {toggleCloseProject && (
                        <button
                          onClick={() => handleDispatchBillAndClose(project)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wider transition-all flex items-center shadow-lg shadow-emerald-600/20"
                        >
                          <Lock size={14} className="mr-1.5" /> DISPATCH BILL & CLOSE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Conform Labor</span>
                      <span className="text-sm font-black text-white font-mono">{cost.conformHrs} hrs</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">@ ₹{cost.conformRate}/hr</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Assist Labor</span>
                      <span className="text-sm font-black text-white font-mono">{cost.assistHrs} hrs</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">@ ₹{cost.assistRate}/hr</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Color Grading</span>
                      <span className="text-sm font-black text-white font-mono">{cost.gradeHrs} hrs</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">@ ₹{cost.gradeRate}/hr</span>
                    </div>
                    <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Delivery Sync</span>
                      <span className="text-sm font-black text-white font-mono">{cost.deliveryHrs} hrs</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">@ ₹{cost.deliveryRate}/hr</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BOOKING LINKER */}
      {activeViewTab === 'linker' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center">
              <Link2 size={20} className="mr-2 text-indigo-400" /> Unlinked Studio Bookings
            </h3>
            <p className="text-slate-400 text-xs mb-6">These booking sessions were created with custom titles and are not yet linked to an official project in your directory.</p>

            {unlinkedBookings.length === 0 ? (
              <div className="text-center p-8 bg-slate-950/50 rounded-2xl border border-slate-800">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-white font-bold">All bookings are linked to official projects!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unlinkedBookings.map(b => (
                  <div key={b.id} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold text-sm">{b.project || b.projectName}</h4>
                      <p className="text-xs text-slate-400">{b.studio} | {b.date} ({b.startTime} - {b.endTime})</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        onChange={(e) => {
                          const p = projects.find(proj => proj.id === e.target.value);
                          if (p && linkBookingToProject) {
                            linkBookingToProject(b.id, p.id, p.code || '', p.name);
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
                        defaultValue=""
                      >
                        <option value="" disabled>Link to Project...</option>
                        {projects.filter(p => !p.isArchived && !p.isClosed && p.status !== 'Closed').map(p => (
                          <option key={p.id} value={p.id}>{p.code ? `[${p.code}] ` : ''}{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDirectory;
