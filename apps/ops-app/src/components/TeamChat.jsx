import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, Send, Smile, Paperclip, 
  Trash2, Loader2, FileText, HardDrive, CheckCircle2 
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { sendTeamChatAlert } from '../services/ntfy';
import TeamNotepad from './TeamNotepad';

export default function TeamChat({ 
  db, 
  storage, 
  currentUserProfile, 
  appId, 
  messages, 
  USERS, 
  isUserClockedIn, 
  showToast,
  notepads = {},
  setNotepads,
  waTemplates = []
}) {
  const [chatSubTab, setChatSubTab] = useState('messages'); // 'messages' | 'notepad'
  const [chatInputValue, setChatInputValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
   const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click-away listener for emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File too large. Max 10MB.', 'error');
      } else {
        setFileToUpload(file);
      }
    }
  };

  const handleChatInput = (e) => {
    const val = e.target.value;
    setChatInputValue(val);
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\S*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (user) => {
    const cursor = chatInputRef.current?.selectionStart ?? chatInputValue.length;
    const textBeforeCursor = chatInputValue.slice(0, cursor);
    const textAfterCursor = chatInputValue.slice(cursor);
    const replaced = textBeforeCursor.replace(/@(\S*)$/, `@${user.name} `);
    const newVal = replaced + textAfterCursor;
    setChatInputValue(newVal);
    setMentionQuery(null);
    setTimeout(() => chatInputRef.current?.focus(), 0);
  };

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = chatInputValue.trim();
    const file = fileToUpload;
    
    if (!text && !file) return;
    if (!db || !currentUserProfile) return;

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    try {
      if (file) {
        setUploadProgress(1);
        const storageRef = ref(storage, `artifacts/${appId}/public/chat/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              showToast("File upload failed. Check CORS settings.", "error");
              setUploadProgress(0);
              reject(error);
            },
            async () => {
              try {
                fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                fileName = file.name;
                fileType = file.type;
                fileSize = file.size;
                setUploadProgress(0);
                resolve();
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });
      }

      const mentionedIds = [];
      USERS.forEach(u => {
        const firstName = u.name.split(' ')[0];
        if (text.includes(`@${u.name}`) || text.includes(`@${firstName}`)) {
          if (!mentionedIds.includes(u.id)) mentionedIds.push(u.id);
        }
      });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), {
        text: text,
        senderId: currentUserProfile.id,
        senderName: currentUserProfile.name,
        mentions: mentionedIds,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        createdAt: new Date().toISOString()
      });

      // Dispatch push notification via ntfy.sh
      sendTeamChatAlert(currentUserProfile.name, text, mentionedIds);

      // Clear inputs ONLY after success
      setChatInputValue('');
      setFileToUpload(null);
      setMentionQuery(null);
      setShowEmojiPicker(false);

    } catch (err) {
      console.error("Chat send error:", err);
      // Don't clear inputs so user can try again
      setUploadProgress(0);
      if (err.code === 'storage/unauthorized') {
        showToast('Storage permission denied.', 'error');
      } else if (err.message?.includes('CORS')) {
        showToast('CORS Error: Storage not configured for localhost.', 'error');
      } else {
        showToast('Failed to send message', 'error');
      }
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
    if (e.key === 'Escape') {
      setMentionQuery(null);
      setShowEmojiPicker(false);
    }
  };

  const renderMessageText = (msg) => {
    const { text, mentions, fileUrl, fileName, fileType } = msg;
    const hasMentions = mentions?.length;
    let content = null;

    if (!hasMentions) {
      content = <span>{text}</span>;
    } else {
      const mentionedNames = USERS.filter(u => mentions.includes(u.id)).flatMap(u => [u.name, u.name.split(' ')[0]]);
      const regex = new RegExp(`(@(?:${mentionedNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g');
      const parts = text.split(regex);
      content = (
        <span>
          {parts.map((part, i) =>
            regex.test(part)
              ? <span key={i} className="bg-indigo-500/20 text-indigo-300 font-bold px-1 py-0.5 rounded-sm">{part}</span>
              : <span key={i}>{part}</span>
          )}
        </span>
      );
    }

    if (!fileUrl) return content;

    const isImage = fileType?.startsWith('image/');

    return (
      <div className="space-y-3">
        {text && <div className="mb-2">{content}</div>}
        <div className="rounded-xl overflow-hidden bg-black/30 border border-white/10 group relative max-w-sm transition-all hover:border-white/20">
          {isImage ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
              <img src={fileUrl} alt={fileName} className="max-w-full h-auto max-h-[300px] object-contain hover:scale-105 transition-transform duration-500" />
            </a>
          ) : (
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{fileName}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{fileType?.split('/')[1] || 'FILE'}</p>
              </div>
              <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                <HardDrive size={18} />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const mentionCandidates = mentionQuery !== null
    ? USERS.filter(u =>
      !u.isArchived &&
      u.id !== currentUserProfile.id &&
      (u.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.name.split(' ')[0].toLowerCase().includes(mentionQuery.toLowerCase()))
    )
    : [];

  return (
    <div className="flex flex-col animate-in fade-in space-y-4 pb-12">
      <header className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center">
            <MessageSquare className="mr-3 text-indigo-400" /> Team Chat & Hub
          </h2>
          <p className="text-slate-400 font-medium text-sm md:text-base mt-1">
            {chatSubTab === 'messages' 
              ? <span>Real-time internal studio communication. Type <span className="text-indigo-400 font-bold">@name</span> to mention someone.</span>
              : 'Private staff notes, shared team scratchpad, and delivery templates.'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setChatSubTab('messages')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              chatSubTab === 'messages'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare size={16} />
            <span>Live Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setChatSubTab('notepad')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              chatSubTab === 'notepad'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>Notepad & Scratchpad</span>
          </button>
        </div>
      </header>

      {/* SUBTAB 1: LIVE CHAT */}
      {chatSubTab === 'messages' && (
        <div className="h-[calc(100vh-250px)] min-h-[500px] flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 flex flex-col shadow-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-4 flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="italic text-sm">No messages yet. Send a note to the team!</p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserProfile.id;
              const isMentioned = msg.mentions?.includes(currentUserProfile.id);
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg transition-all ${isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : isMentioned
                      ? 'bg-indigo-950 text-slate-200 border-2 border-indigo-500/50 rounded-bl-sm shadow-indigo-500/10 shadow-xl'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
                  }`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{msg.senderName}</p>
                        {isMentioned && (
                          <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full tracking-widest">MENTIONED YOU</span>
                        )}
                      </div>
                    )}
                    <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                      {renderMessageText(msg)}
                    </div>
                    <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${isMe ? 'text-indigo-200 text-right' : 'text-slate-500 text-left'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input area with @mention dropdown */}
          <div className="pt-4 border-t border-slate-800 shrink-0 relative">
            {/* @mention picker dropdown */}
            {mentionQuery !== null && mentionCandidates.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 pt-3">Mention a teammate</div>
                {mentionCandidates.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-600/20 transition-colors text-left"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isUserClockedIn(u.id) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Attached file preview chip */}
            {fileToUpload && (
              <div className="mb-3 flex items-center gap-3 bg-slate-800 border border-indigo-500/30 p-2.5 rounded-2xl max-w-sm">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{fileToUpload.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{(fileToUpload.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFileToUpload(null)}
                  className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Drag and drop overlay */}
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 bg-slate-800 rounded-2xl border-2 transition-all flex flex-col relative ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' : 'border-slate-700 focus-within:border-indigo-500'
                  }`}
              >
                <textarea
                  ref={chatInputRef}
                  value={chatInputValue}
                  onChange={handleChatInput}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type a message or drop files (max 10MB)..."
                  rows={2}
                  className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 outline-none resize-none placeholder:text-slate-500 font-medium"
                />

                <div className="flex items-center justify-between border-t border-slate-700/50 px-2 py-1">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold px-2">
                    <span>Press <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-[9px] text-slate-300 font-mono">Enter ↵</kbd> to send</span>
                  </div>

                  <div className="flex items-center gap-1 p-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                      >
                        <Smile size={20} />
                      </button>

                      {showEmojiPicker && (
                        <div 
                          ref={emojiPickerRef}
                          className="absolute bottom-full right-0 mb-4 p-3 bg-slate-800 border border-slate-700 rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 grid grid-cols-4 gap-1.5 w-48 backdrop-blur-xl"
                        >
                          {["🔥", "✅", "🚀", "🚨", "⚠️", "🏁", "🎬", "🎞️", "📽️", "🎨", "💻", "🛠️", "🔊", "🎧", "✨", "🙏", "😅", "💯", "👍", "👀"].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                const cursor = chatInputRef.current?.selectionStart ?? chatInputValue.length;
                                const textBefore = chatInputValue.slice(0, cursor);
                                const textAfter = chatInputValue.slice(cursor);
                                const newVal = textBefore + emoji + textAfter;
                                setChatInputValue(newVal);
                                setShowEmojiPicker(false);
                                
                                // Refocus and place cursor precisely after the emoji
                                setTimeout(() => {
                                  if (chatInputRef.current) {
                                    chatInputRef.current.focus();
                                    const newPos = cursor + emoji.length;
                                    chatInputRef.current.setSelectionRange(newPos, newPos);
                                  }
                                }, 0);
                              }}
                              className="p-2 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-xl text-xl transition-all active:scale-90"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-xl transition-all"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            showToast('File too large. Max 10MB.', 'error');
                          } else {
                            setFileToUpload(file);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadProgress > 0}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-95 shrink-0"
              >
                {uploadProgress > 0 ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: NOTEPAD & SCRATCHPAD */}
      {chatSubTab === 'notepad' && (
        <div className="animate-in fade-in">
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
      )}
    </div>
  );
}
