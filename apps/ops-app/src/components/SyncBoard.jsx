import React, { useState } from 'react';
import { 
  Plus, 
  Edit, 
  MoreVertical, 
  CheckCircle2, 
  Trash2, 
  UserPlus, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Timer,
  AlertCircle,
  AlignLeft,
  Link,
  Upload
} from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const WORKFLOW_STAGES = ['Conform', 'Assist', 'Grade', 'Delivery Sync'];

const getNextTaskId = (tasks = []) => {
  const existingIds = tasks
    .map(t => {
      const match = t.taskId?.match(/T-(\d+)/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(id => id !== null);
  
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 10000;
  return `T-${String(maxId + 1).padStart(5, '0')}`;
};

const calculateActiveMinutes = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.max(0, Math.floor((end - start) / 60000));
};

const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

/**
 * SyncBoard Component
 * Props:
 * db, appId, tasks, projects, USERS, currentUserProfile, 
 * isUserClockedIn, getUserName, getProjectName,
 * setShowAssignModal, softDeleteTask, executeStageAdvance,
 * showToast, sendDiscordAlert, syncToGoogleSheets
 */
export default function SyncBoard({
  db,
  appId,
  tasks,
  projects,
  USERS,
  currentUserProfile,
  isUserClockedIn,
  getUserName,
  getProjectName,
  setShowAssignModal,
  softDeleteTask,
  executeStageAdvance,
  showToast,
  sendDiscordAlert,
  syncToGoogleSheets,
  onOpenSubmission
}) {
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(null);

  const toggleTaskExpansion = (taskId) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!db) return;

    const formData = new FormData(e.target);
    const projId = formData.get('projectId');
    const assigneeId = formData.get('assigneeId') || null;
    const title = formData.get('title');
    const description = formData.get('description');
    const status = formData.get('status');

    try {
      const targetProject = projects.find(p => p.id === projId);
      const projectName = targetProject?.name || title || 'General Project';

      const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
      const docRef = await addDoc(tasksRef, {
        projectId: projId || null,
        title,
        description,
        assigneeId,
        status,
        taskId: getNextTaskId(tasks),
        createdAt: new Date().toISOString(),
        totalActiveMinutes: 0,
        isDeleted: false
      });

      setShowAddTaskModal(false);
      showToast('Task added successfully!', 'success');

      if (syncToGoogleSheets) {
        const assignedUser = USERS.find(u => u.id === assigneeId);
        syncToGoogleSheets('add', {
          id: docRef?.id,
          title: title,
          taskType: title || 'Task',
          projectId: projId,
          projectName: projectName,
          assignedArtist: assignedUser?.name || 'Staff',
          actualHrs: 1.0,
          status: status || 'Conform',
          notes: description || ''
        }, 'task');
      }

      if (assigneeId) {
        const assignedUser = USERS.find(u => u.id === assigneeId);
        const userMention = assignedUser?.discordId ? `<@${assignedUser.discordId}>` : `**${assignedUser?.name}**`;
        sendDiscordAlert(`🚨 ${userMention} **NEW TASK:** ${projectName}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      showToast('Failed to add task.', 'error');
    }
  };


  const handleEditTaskSubmit = async (e) => {
    e.preventDefault();
    if (!db || !showEditTaskModal) return;

    const formData = new FormData(e.target);
    const newAssigneeId = formData.get('assigneeId') || null;
    const title = formData.get('title');
    const description = formData.get('description');
    const status = formData.get('status');
    const projectId = formData.get('projectId') || null;

    try {
      const taskRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasks', showEditTaskModal.id);
      
      const updates = {
        title,
        description,
        status,
        projectId,
        assigneeId: newAssigneeId
      };

      if (showEditTaskModal.assigneeId !== newAssigneeId && showEditTaskModal.activeCommence) {
        const mins = calculateActiveMinutes(showEditTaskModal.activeCommence, new Date().toISOString());
        updates.totalActiveMinutes = (showEditTaskModal.totalActiveMinutes || 0) + mins;
        updates.activeCommence = null;
      }

      await updateDoc(taskRef, updates);
      setShowEditTaskModal(null);
      showToast('Task updated successfully!', 'success');

      if (newAssigneeId && showEditTaskModal.assigneeId !== newAssigneeId) {
        const assignedUser = USERS.find(u => u.id === newAssigneeId);
        const projectName = getProjectName(projectId);
        const userMention = assignedUser?.discordId ? `<@${assignedUser.discordId}>` : `**${assignedUser?.name}**`;
        sendDiscordAlert(`🚨 ${userMention} **REASSIGNED (via Edit):** ${title} (${projectName})`);
      }

      syncToGoogleSheets('update', {
        id: showEditTaskModal.id,
        ...updates,
        projectName: getProjectName(projectId),
        duration: formatMinutes(showEditTaskModal.totalActiveMinutes || 0)
      }, 'task');
    } catch (error) {
      showToast('Failed to update task.', 'error');
    }
  };

  const getTaskTotalMinutes = (task) => {
    let total = task.totalActiveMinutes || 0;
    if (task.activeCommence) {
      total += calculateActiveMinutes(task.activeCommence, new Date().toISOString());
    }
    return total;
  };

  const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };


  // Helper to filter tasks based on stage, handling status variants and groupings
  const getTasksForStage = (stage) => {
    return tasks.filter(t => {
      if (t.isDeleted) return false;
      const status = t.status ? t.status.toLowerCase() : '';
      
      if (stage === 'Conform') {
        return status === 'conform';
      }
      if (stage === 'Assist') {
        return status === 'assist';
      }
      if (stage === 'Grade') {
        return status === 'grade';
      }
      if (stage === 'Delivery Sync') {
        // Map multiple possible status strings to the 'Delivery Sync' column
        return status === 'delivery sync' || status === 'drive sync' || status === 'delivery';
      }
      
      return status === stage.toLowerCase();
    });
  };

  return (
    <div className="animate-in fade-in space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">Studio Pipeline</h2>
          <p className="text-slate-500 font-bold text-sm md:text-base uppercase tracking-widest mt-1">Global view of all active workflows.</p>
        </div>
        <button
          onClick={() => setShowAddTaskModal(true)}
          className="px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-black tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center group"
        >
          <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform" /> ADD NEW TASK
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start pb-20">
        {WORKFLOW_STAGES.map(stage => {
          const stageTasks = getTasksForStage(stage);
          return (
            <div key={stage} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-[2.5rem] p-4 flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between px-4 py-4 mb-4 border-b border-slate-800/50">
                <h3 className="font-black text-white text-sm uppercase tracking-[0.2em]">{stage}</h3>
                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-full border border-slate-700/50">{stageTasks.length}</span>
              </div>

              <div className="space-y-4">
                {stageTasks.map(task => {
                  const isExpanded = expandedTaskIds.has(task.id);
                  const isRunning = !!task.activeCommence;
                  return (
                    <div key={task.id} className={`group bg-slate-900 border-2 rounded-3xl overflow-hidden transition-all duration-300 ${isRunning ? 'border-emerald-500/50 bg-slate-900/80 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700 shadow-xl'}`}>
                      <div className="p-5">
                        {/* Card Header: Project (left) | Task ID (right) */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate max-w-[140px]">
                            {getProjectName(task.projectId)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {isRunning && (
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {task.taskId && (
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-black rounded border border-slate-700 tracking-wider">
                                {task.taskId}
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-white font-bold text-sm mb-4 leading-tight group-hover:text-indigo-300 transition-colors">{task.title}</h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">
                          <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg">
                            <Clock size={12} className="text-slate-400" />
                            <span>{formatTime(getTaskTotalMinutes(task))}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={task.assigneeId ? "text-slate-300" : "text-amber-500"}>
                              {task.assigneeId ? getUserName(task.assigneeId) : "UNASSIGNED"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded View */}
                        {isExpanded && (
                          <div className="mb-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                             {task.description && (
                              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 flex items-center"><AlignLeft size={10} className="mr-2" /> Notes</p>
                                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                              </div>
                             )}
                             <div className="text-[9px] text-slate-600 font-medium">
                               Created: {new Date(task.createdAt).toLocaleString()}
                             </div>
                          </div>
                        )}

                        {/* Action Row - Icons Only with Tooltips */}
                        <div className="flex items-center justify-between gap-1 pt-4 border-t border-slate-800/50">
                          <button
                            onClick={() => setShowEditTaskModal(task)}
                            title="Edit Task"
                            className="flex-1 flex items-center justify-center p-2.5 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all group/btn"
                          >
                            <Edit size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => setShowAssignModal(task)}
                            title="Reassign Task"
                            className="flex-1 flex items-center justify-center p-2.5 bg-sky-500/10 hover:bg-sky-600 text-sky-400 hover:text-white border border-sky-500/20 rounded-xl transition-all group/btn"
                          >
                            <UserPlus size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => executeStageAdvance(task.id, 'Delivered', task.status)}
                            title="Mark Done"
                            className="flex-1 flex items-center justify-center p-2.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl transition-all group/btn"
                          >
                            <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                          {onOpenSubmission && task.projectId && (
                            <button
                              onClick={() => onOpenSubmission(task.projectId)}
                              title="Submit Render Link to LP"
                              className="flex-1 flex items-center justify-center p-2.5 bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 rounded-xl transition-all group/btn"
                            >
                              <Link size={16} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                          )}
                          <button
                            onClick={() => softDeleteTask(task.id)}
                            title="Delete Task"
                            className="flex-1 flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-xl transition-all group/btn"
                          >
                            <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="w-full mt-3 flex items-center justify-center py-1 text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODALS --- */}

      {/* EDIT TASK MODAL */}
      {showEditTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-white flex items-center uppercase tracking-widest">
                <Edit className="mr-3" size={20} /> EDIT TASK
              </h3>
              <button onClick={() => setShowEditTaskModal(null)} className="text-indigo-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditTaskSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
                <input required name="title" type="text" defaultValue={showEditTaskModal.title} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Project</label>
                <select name="projectId" defaultValue={showEditTaskModal.projectId || ""} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="">Internal / General</option>
                  {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Instructions / Notes</label>
                <textarea name="description" defaultValue={showEditTaskModal.description} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 min-h-[100px] font-medium" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Current Phase</label>
                <select name="status" defaultValue={showEditTaskModal.status} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  {WORKFLOW_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Assign To</label>
                <select name="assigneeId" defaultValue={showEditTaskModal.assigneeId || ""} className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="">Leave Unassigned (LP Queue)</option>
                  {USERS.filter(user => !user.isArchived).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {isUserClockedIn(user.id) ? '(IN)' : '(Offline)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-all">
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center uppercase tracking-widest"><Plus size={20} className="mr-3 text-indigo-400" /> New Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddTaskSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Task Title</label>
                <input required name="title" type="text" placeholder="e.g. Master Conform V2" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Link to Project</label>
                <select name="projectId" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="">Internal / General (No Project)</option>
                  {projects.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Instructions / Notes</label>
                <textarea name="description" placeholder="Add specific requirements..." className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 min-h-[100px] font-medium" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Starting Phase</label>
                <select name="status" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  {WORKFLOW_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Assign To</label>
                <select name="assigneeId" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 font-bold">
                  <option value="">Leave Unassigned (LP Queue)</option>
                  {USERS.filter(user => !user.isArchived).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} {isUserClockedIn(user.id) ? '(IN)' : '(Offline)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 shrink-0">
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black tracking-widest shadow-lg shadow-indigo-500/20 transition-all">
                  CREATE TASK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
