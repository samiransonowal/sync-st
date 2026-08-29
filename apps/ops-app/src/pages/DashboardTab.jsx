import React from 'react';
import { AlertCircle, CheckCircle2, Users, UserCircle, Briefcase, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PERMISSIONS, hasPermission } from '../components/users';

export default function DashboardTab({
  USERS,
  isUserClockedIn,
  getProjectName,
  getUserName,
  getRecommendedRole,
  setShowAssignModal,
  handleForceFinishTask
}) {
  const { tasks, currentUserProfile } = useApp();

  if (!hasPermission(currentUserProfile, PERMISSIONS.VIEW_DASHBOARD)) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="section-title">Control Center</h2>
        <p className="section-subtitle">Real-time pipeline status and staff allocation.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Tasks',    val: tasks.filter(t => t.status !== 'Delivered' && !t.isDeleted).length, color: 'text-warn',   icon: AlertCircle },
          { label: 'Delivered',       val: tasks.filter(t => t.status === 'Delivered' && !t.isDeleted).length, color: 'text-accent',  icon: CheckCircle2 },
          { label: 'Staff Online',    val: USERS.filter(u => isUserClockedIn(u.id)).length,                    color: 'text-online',  icon: Users },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className={`stat-value ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1rem' }}>Unassigned Pipeline Tasks</h3>
        <div style={{ minWidth: '420px' }}>
          {tasks.filter(t => !t.assigneeId && t.status !== 'Delivered' && !t.isDeleted).length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem', borderRadius: 'var(--r-lg)' }}>
              <span className="empty-state-text">All active tasks are currently assigned.</span>
            </div>
          ) : (
            tasks.filter(t => !t.assigneeId && t.status !== 'Delivered' && !t.isDeleted).map(task => (
              <div key={task.id} className="flex items-center justify-between p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 mt-1 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-1 uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Awaiting Phase: {task.status}</p>
                    <h5 className="text-xs font-bold text-slate-300 mb-3">{task.title}</h5>
                    <div className="flex gap-4 text-[9px] text-slate-400 mb-3">
                      <span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown'}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-black/40 px-3 py-2 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-1.5 border-r border-slate-700/50 pr-3">
                        <UserCircle size={12} className="text-slate-500" />
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Last Worked By</p>
                          <p className="text-[10px] font-bold text-slate-300 leading-none">{task.lastAssigneeId ? getUserName(task.lastAssigneeId) : '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={12} className="text-indigo-400" />
                        <div>
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Recommend Role</p>
                          <p className="text-[10px] font-bold text-slate-300 leading-none">{getRecommendedRole(task.status)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowAssignModal(task)}
                    className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl text-xs font-black tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                  >
                    ASSIGN STAFF
                  </button>
                  <button
                    onClick={() => handleForceFinishTask(task.id)}
                    className="px-6 py-2 bg-slate-800 text-slate-400 hover:bg-red-900/20 hover:text-red-400 border border-slate-700 rounded-xl text-[9px] font-black tracking-widest transition-all"
                  >
                    FORCE FINISH
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 overflow-x-auto">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Timer className="text-amber-500" size={20} /> Stale Active Tasks (from previous days)
        </h3>
        <div className="space-y-4 min-w-[500px]">
          {tasks.filter(t => t.assigneeId && t.status !== 'Delivered' && !t.isDeleted && t.createdAt?.slice(0, 10) < new Date().toISOString().slice(0, 10)).length === 0 ? (
            <p className="text-slate-500 italic">No stale tasks from previous days.</p>
          ) : (
            tasks.filter(t => t.assigneeId && t.status !== 'Delivered' && !t.isDeleted && t.createdAt?.slice(0, 10) < new Date().toISOString().slice(0, 10)).map(task => (
              <div key={task.id} className="flex items-center justify-between p-6 bg-slate-800/20 rounded-2xl border border-slate-700/30">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 border border-slate-700">
                    <Timer size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm mb-0.5 uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Current Phase: {task.status}</p>
                    <h5 className="text-xs font-bold text-slate-200 mb-2">{task.title}</h5>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          Created: {task.createdAt ? new Date(task.createdAt).toLocaleString([], { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '') : '—'}
                      </span>
                      <span className="text-[9px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
                        ASSIGNED TO: {getUserName(task.assigneeId)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleForceFinishTask(task.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-xl text-[10px] font-black tracking-widest transition-all"
                  >
                    <CheckCircle2 size={16} /> FORCE FINISH
                  </button>
                  <button
                    onClick={() => setShowAssignModal(task)}
                    className="px-6 py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-[10px] font-black tracking-widest transition-all border border-slate-700"
                  >
                    REASSIGN
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
