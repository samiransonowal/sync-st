import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Play, Users, UserCircle, 
  Briefcase, Copy, ArrowRight, ArrowLeftRight, FolderOpen, 
  ExternalLink, Timer, Sparkles, Plus, Check
} from 'lucide-react';
import { 
  isColorist, isAssist, isConformist, isLineProducer, 
  getSelfAndPredecessorIds, ROLES 
} from '../components/users';
import TeamNotepad from '../components/TeamNotepad';

const studioColors = {
  'Studio 01': { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/30', pill: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  'Studio 02': { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  'Studio 03': { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', pill: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  'Studio 04': { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', pill: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
};

export default function DashboardTab({
  currentUserProfile,
  bookings = [],
  projects = [],
  tasks = [],
  USERS = [],
  isUserClockedIn,
  getProjectName,
  getUserName,
  getRecommendedRole,
  setShowAssignModal,
  handleForceFinishTask,
  commenceTask,
  requestStageAdvance,
  assignTask,
  setActiveTab,
  formatLocalDate,
  formatTime,
  getTaskTotalMinutes,
  showToast,
  db,
  appId,
  notepads = {},
  setNotepads,
  waTemplates = []
}) {
  const today = formatLocalDate ? formatLocalDate(new Date()) : new Date().toISOString().slice(0, 10);
  const myUserIds = useMemo(() => getSelfAndPredecessorIds(currentUserProfile), [currentUserProfile]);

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Role categorization
  const userIsColorist = isColorist(currentUserProfile);
  const userIsAssist = isAssist(currentUserProfile);
  const userIsConformist = isConformist(currentUserProfile);
  const userIsLP = isLineProducer(currentUserProfile);

  // Active bookings filter
  const activeBookings = useMemo(() => 
    bookings.filter(b => !b.isDeleted && !b.isVaulted), 
    [bookings]
  );

  // Filter tasks (not delivered, not deleted)
  const activeTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'Delivered' && !t.isDeleted), 
    [tasks]
  );

  // View state for Colorists: 'today' vs 'upcoming'
  const [coloristViewMode, setColoristViewMode] = useState('today');

  // Copy Brief handler
  const copyBrief = (booking) => {
    const brief = `📅 STUDIO BRIEF: ${booking.project.toUpperCase()}
📍 Room: ${booking.studio} (${booking.startTime} - ${booking.endTime})
👤 Colorist: ${getUserName(booking.coloristId)}
🏢 Client: ${booking.productionHouse || '—'}
🎬 DIR: ${booking.director || '—'} | DOP: ${booking.dop || '—'}
📦 Deliverables: ${booking.deliverables || '—'}`;
    navigator.clipboard.writeText(brief).then(() => {
      if (showToast) showToast('Brief copied to clipboard!', 'success');
    });
  };

  return (
    <div className="space-y-8 animate-fade-up pb-12">
      {/* ─── 1. PERSONALIZED HEADER BAR ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                {currentUserProfile?.role || 'Team Member'}
              </span>
              {currentUserProfile?.studio && currentUserProfile.studio !== 'Office' && (
                <span className="text-xs font-black uppercase tracking-widest text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  {currentUserProfile.studio}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300">{currentUserProfile?.name}</span>
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">
              {userIsLP 
                ? 'Master Operations Overview: Live studio sessions and pipeline departments.' 
                : userIsColorist 
                ? 'Your scheduled studio sessions, creative briefs, and active grading pipeline.' 
                : userIsAssist 
                ? 'Assist Department Queue: Ingest handoffs, render prep, and export tasks.' 
                : userIsConformist 
                ? 'Conform Department: Project XML matching, prep, and media tracking.' 
                : 'Welcome to your daily workspace overview.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Shift Status</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                  {isUserClockedIn(currentUserProfile.id) ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-emerald-400">Clocked In</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span className="text-slate-400">Clocked Out</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right hidden sm:block bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Today</span>
              <span className="text-xs font-black text-white">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. COLORIST HOME VIEW ─── */}
      {userIsColorist && (
        <ColoristHomeView
          today={today}
          myUserIds={myUserIds}
          activeBookings={activeBookings}
          activeTasks={activeTasks}
          coloristViewMode={coloristViewMode}
          setColoristViewMode={setColoristViewMode}
          getUserName={getUserName}
          getProjectName={getProjectName}
          copyBrief={copyBrief}
          setActiveTab={setActiveTab}
          commenceTask={commenceTask}
          requestStageAdvance={requestStageAdvance}
        />
      )}

      {/* ─── 3. ASSISTANT COLORIST HOME VIEW ─── */}
      {userIsAssist && (
        <AssistHomeView
          today={today}
          currentUserProfile={currentUserProfile}
          activeTasks={activeTasks}
          activeBookings={activeBookings}
          getProjectName={getProjectName}
          getUserName={getUserName}
          assignTask={assignTask}
          commenceTask={commenceTask}
          requestStageAdvance={requestStageAdvance}
          formatTime={formatTime}
          getTaskTotalMinutes={getTaskTotalMinutes}
        />
      )}

      {/* ─── 4. CONFORMIST HOME VIEW ─── */}
      {userIsConformist && (
        <ConformHomeView
          today={today}
          currentUserProfile={currentUserProfile}
          activeTasks={activeTasks}
          activeBookings={activeBookings}
          getProjectName={getProjectName}
          getUserName={getUserName}
          assignTask={assignTask}
          commenceTask={commenceTask}
          requestStageAdvance={requestStageAdvance}
          formatTime={formatTime}
          getTaskTotalMinutes={getTaskTotalMinutes}
        />
      )}

      {/* ─── 5. LINE PRODUCER / UNIFIED MASTER VIEW ─── */}
      {userIsLP && (
        <LineProducerHomeView
          today={today}
          activeBookings={activeBookings}
          activeTasks={activeTasks}
          USERS={USERS}
          isUserClockedIn={isUserClockedIn}
          getProjectName={getProjectName}
          getUserName={getUserName}
          getRecommendedRole={getRecommendedRole}
          setShowAssignModal={setShowAssignModal}
          handleForceFinishTask={handleForceFinishTask}
          setActiveTab={setActiveTab}
        />
      )}

      {/* ─── 6. NOTEPAD & SCRATCHPAD (FOR EVERYONE) ─── */}
      <div className="pt-8 border-t border-slate-800">
        <TeamNotepad
          db={db}
          appId={appId}
          currentUserProfile={currentUserProfile}
          notepads={notepads}
          setNotepads={setNotepads}
          waTemplates={waTemplates}
          showToast={showToast}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW: COLORIST HOME
   ══════════════════════════════════════════════════════════════════════════ */
function ColoristHomeView({
  today,
  myUserIds,
  activeBookings,
  activeTasks,
  coloristViewMode,
  setColoristViewMode,
  getUserName,
  getProjectName,
  copyBrief,
  setActiveTab,
  commenceTask,
  requestStageAdvance
}) {
  // My bookings for today
  const myTodayBookings = useMemo(() => 
    activeBookings
      .filter(b => myUserIds.includes(b.coloristId) && b.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activeBookings, myUserIds, today]
  );

  // My upcoming bookings (after today)
  const myUpcomingBookings = useMemo(() => 
    activeBookings
      .filter(b => myUserIds.includes(b.coloristId) && b.date > today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [activeBookings, myUserIds, today]
  );

  // My Grade tasks
  const myGradeTasks = useMemo(() => 
    activeTasks.filter(t => myUserIds.includes(t.assigneeId) && (t.status === 'Grade' || !t.status)),
    [activeTasks, myUserIds]
  );

  const displayedBookings = coloristViewMode === 'today' ? myTodayBookings : myUpcomingBookings;

  return (
    <div className="space-y-8">
      {/* SECTION: Studio Sessions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">My Studio Sessions</h2>
              <p className="text-xs text-slate-400 font-medium">Your scheduled color grading sessions and room assignments.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setColoristViewMode('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  coloristViewMode === 'today' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Today ({myTodayBookings.length})
              </button>
              <button
                onClick={() => setColoristViewMode('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  coloristViewMode === 'upcoming' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Upcoming ({myUpcomingBookings.length})
              </button>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              title="Open full studio calendar"
            >
              <span>Full Schedule</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {displayedBookings.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
            <Calendar size={36} className="mx-auto text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-300">
              {coloristViewMode === 'today' ? 'No Studio Sessions Scheduled for Today' : 'No Upcoming Bookings Found'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {coloristViewMode === 'today' 
                ? 'You have no sessions booked today. Toggle "Upcoming" above to view future dates, or check the full calendar.'
                : 'All studio slots are currently open for future dates.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedBookings.map(booking => {
              const colorInfo = studioColors[booking.studio] || { bg: 'bg-slate-500', text: 'text-slate-400', pill: 'bg-slate-800 text-slate-300 border-slate-700' };
              return (
                <div 
                  key={booking.id}
                  className="bg-slate-800/70 border border-slate-700/70 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between group hover:shadow-indigo-500/5"
                >
                  <div>
                    {/* Header: Room & Timing */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colorInfo.bg} shadow-[0_0_8px_rgba(99,102,241,0.5)]`} />
                        <span className={`text-xs font-black uppercase tracking-wider ${colorInfo.text}`}>
                          {booking.studio}
                        </span>
                      </div>
                      <span className="text-xs font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg tracking-wider flex items-center gap-1.5">
                        <Clock size={12} /> {booking.startTime} – {booking.endTime}
                      </span>
                    </div>

                    {/* Project & Client */}
                    <div className="mb-4">
                      {booking.date !== today && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 mb-1.5 inline-block">
                          {booking.date}
                        </span>
                      )}
                      <h3 className="text-base font-black text-white uppercase tracking-tight group-hover:text-indigo-300 transition-colors">
                        {booking.project}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {booking.productionHouse || 'Direct Production'}
                      </p>
                    </div>

                    {/* Metadata Specs */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 space-y-1 text-[11px] mb-4">
                      {booking.director && (
                        <div className="flex gap-2 text-slate-400">
                          <strong className="text-slate-500 font-bold uppercase tracking-wider w-10">DIR</strong>
                          <span className="text-slate-300 font-medium truncate">{booking.director}</span>
                        </div>
                      )}
                      {booking.dop && (
                        <div className="flex gap-2 text-slate-400">
                          <strong className="text-slate-500 font-bold uppercase tracking-wider w-10">DOP</strong>
                          <span className="text-slate-300 font-medium truncate">{booking.dop}</span>
                        </div>
                      )}
                      {booking.deliverables && (
                        <div className="flex gap-2 text-slate-400">
                          <strong className="text-slate-500 font-bold uppercase tracking-wider w-10">DELV</strong>
                          <span className="text-slate-300 font-medium truncate">{booking.deliverables}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => copyBrief(booking)}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-slate-700"
                    >
                      <Copy size={13} /> Copy Brief
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center border border-indigo-500/30"
                      title="View in Studio Bookings"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION: My Active Grading Tasks */}
      {myGradeTasks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Grading Tasks</h3>
                <p className="text-xs text-slate-400 font-medium">Pipeline tasks currently assigned to you.</p>
              </div>
            </div>
            <span className="text-xs font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-lg">
              {myGradeTasks.length} Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGradeTasks.map(task => (
              <div key={task.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {task.status}
                    </span>
                    {task.activeCommence && (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" /> Active Session
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">{task.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                  {!task.activeCommence ? (
                    <button
                      onClick={() => commenceTask && commenceTask(task.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Play size={13} /> Start Grade
                    </button>
                  ) : (
                    <button
                      onClick={() => requestStageAdvance && requestStageAdvance(task)}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 size={13} /> Complete Phase
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW: ASSISTANT COLORIST HOME
   ══════════════════════════════════════════════════════════════════════════ */
function AssistHomeView({
  today,
  currentUserProfile,
  activeTasks,
  activeBookings,
  getProjectName,
  getUserName,
  assignTask,
  commenceTask,
  requestStageAdvance,
  formatTime,
  getTaskTotalMinutes
}) {
  // 1. My Claimed Assist Tasks
  const myAssistTasks = useMemo(() => 
    activeTasks.filter(t => t.assigneeId === currentUserProfile.id && (t.status === 'Assist' || t.status === 'Delivery Sync')),
    [activeTasks, currentUserProfile.id]
  );

  // 2. Unassigned Assist Queue (available to claim)
  const unassignedAssistQueue = useMemo(() => 
    activeTasks.filter(t => !t.assigneeId && (t.status === 'Assist' || t.status === 'Delivery Sync')),
    [activeTasks]
  );

  // 3. Assist tasks currently in progress by teammates
  const teammateAssistTasks = useMemo(() => 
    activeTasks.filter(t => t.assigneeId && t.assigneeId !== currentUserProfile.id && (t.status === 'Assist' || t.status === 'Delivery Sync')),
    [activeTasks, currentUserProfile.id]
  );

  // Today's studio bookings for operational awareness
  const todayRoomBookings = useMemo(() => 
    activeBookings
      .filter(b => b.date === today)
      .sort((a, b) => a.studio.localeCompare(b.studio) || a.startTime.localeCompare(b.startTime)),
    [activeBookings, today]
  );

  return (
    <div className="space-y-8">
      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Claimed Tasks</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{myAssistTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Unassigned Assist Queue</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{unassignedAssistQueue.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team In Progress</p>
          <p className="text-2xl font-black text-slate-200 mt-1">{teammateAssistTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Studio Sessions</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{todayRoomBookings.length}</p>
        </div>
      </div>

      {/* SECTION 1: MY CLAIMED ASSIST TASKS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">My Active Assist Tasks</h3>
              <p className="text-xs text-slate-400 font-medium">Tasks currently assigned to you for prep, renders, and exports.</p>
            </div>
          </div>
          <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
            {myAssistTasks.length} Assigned
          </span>
        </div>

        {myAssistTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500/50 mb-3" />
            <h4 className="text-sm font-bold text-slate-300">You're all caught up!</h4>
            <p className="text-xs text-slate-500 mt-1">
              No tasks currently in your queue. Check the unassigned queue below to claim an assist task.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myAssistTasks.map(task => {
              const isRunning = !!task.activeCommence;
              return (
                <div 
                  key={task.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isRunning 
                      ? 'bg-slate-800/90 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]' 
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                        {task.status}
                      </span>
                      {isRunning ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Active Session
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock size={12} /> {formatTime ? formatTime(getTaskTotalMinutes(task)) : '0m'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">{task.title}</p>
                    
                    {task.description && (
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 text-xs text-slate-300 mt-3 font-medium line-clamp-2">
                        {task.description}
                      </div>
                    )}

                    {task.flaggedItems && task.flaggedItems.length > 0 && (
                      <div className="bg-red-950/30 p-2.5 rounded-xl border border-red-500/30 text-xs text-red-300 mt-2 flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                        <span className="truncate">{task.flaggedItems[0]}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    {!isRunning ? (
                      <button
                        onClick={() => commenceTask && commenceTask(task.id)}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <Play size={14} /> Start Session
                      </button>
                    ) : (
                      <button
                        onClick={() => requestStageAdvance && requestStageAdvance(task)}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <CheckCircle2 size={14} /> Complete Phase
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: UNASSIGNED ASSIST QUEUE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Available Assist Queue</h3>
              <p className="text-xs text-slate-400 font-medium">Unassigned tasks awaiting an assistant colorist. Click Claim to begin.</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            {unassignedAssistQueue.length} Unassigned
          </span>
        </div>

        {unassignedAssistQueue.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
            <p className="text-xs text-slate-500">No unassigned tasks in the Assist department.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unassignedAssistQueue.map(task => (
              <div 
                key={task.id}
                className="bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {task.status}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                      {getProjectName(task.projectId)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{task.title}</h4>
                  {task.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>}
                </div>
                <button
                  onClick={() => assignTask && assignTask(task.id, currentUserProfile.id)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} className="stroke-[3]" /> Claim Task
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: TODAY'S STUDIO SESSIONS (Colorist Schedule Glance) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-400" /> Today's Studio Colorist Schedule
        </h3>
        {todayRoomBookings.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No studio sessions booked for today.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todayRoomBookings.map(b => (
              <div key={b.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-indigo-400">{b.studio}</span>
                  <span className="text-[10px] font-mono text-slate-400">{b.startTime} - {b.endTime}</span>
                </div>
                <p className="text-sm font-black text-white uppercase tracking-tight truncate">{b.project}</p>
                <p className="text-[11px] text-slate-400 mt-1">Colorist: <strong className="text-slate-200">{getUserName(b.coloristId)}</strong></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW: CONFORMIST HOME
   ══════════════════════════════════════════════════════════════════════════ */
function ConformHomeView({
  today,
  currentUserProfile,
  activeTasks,
  activeBookings,
  getProjectName,
  getUserName,
  assignTask,
  commenceTask,
  requestStageAdvance,
  formatTime,
  getTaskTotalMinutes
}) {
  // 1. My Claimed Conform Tasks
  const myConformTasks = useMemo(() => 
    activeTasks.filter(t => t.assigneeId === currentUserProfile.id && t.status === 'Conform'),
    [activeTasks, currentUserProfile.id]
  );

  // 2. Unassigned Conform Queue
  const unassignedConformQueue = useMemo(() => 
    activeTasks.filter(t => !t.assigneeId && t.status === 'Conform'),
    [activeTasks]
  );

  // 3. Conform tasks worked by other teammates
  const teammateConformTasks = useMemo(() => 
    activeTasks.filter(t => t.assigneeId && t.assigneeId !== currentUserProfile.id && t.status === 'Conform'),
    [activeTasks, currentUserProfile.id]
  );

  return (
    <div className="space-y-8">
      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Conform Tasks</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{myConformTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Conform Queue (Available)</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{unassignedConformQueue.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teammates In Progress</p>
          <p className="text-2xl font-black text-slate-200 mt-1">{teammateConformTasks.length}</p>
        </div>
      </div>

      {/* SECTION 1: MY CONFORM TASKS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">My Active Conform Tasks</h3>
              <p className="text-xs text-slate-400 font-medium">XML conforming, footage prep, and raw media synchronization.</p>
            </div>
          </div>
          <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg">
            {myConformTasks.length} Active
          </span>
        </div>

        {myConformTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500/50 mb-3" />
            <h4 className="text-sm font-bold text-slate-300">Conform Queue is Clean!</h4>
            <p className="text-xs text-slate-500 mt-1">
              You currently have no conform tasks in progress. Check the queue below to claim an incoming project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myConformTasks.map(task => {
              const isRunning = !!task.activeCommence;
              return (
                <div 
                  key={task.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isRunning 
                      ? 'bg-slate-800/90 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.2)]' 
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                        {task.status}
                      </span>
                      {isRunning ? (
                        <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" /> Active Session
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <Clock size={12} /> {formatTime ? formatTime(getTaskTotalMinutes(task)) : '0m'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">{getProjectName(task.projectId)}</h4>
                    <p className="text-xs font-bold text-slate-300 mt-0.5">{task.title}</p>
                    
                    {task.description && (
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 text-xs text-slate-300 mt-3 font-medium line-clamp-2">
                        {task.description}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                    {!isRunning ? (
                      <button
                        onClick={() => commenceTask && commenceTask(task.id)}
                        className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <Play size={14} /> Start Conform
                      </button>
                    ) : (
                      <button
                        onClick={() => requestStageAdvance && requestStageAdvance(task)}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg"
                      >
                        <CheckCircle2 size={14} /> Advance to Assist
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: UNASSIGNED CONFORM QUEUE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Available Conform Queue</h3>
              <p className="text-xs text-slate-400 font-medium">New media arrivals awaiting conform and XML prep.</p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
            {unassignedConformQueue.length} Unassigned
          </span>
        </div>

        {unassignedConformQueue.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-800/20 rounded-2xl border border-slate-800 border-dashed">
            <p className="text-xs text-slate-500">No unassigned conform tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unassignedConformQueue.map(task => (
              <div 
                key={task.id}
                className="bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/40 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {task.status}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                      {getProjectName(task.projectId)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{task.title}</h4>
                </div>
                <button
                  onClick={() => assignTask && assignTask(task.id, currentUserProfile.id)}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shrink-0 flex items-center justify-center gap-1.5"
                >
                  <Plus size={15} className="stroke-[3]" /> Claim Task
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW: LINE PRODUCER MASTER OVERVIEW (All Sections Combined)
   ══════════════════════════════════════════════════════════════════════════ */
function LineProducerHomeView({
  today,
  activeBookings,
  activeTasks,
  USERS,
  isUserClockedIn,
  getProjectName,
  getUserName,
  getRecommendedRole,
  setShowAssignModal,
  handleForceFinishTask,
  setActiveTab
}) {
  const todayBookings = useMemo(() => 
    activeBookings
      .filter(b => b.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [activeBookings, today]
  );

  const conformTasks = useMemo(() => 
    activeTasks.filter(t => t.status === 'Conform'),
    [activeTasks]
  );

  const assistTasks = useMemo(() => 
    activeTasks.filter(t => t.status === 'Assist' || t.status === 'Delivery Sync'),
    [activeTasks]
  );

  const gradeTasks = useMemo(() => 
    activeTasks.filter(t => t.status === 'Grade'),
    [activeTasks]
  );

  const unassignedTasks = useMemo(() => 
    activeTasks.filter(t => !t.assigneeId),
    [activeTasks]
  );

  const staleTasks = useMemo(() => 
    activeTasks.filter(t => t.assigneeId && t.createdAt?.slice(0, 10) < today),
    [activeTasks, today]
  );

  const rooms = ['Studio 01', 'Studio 02', 'Studio 03', 'Studio 04'];

  return (
    <div className="space-y-8">
      {/* ─── MASTER KPI CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Studio Sessions</p>
          <p className="text-2xl font-black text-white mt-1">{todayBookings.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">In Conform</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{conformTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">In Assist</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{assistTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Unassigned Queue</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{unassignedTasks.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg col-span-2 md:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Staff Online</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{USERS.filter(u => isUserClockedIn(u.id)).length}</p>
        </div>
      </div>

      {/* ─── SECTION 1: ALL STUDIO SESSIONS TODAY (Room by Room) ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Calendar size={20} className="text-indigo-400" /> Today's Studio Sessions (All Rooms)
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time studio occupancy across all 4 suites.</p>
          </div>
          <button
            onClick={() => setActiveTab('calendar')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg self-start sm:self-auto"
          >
            <span>Interactive Room Grid</span>
            <ExternalLink size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rooms.map(room => {
            const roomBookings = todayBookings.filter(b => b.studio === room);
            const colorInfo = studioColors[room] || { bg: 'bg-slate-500', text: 'text-slate-400' };

            return (
              <div key={room} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between">
                <div className="border-b border-slate-700/50 pb-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorInfo.bg}`} />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{room}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                    {roomBookings.length} {roomBookings.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>

                {roomBookings.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-medium">
                    Suite available today
                  </div>
                ) : (
                  <div className="space-y-3">
                    {roomBookings.map(b => (
                      <div key={b.id} className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/40">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono text-indigo-300 font-bold">{b.startTime}–{b.endTime}</span>
                          <span className="text-slate-400 truncate max-w-[90px]">{getUserName(b.coloristId)}</span>
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-tight truncate">{b.project}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 2: CONFORM & ASSIST PIPELINE OVERVIEW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CONFORM DEPARTMENT OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <FolderOpen size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Conform Department</h3>
                <p className="text-xs text-slate-400 font-medium">{conformTasks.length} active tasks</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('kanban')}
              className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
            >
              Task Board <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {conformTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No active tasks in Conform department.</p>
            ) : (
              conformTasks.slice(0, 5).map(task => (
                <div key={task.id} className="bg-slate-800/40 border border-slate-700/40 p-3.5 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white uppercase truncate">{getProjectName(task.projectId)}</p>
                    <p className="text-[11px] text-slate-400 truncate">{task.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {task.assigneeId ? (
                      <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {getUserName(task.assigneeId)}
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowAssignModal && setShowAssignModal(task)}
                        className="text-[10px] font-black text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                      >
                        + Assign
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ASSIST DEPARTMENT OVERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Briefcase size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Assist Department</h3>
                <p className="text-xs text-slate-400 font-medium">{assistTasks.length} active tasks</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('kanban')}
              className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
            >
              Task Board <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {assistTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No active tasks in Assist department.</p>
            ) : (
              assistTasks.slice(0, 5).map(task => (
                <div key={task.id} className="bg-slate-800/40 border border-slate-700/40 p-3.5 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white uppercase truncate">{getProjectName(task.projectId)}</p>
                    <p className="text-[11px] text-slate-400 truncate">{task.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {task.assigneeId ? (
                      <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {getUserName(task.assigneeId)}
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowAssignModal && setShowAssignModal(task)}
                        className="text-[10px] font-black text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                      >
                        + Assign
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: UNASSIGNED PIPELINE QUEUE ─── */}
      {unassignedTasks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" /> Unassigned Pipeline Tasks ({unassignedTasks.length})
            </h3>
          </div>
          <div className="space-y-3">
            {unassignedTasks.map(task => (
              <div key={task.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {task.status}
                    </span>
                    <span className="text-xs font-black text-white uppercase tracking-tight">{getProjectName(task.projectId)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-300">{task.title}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal && setShowAssignModal(task)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0"
                >
                  Assign Staff
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SECTION 4: STALE TASKS (FROM PREVIOUS DAYS) ─── */}
      {staleTasks.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h3 className="text-lg font-black text-amber-400 uppercase tracking-tight mb-4 flex items-center gap-2">
            <Timer size={18} /> Stale Active Tasks (From Previous Days)
          </h3>
          <div className="space-y-3">
            {staleTasks.map(task => (
              <div key={task.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-tight">{getProjectName(task.projectId)}</p>
                  <p className="text-xs font-bold text-slate-300">{task.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Assigned: <strong className="text-slate-300">{getUserName(task.assigneeId)}</strong> • Phase: <strong className="text-indigo-400">{task.status}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleForceFinishTask && handleForceFinishTask(task.id)}
                    className="px-4 py-2 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                  >
                    Force Finish
                  </button>
                  <button
                    onClick={() => setShowAssignModal && setShowAssignModal(task)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border border-slate-700"
                  >
                    Reassign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
