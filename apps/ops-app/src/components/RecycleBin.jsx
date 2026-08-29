import React from 'react';
import { Trash2, CheckCircle2, Undo2 } from 'lucide-react';

const RecycleBin = ({ tasks, getProjectName, restoreTask, permanentDeleteTask }) => {
  const deletedTasks = tasks.filter(t => t.isDeleted);

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="mb-8 border-b border-slate-800 pb-6 shrink-0">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
          <Trash2 className="mr-3 text-red-400" /> Task Recycle Bin
        </h2>
        <p className="text-slate-400 font-medium text-sm md:text-base mt-1">Review, restore, or permanently delete removed tasks.</p>
      </header>

      <div className="grid gap-4">
        {deletedTasks.length === 0 ? (
          <div className="text-center p-16 bg-slate-900 rounded-3xl border border-slate-800 border-dashed">
            <CheckCircle2 size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-medium text-lg">The recycle bin is clean.</p>
          </div>
        ) : (
          deletedTasks.map(task => (
            <div key={task.id} className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
              <div>
                <h4 className="text-white font-bold text-lg mb-1">{task.title}</h4>
                <div className="flex flex-wrap gap-2 md:gap-4 items-center text-xs text-slate-400">
                  <span className="bg-slate-800 px-2 py-1 rounded font-bold uppercase tracking-widest">Phase: {task.status}</span>
                  <span>Project: {getProjectName(task.projectId)}</span>
                  <span>Deleted: {task.deletedAt ? new Date(task.deletedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown'}</span>
                </div>
              </div>
              <div className="flex w-full sm:w-auto gap-3 shrink-0">
                <button
                  onClick={() => restoreTask(task.id)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center"
                >
                  <Undo2 size={16} className="mr-2" /> RESTORE
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure? This will delete the task permanently from the database.')) {
                      permanentDeleteTask(task.id);
                    }
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-black tracking-widest transition-all flex items-center justify-center"
                >
                  <Trash2 size={16} className="mr-2" /> DESTROY
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecycleBin;
