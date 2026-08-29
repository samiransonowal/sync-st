import React, { useState, useMemo } from 'react';
import { 
  Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Copy, ClipboardCopy, UserCircle, AlertCircle, Archive, Undo2, RefreshCw, Clock
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc 
} from 'firebase/firestore';
import { sendOpsAlert, sendDirectUserAlert } from '../services/ntfy';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const studioColors = {
  'Studio 01': 'bg-indigo-500',
  'Studio 02': 'bg-emerald-500',
  'Studio 03': 'bg-rose-500'
};
const STUDIO_ROOMS = ['Studio 01', 'Studio 02', 'Studio 03'];

const StudioBookings = ({ 
  bookings, 
  projects, 
  currentUserProfile, 
  db, 
  appId, 
  showToast, 
  getUserName,
  syncToGoogleSheets,
  formatLocalDate,
  users
}) => {
  const [calendarView, setCalendarView] = useState('list');
  const [calendarDate, setCalendarDate] = useState(formatLocalDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [modalValidation, setModalValidation] = useState({ isIdentical: false });
  const [statusFilter, setStatusFilter] = useState('all');
  const [coloristFilter, setColoristFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' or 'week'
  const [weekOffset, setWeekOffset] = useState(0);

  const currentDate = formatLocalDate(new Date());
  const activeBookings = useMemo(() => bookings.filter(b => !b.isDeleted && !b.isVaulted), [bookings]);
  const deletedBookings = useMemo(() => bookings.filter(b => b.isDeleted), [bookings]);
  const vaultedBookings = useMemo(() => bookings.filter(b => (b.isVaulted || (!b.isVaulted && b.date < currentDate)) && !b.isDeleted), [bookings, currentDate]);

  const restoreBooking = (booking) => {
    setShowBookingModal({
      ...booking,
      isRestore: true
    });
    showToast('Modify details to restore this booking.', 'info');
  };

  const reviveBooking = (booking) => {
    setShowBookingModal({
      ...booking,
      id: undefined, 
      originalId: booking.id,
      isRevive: true
    });
    showToast('Modify details to revive as a new booking.', 'info');
  };

  const moveToVault = async (id) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', id), {
         isVaulted: true,
         vaultedAt: new Date().toISOString()
      });
      showToast('Booking moved to Vault', 'success');
      setCalendarView('vault');
    } catch(e) {
      showToast('Error vaulting booking', 'error');
    }
  };

  const deleteBooking = (id) => {
    setShowDeleteConfirmation(id);
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirmation || !db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', showDeleteConfirmation), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      showToast('Booking moved to Vault (Recycle Bin)', 'success');
      setShowDeleteConfirmation(null);
    } catch (e) {
      console.error(e);
      showToast('Error cancelling booking', 'error');
    }
  };
  const formRef = React.useRef(null);

  React.useEffect(() => {
    if (showBookingModal) {
      // Delay validation slightly to ensure form defaults are populated
      setTimeout(validateModalForm, 50);
    } else {
      setModalValidation({ isIdentical: false });
    }
  }, [showBookingModal]);

  // Derived calendar states
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevMonthLastDay = new Date(calYear, calMonth, 0).getDate();

  const calDays = useMemo(() => {
    const days = [];
    // Padding from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      days.push({ dayStr: d, date: formatLocalDate(new Date(calYear, calMonth - 1, d)), isCurrentMonth: false });
    }
    // Curr month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ dayStr: i, date: formatLocalDate(new Date(calYear, calMonth, i)), isCurrentMonth: true });
    }
    // Padding for next month
    const total = 42;
    const nextPadding = total - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      days.push({ dayStr: i, date: formatLocalDate(new Date(calYear, calMonth + 1, i)), isCurrentMonth: false });
    }
    return days;
  }, [calYear, calMonth, firstDay, daysInMonth, prevMonthLastDay, formatLocalDate]);

  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobileGrid(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const weekDays = useMemo(() => {
    const start = new Date(calendarDate);
    if (!isMobileGrid) {
      start.setDate(start.getDate() - start.getDay()); // Start on Sunday
    }
    const daysCount = isMobileGrid ? 4 : 7;
    const days = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(formatLocalDate(d));
    }
    return days;
  }, [calendarDate, formatLocalDate, isMobileGrid]);

  const today = formatLocalDate(new Date());

  // Time metrics (6 AM to Midnight)
  const START_HOUR = 6;
  const END_HOUR = 24;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const HOUR_HEIGHT = 60; // 60px per hour means 1px per minute

  const getPositionMetrics = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    let top = ((startH - START_HOUR) * HOUR_HEIGHT) + startM;
    let endMinutes = (endH - START_HOUR) * HOUR_HEIGHT + endM;
    
    // Handle overnight bookings (ending at or before 6 AM)
    if (endH < START_HOUR) {
      endMinutes = (endH + 24 - START_HOUR) * HOUR_HEIGHT + endM;
    }
    
    const height = Math.max(endMinutes - top, 20); // Minimum 20px height
    return { top, height };
  };

  const calculateOverlaps = (dayBookings) => {
    const parseTime = (t) => { let [h,m] = t.split(':').map(Number); return (h<6 ? h+24 : h)*60 + m; };
    let groups = [];
    
    dayBookings.forEach(b => {
      const bStart = parseTime(b.startTime);
      let addedToGroup = false;
      for (let group of groups) {
        const groupEnd = Math.max(...group.map(gb => parseTime(gb.endTime)));
        if (bStart < groupEnd) {
          group.push(b);
          addedToGroup = true;
          break;
        }
      }
      if (!addedToGroup) groups.push([b]);
    });

    const positioned = [];
    groups.forEach(group => {
      let columns = [];
      group.forEach(b => {
        const bStart = parseTime(b.startTime);
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastInCol = columns[i][columns[i].length - 1];
          if (bStart >= parseTime(lastInCol.endTime)) {
            columns[i].push(b);
            placed = true;
            b.colIndex = i;
            break;
          }
        }
        if (!placed) {
          b.colIndex = columns.length;
          columns.push([b]);
        }
      });
      group.forEach(b => {
        b.totalCols = columns.length;
        positioned.push(b);
      });
    });
    return positioned;
  };

  const duplicateBooking = (booking) => {
    setShowBookingModal({
      ...booking,
      id: null,
      isDuplicate: true
    });
    showToast('Duplicating booking details...', 'info');
  };

  const handleProjectFieldChange = (field, value) => {
    if (!formRef.current) return;
    const form = formRef.current;
    if (field === 'projectCode') {
      const matched = projects.find(p => p.code?.toLowerCase() === value.trim().toLowerCase());
      if (matched) {
        if (form.elements['projectName']) form.elements['projectName'].value = matched.name || '';
        if (form.elements['productionHouse']) form.elements['productionHouse'].value = matched.client || '';
        if (form.elements['director']) form.elements['director'].value = matched.director || '';
        if (form.elements['dop']) form.elements['dop'].value = matched.dop || '';
        if (form.elements['postProducer']) form.elements['postProducer'].value = matched.postProducer || '';
        if (form.elements['clientPhone']) form.elements['clientPhone'].value = matched.clientPhone || '';
        if (form.elements['clientEmail']) form.elements['clientEmail'].value = matched.clientEmail || '';
        if (form.elements['deliverables']) form.elements['deliverables'].value = matched.deliverables || '';
      }
    } else if (field === 'projectName') {
      const matched = projects.find(p => p.name?.toLowerCase() === value.trim().toLowerCase());
      if (matched) {
        if (form.elements['projectCode']) form.elements['projectCode'].value = matched.code || '';
        if (form.elements['productionHouse']) form.elements['productionHouse'].value = matched.client || '';
        if (form.elements['director']) form.elements['director'].value = matched.director || '';
        if (form.elements['dop']) form.elements['dop'].value = matched.dop || '';
        if (form.elements['postProducer']) form.elements['postProducer'].value = matched.postProducer || '';
        if (form.elements['clientPhone']) form.elements['clientPhone'].value = matched.clientPhone || '';
        if (form.elements['clientEmail']) form.elements['clientEmail'].value = matched.clientEmail || '';
        if (form.elements['deliverables']) form.elements['deliverables'].value = matched.deliverables || '';
      }
    }
    validateModalForm();
  };

  const validateModalForm = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const bookingId = typeof showBookingModal === 'object' ? showBookingModal.id : null;
    const isEdit = typeof showBookingModal === 'object' && showBookingModal.id && !showBookingModal.isDuplicate;

    const newStudio = formData.get('studio');
    const newDate = formData.get('date');
    const newStart = formData.get('startTime');
    const newEnd = formData.get('endTime');
    const newColoristId = formData.get('coloristId');
    const productionHouse = formData.get('productionHouse');
    const rawProjectCode = formData.get('projectCode');
    const rawProjectName = formData.get('projectName') || formData.get('project');

    let isMissingFields = false;
    if (!productionHouse?.trim() || (!rawProjectName?.trim() && !rawProjectCode?.trim()) || !newDate || !newStart || !newEnd || !newStudio) {
      isMissingFields = true;
    }

    const norm = (id) => (!id || id === 'unassigned') ? '' : id;

    const isIdentical = activeBookings.some(b => {
      if (isEdit && b.id === bookingId) return false;
      return b.studio === newStudio &&
             b.date === newDate &&
             b.startTime === newStart &&
             b.endTime === newEnd &&
             norm(b.coloristId) === norm(newColoristId);
    });

    let isUnchangedRevive = false;
    let isPastRevive = false;

    if (typeof showBookingModal === 'object' && (showBookingModal.isRestore || showBookingModal.isRevive)) {
      const targetId = showBookingModal.isRevive ? showBookingModal.originalId : bookingId;
      const oldBooking = bookings.find(b => b.id === targetId);
      if (oldBooking) {
        const changed = (oldBooking.studio !== newStudio) || 
                        (oldBooking.date !== newDate) || 
                        (oldBooking.startTime !== newStart) || 
                        (oldBooking.endTime !== newEnd) || 
                        (norm(oldBooking.coloristId) !== norm(newColoristId));
        isUnchangedRevive = !changed;
      }
    }

    if (typeof showBookingModal === 'object' && showBookingModal.isRevive) {
      if (newDate) {
        const todayStr = formatLocalDate(new Date());
        if (newDate < todayStr) {
          isPastRevive = true;
        } else if (newDate === todayStr && newStart) {
          const now = new Date();
          const [h, m] = newStart.split(':').map(Number);
          if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
            isPastRevive = true;
          }
        }
      }
    }

    setModalValidation({ isIdentical, isUnchangedRevive, isPastRevive, isMissingFields });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const bookingId = typeof showBookingModal === 'object' ? showBookingModal.id : null;
    const isEdit = typeof showBookingModal === 'object' && showBookingModal.id && !showBookingModal.isDuplicate;

    const newStudio = formData.get('studio');
    const newDate = formData.get('date');
    const newStart = formData.get('startTime');
    const newEnd = formData.get('endTime');
    const coloristId = formData.get('coloristId');
    const rawProjectCode = String(formData.get('projectCode') || '').trim();
    const rawProjectName = String(formData.get('projectName') || formData.get('project') || '').trim();
    const productionHouse = formData.get('productionHouse');

    if (!productionHouse?.trim() || (!rawProjectName && !rawProjectCode) || !newDate || !newStart || !newEnd || !newStudio) {
      showToast('Please completely fill out all required fields (Client, Project Code / Name, Date, Times).', 'error');
      return;
    }

    if (newStart >= newEnd) {
      showToast('Invalid time range. Start time must be before end time.', 'error');
      return;
    }

    const hasConflict = activeBookings.some(b => {
      if (isEdit && b.id === bookingId) return false;
      if (b.studio !== newStudio || b.date !== newDate) return false;
      return (newStart < b.endTime) && (newEnd > b.startTime);
    });

    const isIdentical = activeBookings.some(b => {
      if (isEdit && b.id === bookingId) return false;
      const norm = (id) => (!id || id === 'unassigned') ? '' : id;
      return b.studio === newStudio &&
             b.date === newDate &&
             b.startTime === newStart &&
             b.endTime === newEnd &&
             norm(b.coloristId) === norm(coloristId);
    });

    if (isIdentical && !showBookingModal.isRestore && !showBookingModal.isRevive) {
      showToast('This exact booking already exists! Please change at least one parameter.', 'error');
      return;
    }

    if (showBookingModal.isRestore || showBookingModal.isRevive) {
      if (showBookingModal.isRevive) {
        if (newDate < currentDate) {
          showToast('Cannot revive into the past. Date must be today or future!', 'error');
          return;
        }
        if (newDate === currentDate) {
          const now = new Date();
          const [h, m] = newStart.split(':').map(Number);
          if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
             showToast('Cannot revive into the past. Start time has already passed!', 'error');
             return;
          }
        }
      }

      const targetId = showBookingModal.isRevive ? showBookingModal.originalId : bookingId;
      const oldBooking = bookings.find(b => b.id === targetId);
      if (oldBooking) {
        const norm = (id) => (!id || id === 'unassigned') ? '' : id;
        const changed = (oldBooking.studio !== newStudio) || 
                        (oldBooking.date !== newDate) || 
                        (oldBooking.startTime !== newStart) || 
                        (oldBooking.endTime !== newEnd) || 
                        (norm(oldBooking.coloristId) !== norm(coloristId));
        if (!changed) {
          showToast('Must change Time, Date, Room, or Colorist to proceed!', 'error');
          return;
        }
      }
    }

    if (hasConflict) {
      showToast(`${newStudio} is already booked during this time slot.`, 'error');
      return;
    }

    try {
      // Look up project by code or name
      let selectedProject = projects.find(p => (rawProjectCode && p.code === rawProjectCode) || (rawProjectName && p.name === rawProjectName));
      let finalName = rawProjectName || selectedProject?.name || '';
      let finalCode = rawProjectCode || selectedProject?.code || '';
      const rawCommercialStatus = formData.get('commercialStatus') || showBookingModal?.commercialStatus || 'Billable';
      const rawHourlyRate = Number(formData.get('hourlyRate')) || showBookingModal?.hourlyRate || selectedProject?.rate || 5000;

      const bookingData = {
        project: finalName,
        projectName: finalName,
        projectCode: finalCode,
        projectId: selectedProject?.id || (showBookingModal?.projectId || null),
        productionHouse: formData.get('productionHouse') || selectedProject?.client || '',
        director: formData.get('director') || selectedProject?.director || '',
        dop: formData.get('dop') || selectedProject?.dop || '',
        postProducer: formData.get('postProducer') || selectedProject?.postProducer || '',
        studio: newStudio,
        date: newDate,
        startTime: newStart,
        endTime: newEnd,
        commercialStatus: rawCommercialStatus,
        hourlyRate: rawHourlyRate,
        deliverables: formData.get('deliverables') || selectedProject?.deliverables || '',
        coloristId: coloristId,
        clientPhone: formData.get('clientPhone') || selectedProject?.clientPhone || '',
        clientEmail: formData.get('clientEmail') || selectedProject?.clientEmail || '',
        lastModified: new Date().toISOString()
      };

      let docRef = null;
      if (isEdit) {
        if (showBookingModal.isRestore) {
          bookingData.isDeleted = false;
          bookingData.deletedAt = null;
        }
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingId), bookingData);
        showToast('Booking updated successfully', 'success');
      } else {
        bookingData.createdAt = new Date().toISOString();
        docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bookings'), bookingData);
        showToast('Booking added successfully', 'success');
      }

      setModalValidation({ isIdentical: false });
      setShowBookingModal(false);

      // Dispatch push notifications via ntfy.sh
      sendOpsAlert(
        `📅 Booking ${isEdit ? 'Updated' : 'Created'}: ${bookingData.project}`,
        `${bookingData.project} on ${bookingData.date} (${bookingData.startTime}-${bookingData.endTime}) in ${bookingData.room || 'Studio'}. Colorist: ${bookingData.assignedArtist || 'TBD'}.`
      );
      if (bookingData.coloristId) {
        sendDirectUserAlert(
          bookingData.coloristId,
          `📅 Studio Session Scheduled`,
          `${bookingData.project} on ${bookingData.date} (${bookingData.startTime}-${bookingData.endTime}) in ${bookingData.room || 'Studio'}.`
        );
      }

      if (syncToGoogleSheets) {
        try {
          syncToGoogleSheets(isEdit ? 'update' : 'add', {
            id: isEdit ? bookingId : docRef?.id,
            ...bookingData,
            projectName: bookingData.project
          }, 'booking');
        } catch (syncError) {
          console.error('Google Sheets sync failed:', syncError);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving booking', 'error');
    }
  };

  const copyScheduleBrief = () => {
    const dayBookings = activeBookings.filter(b => b.date === calendarDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
    if (dayBookings.length === 0) {
      showToast('No bookings to copy', 'info');
      return;
    }
    const brief = `📅 SCHEDULE BRIEF: ${new Date(calendarDate).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}\n\n` + 
      dayBookings.map(b => `${b.startTime}-${b.endTime} | ${b.studio}\n📌 ${b.project.toUpperCase()}\n👤 ${getUserName(b.coloristId)}\n---`).join('\n\n');
    
    navigator.clipboard.writeText(brief).then(() => showToast('Brief copied to clipboard!', 'success'));
  };

  const BookingCard = ({ booking }) => (
    <div className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 group relative shadow-md ${booking.date < today ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-md shrink-0 ${studioColors[booking.studio] || 'bg-slate-500'}`} />
          <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg tracking-widest">
            {booking.startTime} – {booking.endTime}
          </span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{booking.studio}</span>
        </div>
        {currentUserProfile.isAdmin && (
          <div className="flex items-center space-x-2">
            <button onClick={() => duplicateBooking(booking)} className="text-slate-300 hover:text-indigo-400 transition-colors bg-slate-900/50 p-2 rounded-xl" title="Duplicate Booking"><Copy size={16} /></button>
            <button onClick={() => setShowBookingModal(booking)} className="text-slate-300 hover:text-indigo-400 transition-colors bg-slate-900/50 p-2 rounded-xl" title="Edit Booking"><Edit size={16} /></button>
            <button onClick={() => moveToVault(booking.id)} className="text-slate-300 hover:text-amber-400 transition-colors bg-slate-900/50 p-2 rounded-xl" title="Vault Booking"><Archive size={16} /></button>
            <button onClick={() => deleteBooking(booking.id)} className="text-slate-300 hover:text-red-400 transition-colors bg-slate-900/50 p-2 rounded-xl" title="Delete Booking"><Trash2 size={16} /></button>
          </div>
        )}
      </div>
      <div className="flex flex-col mb-4 mt-2">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h4 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{booking.project}</h4>
          {booking.projectCode && (
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded font-black tracking-widest leading-none">
              {booking.projectCode}
            </span>
          )}
        </div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-0.5">{booking.productionHouse}</p>
      </div>
      <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 mb-3">
        {booking.director && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DIR</strong>{booking.director}</p>}
        {booking.dop && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DOP</strong>{booking.dop}</p>}
        {booking.postProducer && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">POST</strong>{booking.postProducer}</p>}
        {booking.deliverables && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DELV</strong>{booking.deliverables}</p>}
      </div>
      <div className="flex justify-between items-end pt-3 border-t border-slate-700/50 mt-auto">
        <div className="flex flex-col">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center mb-1">
            <UserCircle size={14} className="mr-1.5 text-indigo-400" /> Colorist
          </p>
          <span className="text-white text-sm font-black tracking-tight">{getUserName(booking.coloristId)}</span>
        </div>
        <div className="flex flex-col items-end space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{booking.date}</span>
            <span className="text-[9px] font-black bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-lg font-mono tracking-tighter shadow-inner">
              BID-{booking.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
              CR: <span className="text-slate-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}</span>
            </p>
            <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
              MD: <span className="text-slate-500">{booking.lastModified ? new Date(booking.lastModified).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '---'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const DaySection = ({ dateStr, isSelected, showEmpty = false }) => {
    const dayBookings = activeBookings.filter(b => b.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (dayBookings.length === 0 && !showEmpty) return null;
    const isToday = dateStr === today;
    const d = new Date(dateStr);
    const isPast = dateStr < today;
    return (
      <div className={`rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-500/60 bg-indigo-500/5' : isToday ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 bg-slate-900/50'} ${isPast && !isSelected ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <div
          className="flex items-center gap-4 px-5 pt-4 pb-3 cursor-pointer"
          onClick={() => setCalendarDate(dateStr)}
        >
          <div className={`text-center w-12 shrink-0 p-2 rounded-xl ${isToday ? 'bg-emerald-500/20' : isSelected ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-400' : isSelected ? 'text-indigo-400' : 'text-slate-500'}`}>
              {d.toLocaleDateString('en-IN', { weekday: 'short' })}
            </div>
            <div className={`text-2xl font-black leading-none mt-0.5 ${isToday ? 'text-emerald-300' : isSelected ? 'text-indigo-300' : 'text-white'}`}>
              {d.getDate()}
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isToday ? 'text-emerald-500' : 'text-slate-600'}`}>
              {d.toLocaleDateString('en-IN', { month: 'short' })}
            </div>
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            {dayBookings.map(b => (
              <span key={b.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold ${studioColors[b.studio]?.replace('bg-', 'bg-').replace('500', '500/15') || 'bg-slate-700'} border ${studioColors[b.studio]?.replace('bg-', 'border-').replace('500', '500/30') || 'border-slate-600'} text-slate-200`}>
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${studioColors[b.studio]}`} />
                {b.projectCode ? `[${b.projectCode}] ` : ''}{b.project}
                <span className="text-slate-400 font-normal">{b.startTime}–{b.endTime}</span>
              </span>
            ))}
          </div>
          <span className="text-xs font-black text-slate-500 bg-slate-800 px-2.5 py-1 rounded-lg shrink-0">{dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}</span>
        </div>
        {isSelected && (
          <div className="px-5 pb-5 pt-2 space-y-3 border-t border-slate-800/60">
            {dayBookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    );
  };

  const sortedDates = [...new Set(activeBookings.map(b => b.date))].sort();
  const upcomingDates = sortedDates.filter(d => d >= today);
  const pastDates = sortedDates.filter(d => d < today).reverse();

  return (
    <div className="h-full flex flex-col animate-in fade-in space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Studio Bookings</h2>
          <p className="text-slate-400 font-medium text-sm md:text-base">Manage studio availability and daily schedules.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 shrink-0 items-start md:items-center w-full md:w-auto mt-2 md:mt-0">
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 w-full md:w-auto justify-between md:justify-start">
            {[['list', 'Schedule'], ['week', 'Week'], ['month', 'Month']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setCalendarView(v)}
                className={`flex-1 md:flex-none px-4 py-2.5 md:py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg transition-colors ${calendarView === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          {currentUserProfile.isAdmin && (
            <div className="flex flex-row gap-2 w-full md:w-auto">
              <button onClick={() => setCalendarView('vault')} className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-colors flex items-center shadow-lg">
                <Archive size={14} className="mr-1.5 md:mr-2" /> VAULT
              </button>
              <button onClick={() => setShowBookingModal(true)} className="flex-[2] md:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-colors flex items-center shadow-lg">
                <Plus size={14} className="mr-1.5 md:mr-2" /> ADD BOOKING
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MONTHLY CALENDAR VIEW */}
      {calendarView === 'month' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col space-y-8 pb-8 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 md:p-6 shrink-0 shadow-xl overflow-x-hidden">
            <div className="flex items-center justify-between mb-6 w-full">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">
                {monthNames[calMonth]} <span className="text-indigo-400">{calYear}</span>
              </h3>
              <div className="flex space-x-2 md:space-x-3">
                <button onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))} className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"><ChevronLeft size={20} /></button>
                <button onClick={() => { setCalendarMonth(new Date()); setCalendarDate(formatLocalDate(new Date())); }} className="px-3 md:px-5 py-2 md:py-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-xs md:text-sm font-bold text-white transition-colors uppercase tracking-widest">Today</button>
                <button onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))} className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"><ChevronRight size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 md:gap-2 w-full">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center py-2 text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">{day}</div>
              ))}
              {calDays.map((d, idx) => {
                const isSelected = d.date === calendarDate;
                const isPast = d.date < today;
                const dayBookings = activeBookings.filter(b => b.date === d.date);
                return (
                  <div
                    key={idx}
                    onClick={() => setCalendarDate(d.date)}
                    className={`min-h-[80px] md:min-h-[100px] p-2 md:p-3 rounded-xl md:rounded-2xl border-2 transition-all cursor-pointer relative group ${!d.isCurrentMonth ? 'opacity-40 bg-slate-900/50 border-transparent' : 'bg-slate-800/30 border-slate-800 hover:border-slate-600'
                      } ${isSelected ? '!border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : ''} ${isPast && !isSelected && d.isCurrentMonth ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <span className={`text-xs md:text-sm font-black ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>{d.dayStr}</span>
                    <div className="mt-1 md:mt-2 flex flex-col space-y-1">
                      {dayBookings.slice(0, 3).map(b => (
                        <div key={b.id} className="flex items-center space-x-1 md:space-x-1.5">
                          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${studioColors[b.studio] || 'bg-slate-500'}`} />
                          <span className="text-[8px] md:text-[9px] font-bold text-slate-400 truncate leading-none">
                            {b.projectCode ? `[${b.projectCode}] ` : ''}{b.project || b.title}
                          </span>
                        </div>
                      ))}
                      {dayBookings.length > 3 && <span className="text-[9px] md:text-[10px] text-slate-500 font-bold ml-2 md:ml-3">+{dayBookings.length - 3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h3 className="text-xl font-black text-white flex items-center">
                  <Calendar size={24} className="mr-3 text-indigo-400 shrink-0" />
                  Schedule for {new Date(calendarDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={copyScheduleBrief}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-black tracking-widest transition-all shadow-lg"
                >
                  <ClipboardCopy size={16} />
                  COPY BRIEF
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {STUDIO_ROOMS.map(room => {
                const roomBookings = activeBookings
                  .filter(b => b.date === calendarDate && b.studio === room)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                return (
                  <div key={room} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col h-full shadow-xl">
                    <div className="border-b border-slate-800 pb-4 mb-5">
                      <h3 className="font-black text-lg text-white flex items-center uppercase tracking-widest">
                        <div className={`w-4 h-4 rounded-md mr-3 ${studioColors[room]}`}></div>
                        {room}
                      </h3>
                    </div>
                    <div className="space-y-4 flex-1">
                      {roomBookings.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-slate-600 border-2 border-slate-800 border-dashed rounded-2xl font-medium">No bookings for this date.</div>
                      ) : (
                        roomBookings.map(booking => (
                          <div key={booking.id} className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 group relative shadow-md ${booking.date < today ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg tracking-widest">
                                {booking.startTime} - {booking.endTime}
                              </span>
                              {currentUserProfile.isAdmin && (
                                <div className="flex items-center space-x-2">
                                  <button onClick={(e) => { e.stopPropagation(); duplicateBooking(booking); }} className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all" title="Duplicate Booking">
                                    <Copy size={16} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setShowBookingModal(booking); }} className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all" title="Edit Booking">
                                    <Edit size={16} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); moveToVault(booking.id); }} className="p-2 text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all" title="Vault Booking">
                                    <Archive size={16} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id); }} className="p-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Delete Booking">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col mb-4 mt-2">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{booking.project}</h4>
                                {booking.projectCode && (
                                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded font-black tracking-widest leading-none">
                                    {booking.projectCode}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">{booking.productionHouse}</p>
                            </div>
                            <div className="space-y-2 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                              {booking.director && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DIR</strong>{booking.director}</p>}
                              {booking.dop && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DOP</strong>{booking.dop}</p>}
                              {booking.postProducer && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">POST</strong>{booking.postProducer}</p>}
                              {booking.deliverables && <p className="text-[11px] text-slate-400"><strong className="text-slate-500 uppercase tracking-widest mr-2">DELV</strong>{booking.deliverables}</p>}
                            </div>
                            <div className="flex justify-between items-end pt-3 border-t border-slate-700/50 mt-auto">
                              <div className="flex flex-col">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center mb-1">
                                  <UserCircle size={14} className="mr-1.5 text-indigo-400" /> Colorist
                                </p>
                                <span className="text-white text-sm font-black tracking-tight">{getUserName(booking.coloristId)}</span>
                              </div>
                              <div className="flex flex-col items-end space-y-1.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{booking.date}</span>
                                  <span className="text-[9px] font-black bg-slate-900 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-lg font-mono tracking-tighter shadow-inner">
                                    BID-{(booking.id || '').slice(0, 6).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                                    CR: <span className="text-slate-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '--'}</span>
                                  </p>
                                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">
                                    MD: <span className="text-slate-500">{booking.lastModified ? new Date(booking.lastModified).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '--'}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {calendarView === 'list' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-8 animate-in fade-in">
          {upcomingDates.length === 0 && pastDates.length === 0 && (
            <div className="text-center p-16 bg-slate-900 rounded-3xl border border-slate-800 border-dashed">
              <Calendar size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium text-lg">No bookings yet.</p>
            </div>
          )}
          {upcomingDates.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Upcoming</p>
              <div className="space-y-3">
                {upcomingDates.map(d => <DaySection key={d} dateStr={d} isSelected={d === calendarDate} />)}
              </div>
            </div>
          )}
          {pastDates.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Past</p>
              <div className="space-y-3">
                {pastDates.map(d => <DaySection key={d} dateStr={d} isSelected={d === calendarDate} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WEEK VIEW */}
      {calendarView === 'week' && (
        <div className="flex-1 flex flex-col space-y-6 pb-8 animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg shrink-0">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3 w-full md:w-auto overflow-hidden">
              <Calendar size={20} className="text-indigo-400 shrink-0" />
              <span className="truncate">Week Grid View</span>
            </h3>
            <div className="flex space-x-2 shrink-0 overflow-x-auto custom-scrollbar w-full md:w-auto">
              <button 
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setDate(d.getDate() - (isMobileGrid ? 4 : 7));
                  setCalendarDate(formatLocalDate(d));
                }} 
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700 shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCalendarDate(formatLocalDate(new Date()))} 
                className="px-5 py-2.5 bg-slate-800 hover:bg-indigo-600 rounded-xl text-xs font-bold text-white transition-colors uppercase tracking-widest border border-slate-700 shrink-0"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setDate(d.getDate() + (isMobileGrid ? 4 : 7));
                  setCalendarDate(formatLocalDate(d));
                }} 
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700 shrink-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col relative">
            <div className="w-full relative z-0">
              <div className="w-full flex flex-col">
                <div className="flex border-b border-slate-800 bg-slate-900/95 sticky top-[-1px] z-[60] backdrop-blur-xl shadow-lg rounded-t-3xl border-t border-slate-700/50 mt-[-1px]">
                  <div className="w-12 md:w-20 shrink-0 border-r border-slate-800 bg-transparent z-50" />
                  <div className={`flex-1 grid ${isMobileGrid ? 'grid-cols-4' : 'grid-cols-7'} relative z-10`}>
                    {weekDays.map((dStr, i) => {
                      const d = new Date(dStr);
                      const isToday = dStr === today;
                      return (
                        <div key={i} className="py-2 md:py-4 px-0.5 md:px-2 text-center border-r border-slate-800/50 last:border-r-0 flex flex-col items-center overflow-hidden">
                          <span className={`text-[9px] md:text-xs font-black uppercase tracking-widest ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {d.toLocaleDateString('en-GB', { weekday: 'short' })}
                          </span>
                          <div className={`mt-1.5 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-black transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-200'}`}>
                            {d.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 bg-slate-900 rounded-b-3xl">
                  <div className="flex relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                    <div className="w-12 md:w-20 shrink-0 border-r border-slate-800 bg-slate-900/90 backdrop-blur-sm z-40">
                      {HOURS.map(hour => (
                        <div key={hour} className="text-[9px] md:text-[10px] font-bold text-slate-500 text-right pr-1.5 md:pr-3 -mt-2.5 absolute w-full" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}>
                          {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 relative">
                      {HOURS.map(hour => (
                        <div key={hour} className="absolute w-full border-t border-slate-800/60 pointer-events-none" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }} />
                      ))}
                      {HOURS.map(hour => (
                        <div key={`half-${hour}`} className="absolute w-full border-t border-slate-800/20 border-dashed pointer-events-none" style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + 30}px` }} />
                      ))}

                      <div className={`grid ${isMobileGrid ? 'grid-cols-4' : 'grid-cols-7'} absolute inset-0 h-full`}>
                        {weekDays.map((dStr, i) => {
                          const rawDayBookings = activeBookings.filter(b => b.date === dStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                          const dayBookings = calculateOverlaps(rawDayBookings);
                          const isPast = dStr < today;
                          
                          return (
                            <div key={i} className={`relative border-r border-slate-800/50 last:border-r-0 ${isPast ? 'bg-slate-950/40' : ''}`}>
                              {dStr === today && (
                                <div className="absolute w-full border-t-2 border-emerald-500 z-30 pointer-events-none" style={{ top: `${(new Date().getHours() - START_HOUR) * HOUR_HEIGHT + new Date().getMinutes()}px` }}>
                                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                              )}

                              <div className="absolute inset-0 pt-0">
                                {dayBookings.map(b => {
                                  const { top, height } = getPositionMetrics(b.startTime, b.endTime);
                                  const widthPercent = (1 / b.totalCols) * 100;
                                  const leftPercent = (b.colIndex / b.totalCols) * 100;
                                  const colorClassBase = studioColors[b.studio] || 'bg-slate-500';
                                  const bgColor = colorClassBase.replace('bg-', 'bg-').replace('500', '500/10');
                                  const textColor = colorClassBase.replace('bg-', 'text-').replace('500', '400');
                                  const borderColor = colorClassBase.replace('bg-', 'border-').replace('500', '500/20');
                                  const hoverBorder = colorClassBase.replace('bg-', 'hover:border-').replace('500', '500/40');
                                  const borderLeft = colorClassBase.replace('bg-', 'border-l-');

                                  const minHeightClass = height < 30 ? 'items-center text-[9px]' : 'items-start flex-col';
                                  const dateIsPast = b.date < today;

                                  return (
                                    <div 
                                      key={b.id} 
                                      onClick={() => setShowBookingModal(b)}
                                      className={`absolute rounded-lg border-y border-r border-l-[3px] shadow-sm overflow-hidden transition-transform hover:scale-[1.02] z-10 cursor-pointer p-1.5 flex ${minHeightClass} ${bgColor} ${textColor} ${borderColor} ${hoverBorder} ${borderLeft} ${dateIsPast ? 'opacity-60 grayscale-[0.3]' : ''}`}
                                      style={{ 
                                        top: `${top}px`, 
                                        height: `${height}px`, 
                                        left: `calc(${leftPercent}% + 2px)`,
                                        width: `calc(${widthPercent}% - 4px)`,
                                        zIndex: Math.floor(top) 
                                      }}
                                    >
                                      <div className="font-black text-[10px] md:text-xs leading-none truncate w-full flex items-center justify-between">
                                        <span className="truncate">
                                          {b.projectCode ? `[${b.projectCode}] ` : ''}{b.project}
                                        </span>
                                      </div>
                                      {height >= 45 && (
                                        <>
                                          <div className="font-medium text-[9px] md:text-[10px] truncate opacity-90 mt-0.5 max-w-full text-slate-300">
                                            {b.productionHouse}
                                          </div>
                                          <div className="flex flex-wrap flex-col items-start mt-auto pt-1 gap-y-0.5 text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-80">
                                            <span className="flex items-center gap-0.5"><Clock size={9} /> {b.startTime}-{b.endTime}</span>
                                            <span className="flex items-center gap-0.5">{b.studio}</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg md:text-xl font-black text-white flex items-center uppercase tracking-widest">
                <Calendar size={20} className="mr-3 text-indigo-400" /> 
                {showBookingModal.isDuplicate ? 'Duplicate Booking' : (showBookingModal.isRevive ? 'Revive Booking' : (showBookingModal.isRestore ? 'Restore Booking' : (showBookingModal.id ? 'Edit Booking' : 'Studio Booking')))}
                {(showBookingModal.id || showBookingModal.isDuplicate || showBookingModal.isRevive) && (
                  <span className="ml-4 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded truncate max-w-[120px]">
                    {showBookingModal.isDuplicate ? 'NEW_CLONE' : (showBookingModal.isRevive ? 'NEW_REVIVE' : `ID: ${(showBookingModal.id || '').slice(0, 6).toUpperCase()}`)}
                  </span>
                )}
              </h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <form 
              noValidate
              ref={formRef} 
              onSubmit={handleBookingSubmit} 
              onChange={validateModalForm}
              className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar"
            >
              {modalValidation.isMissingFields && (
                <div className="p-4 rounded-xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-slate-500/10 border-slate-500/30">
                  <AlertCircle size={20} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                      Incomplete Form Details
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Please review the date or text inputs. Complete all required fields to proceed.
                    </p>
                  </div>
                </div>
              )}
              {modalValidation.isIdentical && !showBookingModal.isRestore && !showBookingModal.isRevive && (
                <div className="p-4 rounded-xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-amber-500/10 border-amber-500/30">
                  <AlertCircle size={20} className="text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-amber-500">
                      Identical Booking Detected
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      This exact booking (Same Room, Time, Date & Artist) already exists in the system.
                    </p>
                  </div>
                </div>
              )}
              {modalValidation.isUnchangedRevive && (showBookingModal.isRestore || showBookingModal.isRevive) && (
                <div className="p-4 rounded-xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-rose-500/10 border-rose-500/30">
                  <AlertCircle size={20} className="text-rose-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-rose-500">
                      Parameters Unchanged
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      You must change at least one parameter (Room, Time, Date, or Artist) to proceed.
                    </p>
                  </div>
                </div>
              )}
              {modalValidation.isPastRevive && showBookingModal.isRevive && (
                <div className="p-4 rounded-xl border-2 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 bg-red-500/10 border-red-500/30">
                  <AlertCircle size={20} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-red-500">
                      Invalid Timeline
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Cannot revive a booking into the past. Date and Time must be currently active or in the future.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Production House / Client</label>
                  <input name="productionHouse" defaultValue={showBookingModal?.productionHouse || ''} list="ph-list" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="SG Pictures" required />
                  <datalist id="ph-list">
                    {[...new Set(projects.map(p => p.client))].filter(Boolean).map(ph => <option key={ph} value={ph} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Project Code</label>
                  <input 
                    name="projectCode" 
                    defaultValue={showBookingModal?.projectCode || ''} 
                    list="project-code-list" 
                    onChange={(e) => handleProjectFieldChange('projectCode', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors font-mono" 
                    placeholder="STEM-001" 
                    required 
                  />
                  <datalist id="project-code-list">
                    {projects.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Project Name</label>
                  <input 
                    name="projectName" 
                    defaultValue={showBookingModal?.project || showBookingModal?.projectName || ''} 
                    list="project-name-list" 
                    onChange={(e) => handleProjectFieldChange('projectName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                    placeholder="Project Alpha" 
                    required 
                  />
                  <datalist id="project-name-list">
                    {projects.map(p => <option key={p.id} value={p.name}>{p.code}</option>)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Director</label>
                  <input name="director" defaultValue={showBookingModal?.director || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">DOP</label>
                  <input name="dop" defaultValue={showBookingModal?.dop || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Post Producer</label>
                  <input name="postProducer" defaultValue={showBookingModal?.postProducer || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Client Phone</label>
                  <input name="clientPhone" defaultValue={showBookingModal?.clientPhone || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+91..." />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Client Email</label>
                  <input name="clientEmail" type="email" defaultValue={showBookingModal?.clientEmail || ''} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="post@studio.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1">Commercial Billing Treatment</label>
                  <select 
                    name="commercialStatus" 
                    defaultValue={showBookingModal?.commercialStatus || 'Billable'} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="Billable">✓ Standard Billable (Direct Invoicing)</option>
                    <option value="FOC / Complimentary">🎁 FOC / Complimentary (100% Waived on Bill / Full Artist Credit)</option>
                    <option value="Package Included">📦 Package Included (Fixed Project Retainer)</option>
                    <option value="Overtime">⚡ Overtime / Weekend Rush Session</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 px-1">FOC sessions are itemized at ₹0 to client while recording 100% artist labor.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Billing Rate (INR / Hour)</label>
                  <input 
                    name="hourlyRate" 
                    type="number" 
                    defaultValue={showBookingModal?.hourlyRate || 5000} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono font-bold" 
                    placeholder="5000" 
                  />
                  <p className="text-[10px] text-slate-500 mt-1 px-1">Standard Studio Tunnel hourly commercial rate.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Deliverables</label>
                <textarea name="deliverables" defaultValue={showBookingModal?.deliverables || ''} rows="2" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Master, 6 films x 45 sec each"></textarea>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Room</label>
                  <select name="studio" defaultValue={showBookingModal?.studio || 'Studio 01'} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                    {STUDIO_ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Date</label>
                  <input name="date" type="date" defaultValue={showBookingModal?.date || today} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Start Time</label>
                  <input name="startTime" type="time" defaultValue={showBookingModal?.startTime || '10:00'} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">End Time</label>
                  <input name="endTime" type="time" defaultValue={showBookingModal?.endTime || '20:00'} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Colorist / Lead</label>
                <select name="coloristId" defaultValue={showBookingModal?.coloristId || 'unassigned'} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors">
                  <option value="unassigned">Unassigned</option>
                  {users?.filter(u => u.role?.toLowerCase().includes('colorist')).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center gap-4 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowBookingModal(false)} className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all uppercase tracking-widest text-sm">Cancel</button>
                <button type="submit" className="flex-[2] px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest text-sm">
                  {showBookingModal.isRevive ? 'Revive Booking' : (showBookingModal.isRestore ? 'Restore Booking' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {calendarView === 'vault' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-8 animate-in fade-in">
          
          <div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl mb-6">
              <h3 className="text-amber-400 font-black tracking-widest uppercase flex items-center"><Archive size={20} className="mr-2" /> Vault & Recovery</h3>
              <p className="text-slate-400 text-sm mt-1">Access historic finished bookings or restore deleted bookings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Historic Bookings Section (Left) */}
              <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 h-full min-h-[400px]">
                <h4 className="text-slate-300 font-black tracking-widest uppercase mb-6 flex items-center border-b border-slate-700/50 pb-4"><Archive size={18} className="mr-3"/> Historic & Finished</h4>
                {vaultedBookings.length === 0 ? (
                  <div className="text-center p-12 bg-slate-800/30 border border-slate-700/50 rounded-3xl border-dashed"><p className="text-slate-500 font-medium">No historic bookings archived.</p></div>
                ) : (
                  <div className="flex flex-col gap-4">
                     {vaultedBookings.sort((a,b) => b.date.localeCompare(a.date)).map(b => (
                         <div key={b.id} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="text-white font-bold text-base leading-tight uppercase tracking-tight">{b.project}</h4>
                                    {b.projectCode && (
                                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded font-black tracking-widest leading-none">
                                            {b.projectCode}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 mb-3">{b.studio}</p>
                                <p className="text-xs text-slate-400"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mr-1">Date:</span>{b.date}</p>
                                <p className="text-xs text-slate-400 mt-1"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mr-1">Time:</span>{b.startTime} - {b.endTime}</p>
                            </div>
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-4 pt-3 border-t border-slate-800">Archived: {b.vaultedAt ? new Date(b.vaultedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Auto-Archived (Past Date)'}</p>
                            <button onClick={() => reviveBooking(b)} className="w-full flex justify-center items-center py-3 bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest mt-4">
                                <RefreshCw size={14} className="mr-2" /> REVIVE
                            </button>
                         </div>
                     ))}
                  </div>
                )}
              </div>

              {/* Deleted Bookings Section (Right) */}
              <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 h-full min-h-[400px]">
                <h4 className="text-red-400 font-black tracking-widest uppercase mb-6 flex items-center border-b border-red-500/20 pb-4"><Trash2 size={18} className="mr-3"/> Recycle Bin</h4>
                {deletedBookings.length === 0 ? (
                  <div className="text-center p-12 bg-slate-800/30 border border-slate-700/50 rounded-3xl border-dashed"><p className="text-slate-500 font-medium">No deleted bookings.</p></div>
                ) : (
                  <div className="flex flex-col gap-4">
                     {deletedBookings.sort((a,b) => b.date.localeCompare(a.date)).map(b => (
                         <div key={b.id} className="bg-slate-900 border border-red-900/30 hover:border-red-500/40 transition-colors rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                           <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-white font-bold text-base leading-tight uppercase tracking-tight">{b.project}</h4>
                                {b.projectCode && (
                                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded font-black tracking-widest leading-none">
                                        {b.projectCode}
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1 mb-3">{b.studio}</p>
                            <p className="text-xs text-slate-400"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mr-1">Date:</span>{b.date}</p>
                            <p className="text-xs text-slate-400 mt-1"><span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] mr-1">Time:</span>{b.startTime} - {b.endTime}</p>
                           </div>
                            <button onClick={() => restoreBooking(b)} className="w-full flex justify-center items-center py-3 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest mt-5">
                                <Undo2 size={14} className="mr-2" /> RESTORE
                            </button>
                         </div>
                     ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal 
        isOpen={!!showDeleteConfirmation}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirmation(null)}
        bookingName={bookings.find(b => b.id === showDeleteConfirmation)?.project}
      />
    </div>
  );
}

function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, bookingName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Trash2 size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Cancel Booking?</h3>
          <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
            Are you sure you want to cancel the booking for <span className="text-white font-bold">{bookingName || 'this project'}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex border-t border-slate-800">
          <button 
            onClick={onCancel}
            className="flex-1 py-6 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors border-r border-slate-800"
          >
            Go Back
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-6 text-red-500 hover:bg-red-500 hover:text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudioBookings;
