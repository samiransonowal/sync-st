import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Network, Plus, Trash2, CheckCircle2, FileVideo, FileCode, FileImage, File, AlertCircle, Calendar, Timer, UserCircle, UploadCloud, X, Download, Edit } from 'lucide-react';

export default function ITTasks({ db, storage, appId, currentUserProfile, showToast, isUserClockedIn }) {
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignedTo, setAssignedTo] = useState('Jay Dantara'); // Default
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'it_tasks'));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setTasks(docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    });
    return unsub;
  }, [db, appId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        showToast('File size must be exactly or below 20MB', 'error');
        e.target.value = null;
        return;
      }
      setSelectedFile(file);
    }
  };

  const getFileIcon = (type) => {
    if (!type) return <File size={16} />;
    if (type.includes('image')) return <FileImage size={16} className="text-emerald-400" />;
    if (type.includes('video')) return <FileVideo size={16} className="text-indigo-400" />;
    if (type.includes('json') || type.includes('log') || type.includes('code')) return <FileCode size={16} className="text-amber-400" />;
    return <File size={16} className="text-slate-400" />;
  };

  const calculateRemainingDays = (endDateStr) => {
    if (!endDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = endDateStr.split('-').map(Number);
    const end = new Date(y, m - 1, d, 0, 0, 0, 0);
    const diff = end - today;
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const startEditing = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setStartDate(task.startDate);
    setEndDate(task.endDate);
    setAssignedTo(task.assignedTo);
    setSelectedFile(null);
    setShowAddTask(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelOperations = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date().toISOString().slice(0, 10));
    setAssignedTo('Jay Dantara');
    setSelectedFile(null);
    setShowAddTask(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Title and Description are required', 'error');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      showToast('End Date must be after Start Date', 'error');
      return;
    }

    setIsSubmitting(true);
    let attachmentObj = editingTask?.attachment || null;

    try {
      if (selectedFile) {
        setUploadProgress(1);
        const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const fileRef = ref(storage, `artifacts/${appId}/long_format_files/${fileName}`);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);
        const oldPathToDelete = editingTask?.attachment?.path;

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snap) => {
              const prog = (snap.bytesTransferred / snap.totalBytes) * 100;
              setUploadProgress(prog);
            },
            (err) => reject(err),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              attachmentObj = {
                name: selectedFile.name,
                url: downloadURL,
                type: selectedFile.type,
                size: selectedFile.size,
                path: fileRef.fullPath
              };
              // Only delete old file after new upload is fully verified and completed
              if (oldPathToDelete) {
                try { await deleteObject(ref(storage, oldPathToDelete)); } catch (e) { console.error("Old file deletion failed:", e); }
              }
              resolve();
            }
          );
        });
      }


      const payload = {
        title,
        description,
        startDate,
        endDate,
        assignedTo,
        attachment: attachmentObj,
        updatedAt: new Date().toISOString()
      };

      if (editingTask) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'it_tasks', editingTask.id), payload);
        showToast('IT Task updated', 'success');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'it_tasks'), {
          ...payload,
          status: 'Pending',
          createdBy: currentUserProfile.id,
          createdByName: currentUserProfile.name,
          createdAt: new Date().toISOString()
        });
        showToast('IT Task successfully delegated', 'success');
      }

      cancelOperations();
    } catch (err) {
      console.error(err);
      showToast(editingTask ? 'Failed to update' : 'Failed to create', 'error');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const markComplete = async (taskId) => {
    if (window.confirm('Mark this IT Task as Complete?')) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'it_tasks', taskId), {
        status: 'Completed',
        completedAt: new Date().toISOString()
      });
      showToast('Task marked complete!', 'success');
    }
  };

  const deleteITTask = async (task) => {
    if (window.confirm('Delete this task entirely? This cannot be undone.')) {
      if (task.attachment?.path) {
        try {
          await deleteObject(ref(storage, task.attachment.path));
        } catch (e) {
          console.error("Old IT attachment deletion warning:", e);
        }
      }
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'it_tasks', task.id));
      showToast('IT Task deleted', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0 border-b border-slate-800 pb-6 mt-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white flex items-center mb-1 uppercase tracking-widest">
            <Network className="mr-4 text-indigo-400" size={36} /> IT & Systems
          </h2>
          <p className="text-slate-400 font-medium italic text-sm mt-2">Deployments, Internal Hardware, Architecture, & Networking fixes.</p>
        </div>
        <button
          onClick={() => showAddTask ? cancelOperations() : setShowAddTask(true)}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors flex justify-center items-center shadow-lg"
        >
          {showAddTask ? <><X size={16} className="mr-2" /> Cancel</> : <><Plus size={16} className="mr-2" /> Assign New Task</>}
        </button>
      </header>

      {showAddTask && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600/30">
            {isSubmitting && <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />}
          </div>

          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6">
            {editingTask ? `Edit System Ticket: ${editingTask.title}` : 'Dispatch System Ticket'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Task Objective</label>
              <input 
                autoFocus required type="text" placeholder="e.g. Expand Storage on Studio 02 TrueNAS" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-800 border-[1.5px] border-slate-700/50 rounded-xl px-4 py-3.5 text-white outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Technical Details</label>
              <textarea 
                required placeholder="Brief explanation of the requirement or error..." value={description} onChange={e => setDescription(e.target.value)}
                rows={4} className="w-full bg-slate-800 border-[1.5px] border-slate-700/50 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 text-sm font-medium resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
              <input 
                required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium cursor-pointer [color-scheme:dark]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Deadline</label>
              <input 
                required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                onClick={(e) => e.target.showPicker?.()}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 font-medium cursor-pointer [color-scheme:dark]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Delegate To</label>
              <div className="flex gap-4">
                {['Jay Dantara', 'Samiran Sonowal', 'Yash Soni'].map(name => (
                  <button
                    key={name} type="button" onClick={() => setAssignedTo(name)}
                    className={`flex-1 py-3 rounded-xl border-[1.5px] text-xs font-black uppercase tracking-widest transition-all ${assignedTo === name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                  >
                    {name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">File Attachment (Optional, max 20MB)</label>
              <div className="w-full bg-slate-800/80 border-2 border-slate-700 border-dashed rounded-2xl p-6 text-center hover:border-indigo-500/50 transition-colors relative">
                <input 
                  type="file" onChange={handleFileChange} disabled={isSubmitting}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                {!selectedFile ? (
                  <div className="flex flex-col items-center">
                    <UploadCloud size={28} className="text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-300">{editingTask?.attachment ? 'Click to replace existing file' : 'Drag & Drop or Click to upload screenshot/log'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 text-emerald-400 font-bold">
                    {getFileIcon(selectedFile.type)}
                    <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={cancelOperations} disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black tracking-widest uppercase transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
              {isSubmitting ? 'Uploading...' : (editingTask ? 'Update Ticket' : 'Dispatch Ticket')}
            </button>
          </div>
        </form>
      )}

      {/* ACTIVE TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start gap-8">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center border-b border-slate-800 pb-2">
            <AlertCircle size={16} className="text-amber-500 mr-2" /> Under Development
          </h3>
          <div className="space-y-4">
            {tasks.filter(t => t.status !== 'Completed').length === 0 && <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest italic py-4">No active IT tickets.</p>}
            
            {tasks.filter(t => t.status !== 'Completed').map(task => {
              const rDays = calculateRemainingDays(task.endDate);
              const isOverdue = rDays < 0;
              return (
                <div key={task.id} className="bg-slate-900 border-[1.5px] border-slate-800 hover:border-indigo-500/50 transition-colors rounded-3xl p-6 relative group flex flex-col items-start shadow-xl">
                  {isOverdue && <div className="absolute top-4 right-4 animate-pulse"><AlertCircle size={18} className="text-red-500" /></div>}
                  
                  <div className="flex gap-2 mb-3 w-full">
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg">Pending</span>
                    <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                      <UserCircle size={10} /> {task.assignedTo}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white leading-tight mb-2 pr-6">{task.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">{task.description}</p>
                  
                  {task.attachment && (
                    <a href={task.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-950/50 hover:bg-slate-800 border border-slate-700/50 p-3 rounded-xl transition-colors mb-4 w-full text-left truncate group-hover:block">
                      {getFileIcon(task.attachment.type)}
                      <span className="text-xs font-bold text-slate-300 truncate tracking-tight">{task.attachment.name}</span>
                      <Download size={14} className="ml-auto text-slate-300" />
                    </a>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between w-full">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Start</span>
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400" /> {new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Deadline</span>
                        <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                          <Timer size={12} className={isOverdue ? "text-red-400" : "text-amber-400"} /> 
                          {new Date(task.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                          <span className="opacity-50 tracking-wider">({rDays}d)</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(task)} className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-xl transition-all" title="Edit Details">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => markComplete(task.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 rounded-xl transition-all" title="Mark Resolved">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => deleteITTask(task)} className="p-2 bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all" title="Delete Securely">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center border-b border-slate-800 pb-2">
            <CheckCircle2 size={16} className="text-emerald-500 mr-2" /> Resolved Logs
          </h3>
          <div className="space-y-4 opacity-75">
            {tasks.filter(t => t.status === 'Completed').slice(0, 10).map(task => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors rounded-2xl p-5 relative group shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white leading-tight mb-1 line-clamp-1">{task.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mb-0 uppercase tracking-widest flex items-center gap-3">
                    <span className="text-emerald-400 font-bold shrink-0">Done: {new Date(task.completedAt).toLocaleDateString('en-GB')}</span> 
                    <span className="truncate block">by {task.assignedTo}</span>
                  </p>
                </div>
                <button onClick={() => deleteITTask(task)} className="p-2 text-slate-400 hover:text-red-400 rounded-xl transition-all opacity-0 group-hover:opacity-100 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

