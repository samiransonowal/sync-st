import React, { useRef, useState } from 'react';
import { FileText, Users, ClipboardCopy, Edit, Plus, Trash2, X, Save } from 'lucide-react';
import { doc, setDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

const TeamNotepad = ({ db, appId, currentUserProfile, notepads, setNotepads, waTemplates = [], showToast }) => {
  const [showTemplateModal, setShowTemplateModal] = useState(null); // { mode: 'add' | 'edit', template: {} }
  const myKey = currentUserProfile.id;

  const DEFAULT_TEMPLATES = [
    {
      id: 'hd_default',
      label: 'Hard Drive Ready',
      text: 'Hi, your hard drive will be ready in 15 mins, please arrange for a pick up.  - Studio Tunnel.',
    },
    {
      id: 'renders_default',
      label: 'Renders Ready',
      text: 'Hello, here are your renders\nLink:\n- Studio Tunnel',
    },
    {
      id: 'delay_default',
      label: 'Render Delay',
      text: "Hi, I'm anticipating some delay in your render delivery. Will get back to you with an update soon. - Studio Tunnel",
    },
  ];

  const userTemplates = waTemplates.filter(t => t.userId === myKey);
  const displayTemplates = [...DEFAULT_TEMPLATES, ...userTemplates];

  // Notepad debounce ref
  const notepadSaveTimer = useRef({});

  const saveNotepad = (key, content) => {
    if (notepadSaveTimer.current[key]) clearTimeout(notepadSaveTimer.current[key]);
    notepadSaveTimer.current[key] = setTimeout(async () => {
      if (!db || !appId) return;
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notepads', key), { content }, { merge: true });
      } catch (err) {
        console.error('Notepad save failed:', err);
      }
    }, 800);
  };

  const copyTemplate = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch {
      showToast('Copy failed — try manually.', 'error');
    }
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!db || !appId) return;
    const formData = new FormData(e.target);
    const mode = showTemplateModal.mode;
    const templateData = {
      label: formData.get('label'),
      text: formData.get('text'),
      userId: myKey,
      updatedAt: new Date().toISOString()
    };

    try {
      if (mode === 'add') {
        templateData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'wa_templates'), templateData);
        showToast('Template added!', 'success');
      } else {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wa_templates', showTemplateModal.template.id), templateData, { merge: true });
        showToast('Template updated!', 'success');
      }
      setShowTemplateModal(null);
    } catch (err) {
      showToast('Failed to save template.', 'error');
    }
  };

  const deleteTemplate = async (id) => {
    if (!db || !window.confirm('Delete this template?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'wa_templates', id));
      showToast('Template deleted.', 'success');
      if (showTemplateModal?.template?.id === id) setShowTemplateModal(null);
    } catch (err) {
      showToast('Failed to delete template.', 'error');
    }
  };

  const myContent = notepads[myKey] ?? '';
  const sharedContent = notepads['shared'] ?? '';

  return (
    <div className="animate-in fade-in space-y-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
          <FileText className="mr-3 text-indigo-400" /> Notepad
        </h2>
        <p className="text-slate-400 font-medium text-sm md:text-base">Your private notes and a shared team scratchpad.</p>
      </header>

      {/* PERSONAL + SHARED NOTEPADS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <FileText size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-widest text-sm">My Notepad</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Private · Only visible to you</p>
            </div>
            <span className="ml-auto text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">auto-save</span>
          </div>
          <textarea
            value={myContent}
            onChange={(e) => {
              setNotepads(prev => ({ ...prev, [myKey]: e.target.value }));
              saveNotepad(myKey, e.target.value);
            }}
            placeholder="Start typing your personal notes here..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-all font-medium resize-none leading-relaxed placeholder:text-slate-600"
            rows={14}
          />
        </div>

        {/* Shared */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Users size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-white uppercase tracking-widest text-sm">Team Notepad</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Shared · Visible to everyone</p>
            </div>
            <span className="ml-auto text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">auto-save</span>
          </div>
          <textarea
            value={sharedContent}
            onChange={(e) => {
              setNotepads(prev => ({ ...prev, shared: e.target.value }));
              saveNotepad('shared', e.target.value);
            }}
            placeholder="Shared scratch space for the whole team — handoff notes, links, reminders..."
            className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-all font-medium resize-none leading-relaxed placeholder:text-slate-600"
            rows={14}
          />
        </div>
      </div>

      {/* WHATSAPP QUICK SEND */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-800">
          <div className="p-2.5 bg-[#128C7E]/20 rounded-xl">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-white uppercase tracking-widest text-sm">WhatsApp Quick Send</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Click to copy · Paste directly into WhatsApp</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button 
              onClick={() => setShowTemplateModal({ mode: 'add', template: { label: '', text: '' } })}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} /> Add Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            {displayTemplates.map(tpl => (
              <div
                key={tpl.id}
                className="group relative flex flex-col bg-slate-800/60 hover:bg-[#128C7E]/10 border border-slate-700 hover:border-[#25D366]/40 rounded-2xl p-5 transition-all duration-200 shadow-md hover:shadow-[#25D366]/10 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-black text-[#25D366]/80 uppercase tracking-widest bg-[#25D366]/10 px-2.5 py-1 rounded-lg">
                    {tpl.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setShowTemplateModal({ mode: tpl.userId ? 'edit' : 'add', template: tpl })}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => copyTemplate(tpl.text)}
                      className="p-1.5 text-slate-400 hover:text-[#25D366] transition-colors"
                    >
                      <ClipboardCopy size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-300 group-hover:text-white leading-relaxed whitespace-pre-line font-medium transition-colors flex-1 mb-4">
                  {tpl.text}
                </p>
                <div 
                  onClick={() => copyTemplate(tpl.text)}
                  className="pt-3 border-t border-slate-700/50 flex items-center gap-2 text-[10px] font-black text-slate-600 group-hover:text-[#25D366]/60 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <ClipboardCopy size={11} />
                  Click to copy
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* TEMPLATE MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center">
                {showTemplateModal.template.label ? <Edit size={18} className="mr-2 text-indigo-400" /> : <Plus size={18} className="mr-2 text-emerald-400" />}
                {showTemplateModal.template.label ? 'Edit Template' : 'New Template'}
              </h3>
              <button onClick={() => setShowTemplateModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </header>
            
            <form onSubmit={handleTemplateSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Short Label</label>
                <input 
                  required 
                  name="label" 
                  defaultValue={showTemplateModal.template.label}
                  placeholder="e.g. Renders Ready" 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-bold transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Message Content</label>
                <textarea 
                  required 
                  name="text" 
                  defaultValue={showTemplateModal.template.text}
                  placeholder="Type the message to copy..." 
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none font-medium min-h-[140px] transition-all" 
                />
              </div>

              <div className="flex gap-4 pt-2">
                {showTemplateModal.mode === 'edit' && (
                  <button 
                    type="button"
                    onClick={() => deleteTemplate(showTemplateModal.template.id)}
                    className="flex-1 py-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {showTemplateModal.template.label ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamNotepad;
