import React, { useState, useMemo } from 'react';
import { 
  Calendar, Plus, ChevronLeft, ChevronRight, Edit, Trash2, Copy, ClipboardCopy, UserCircle, AlertCircle, Archive, Undo2, RefreshCw, Clock, ArrowLeftRight, GripVertical
} from 'lucide-react';
import { 
  collection, addDoc, updateDoc, doc, deleteDoc 
} from 'firebase/firestore';
import { sendOpsAlert, sendDirectUserAlert } from '../services/ntfy';
import { hasPermission, PERMISSIONS, ROLES } from './users';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const studioColors = {
  'Studio 01': 'bg-indigo-500',
  'Studio 02': 'bg-emerald-500',
  'Studio 03': 'bg-rose-500',
  'Studio 04': 'bg-amber-500'
};
const STUDIO_ROOMS = ['Studio 01', 'Studio 02', 'Studio 03', 'Studio 04'];

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
  const [calendarView, setCalendarView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(formatLocalDate(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(null);
  const [modalValidation, setModalValidation] = useState({ isIdentical: false });
  const [statusFilter, setStatusFilter] = useState('all');
  const [coloristFilter, setColoristFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedBooking, setDraggedBooking] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [activeSwapSource, setActiveSwapSource] = useState(null);
  const [showSwapModal, setShowSwapModal] = useState(null);
  const [swapColoristsToggle, setSwapColoristsToggle] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const [optimisticOverrides, setOptimisticOverrides] = useState({});

  const canManageBookings = Boolean(
    currentUserProfile && (
      currentUserProfile.isAdmin ||
      currentUserProfile.role === ROLES.LINE_PRODUCER
    )
  );

  const currentDate = formatLocalDate(new Date());
  const activeBookings = useMemo(() => {
    return bookings
      .filter(b => !b.isDeleted && !b.isVaulted)
      .map(b => optimisticOverrides[b.id] ? { ...b, ...optimisticOverrides[b.id] } : b);
  }, [bookings, optimisticOverrides]);
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
    const targetBooking = bookings.find(b => b.id === showDeleteConfirmation);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', showDeleteConfirmation), {
        isDeleted: true,
        deletedAt: new Date().toISOString()
      });
      showToast('Booking moved to Vault (Recycle Bin)', 'success');
      setShowDeleteConfirmation(null);

      if (syncToGoogleSheets && targetBooking) {
        try {
          syncToGoogleSheets('deleteBooking', {
            id: showDeleteConfirmation,
            project: targetBooking.project,
            projectName: targetBooking.project,
            date: targetBooking.date,
            studio: targetBooking.studio
          }, 'booking');
        } catch (syncErr) {
          console.error('Error syncing booking deletion to Sheets:', syncErr);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error cancelling booking', 'error');
    }
  };

  const handleInterchangeBookings = async (bookingA, bookingB, swapColorists = false) => {
    if (!bookingA || !bookingB || bookingA.id === bookingB.id || !db) return;

    // 1. Instant optimistic swap for zero-lag game-like UI response
    setOptimisticOverrides(prev => ({
      ...prev,
      [bookingA.id]: {
        studio: bookingB.studio,
        startTime: bookingB.startTime,
        endTime: bookingB.endTime,
        ...(swapColorists ? { coloristId: bookingB.coloristId } : {})
      },
      [bookingB.id]: {
        studio: bookingA.studio,
        startTime: bookingA.startTime,
        endTime: bookingA.endTime,
        ...(swapColorists ? { coloristId: bookingA.coloristId } : {})
      }
    }));

    try {
      const updateA = {
        studio: bookingB.studio,
        startTime: bookingB.startTime,
        endTime: bookingB.endTime,
        lastModified: new Date().toISOString()
      };
      const updateB = {
        studio: bookingA.studio,
        startTime: bookingA.startTime,
        endTime: bookingA.endTime,
        lastModified: new Date().toISOString()
      };

      if (swapColorists) {
        updateA.coloristId = bookingB.coloristId;
        updateB.coloristId = bookingA.coloristId;
      }

      await Promise.all([
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingA.id), updateA),
        updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', bookingB.id), updateB)
      ]);

      showToast(`Swapped: ${bookingA.project} (${bookingB.studio}, ${bookingB.startTime}–${bookingB.endTime}) ⇄ ${bookingB.project} (${bookingA.studio}, ${bookingA.startTime}–${bookingA.endTime})`, 'success');

      if (syncToGoogleSheets) {
        try {
          syncToGoogleSheets('update', { id: bookingA.id, ...bookingA, ...updateA, projectName: bookingA.project }, 'booking');
          syncToGoogleSheets('update', { id: bookingB.id, ...bookingB, ...updateB, projectName: bookingB.project }, 'booking');
        } catch (err) {
          console.error('Sheets sync error on swap:', err);
        }
      }

      sendOpsAlert(
        `🔄 Bookings Interchanged: ${bookingA.project} ⇄ ${bookingB.project}`,
        `${bookingA.project} is now in ${bookingB.studio} (${bookingB.startTime}–${bookingB.endTime}). ${bookingB.project} is now in ${bookingA.studio} (${bookingA.startTime}–${bookingA.endTime}).`
      );

      if (bookingA.coloristId) {
        sendDirectUserAlert(
          bookingA.coloristId,
          `🔄 Studio Session Rescheduled`,
          `${bookingA.project} on ${bookingA.date} moved to ${bookingB.studio} (${bookingB.startTime}–${bookingB.endTime}).`
        );
      }
      if (bookingB.coloristId && bookingB.coloristId !== bookingA.coloristId) {
        sendDirectUserAlert(
          bookingB.coloristId,
          `🔄 Studio Session Rescheduled`,
          `${bookingB.project} on ${bookingB.date} moved to ${bookingA.studio} (${bookingA.startTime}–${bookingA.endTime}).`
        );
      }
    } catch (e) {
      console.error('Interchange error:', e);
      showToast('Error interchanging bookings', 'error');
    }
  };

  const handleMoveBookingToRoom = async (booking, targetRoom) => {
    if (!booking || !targetRoom || booking.studio === targetRoom || !db) return;

    // Check if targetRoom has an overlapping booking on the same date
    const sameRoomBookings = activeBookings.filter(b => 
      b.id !== booking.id && 
      b.date === booking.date && 
      b.studio === targetRoom
    );

    const conflictingBooking = sameRoomBookings.find(b => 
      (booking.startTime < b.endTime && booking.endTime > b.startTime)
    );

    if (conflictingBooking) {
      setShowSwapModal(booking);
      showToast(`${targetRoom} already has ${conflictingBooking.project} (${conflictingBooking.startTime}–${conflictingBooking.endTime}). Select to interchange!`, 'info');
      return;
    }

    // Instant optimistic move
    setOptimisticOverrides(prev => ({
      ...prev,
      [booking.id]: { studio: targetRoom }
    }));

    try {
      const updateData = {
        studio: targetRoom,
        lastModified: new Date().toISOString()
      };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bookings', booking.id), updateData);
      showToast(`Moved ${booking.project} to ${targetRoom} (${booking.startTime}–${booking.endTime})`, 'success');

      if (syncToGoogleSheets) {
        try {
          syncToGoogleSheets('update', { id: booking.id, ...booking, ...updateData, projectName: booking.project }, 'booking');
        } catch (err) {
          console.error('Sheets sync error on move:', err);
        }
      }

      sendOpsAlert(
        `📍 Booking Moved: ${booking.project} to ${targetRoom}`,
        `${booking.project} on ${booking.date} (${booking.startTime}–${booking.endTime}) moved to ${targetRoom}.`
      );
    } catch (e) {
      console.error('Move error:', e);
      showToast('Error moving booking', 'error');
    }
  };

  const playSound = (type = 'swap') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'swap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {}
  };

  const handleCardPointerDown = (e, booking) => {
    if (!canManageBookings) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('a')) {
      return;
    }

    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const initialDragState = {
      booking,
      width: rect.width,
      height: rect.height,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
    };

    let hasStartedDragging = false;

    const onPointerMove = (moveEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!hasStartedDragging && dist > 3) {
        hasStartedDragging = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        playSound('pickup');
        setDragState({
          ...initialDragState,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
          isDragging: true
        });
      }

      if (hasStartedDragging) {
        if (moveEvent.cancelable) moveEvent.preventDefault();

        setDragState(prev => ({
          ...(prev || initialDragState),
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
          isDragging: true
        }));

        const elemUnder = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        if (elemUnder) {
          const targetCard = elemUnder.closest('[data-booking-id]');
          if (targetCard) {
            const targetId = targetCard.getAttribute('data-booking-id');
            if (targetId && targetId !== booking.id) {
              const targetBooking = activeBookings.find(b => b.id === targetId);
              if (targetBooking) {
                setHoverTarget({ type: 'booking', booking: targetBooking, room: targetBooking.studio });
                return;
              }
            }
          }

          const targetRoom = elemUnder.closest('[data-room-id]');
          if (targetRoom) {
            const roomId = targetRoom.getAttribute('data-room-id');
            if (roomId) {
              setHoverTarget({ type: 'room', room: roomId });
              return;
            }
          }
        }
        setHoverTarget(null);
      }
    };

    const onPointerUp = (upEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (hasStartedDragging) {
        const elemUnder = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        let targetHandled = false;

        if (elemUnder) {
          const targetCard = elemUnder.closest('[data-booking-id]');
          if (targetCard) {
            const targetId = targetCard.getAttribute('data-booking-id');
            if (targetId && targetId !== booking.id) {
              const targetBooking = activeBookings.find(b => b.id === targetId);
              if (targetBooking) {
                playSound('swap');
                handleInterchangeBookings(booking, targetBooking, swapColoristsToggle);
                targetHandled = true;
              }
            }
          }

          if (!targetHandled) {
            const targetRoom = elemUnder.closest('[data-room-id]');
            if (targetRoom) {
              const roomId = targetRoom.getAttribute('data-room-id');
              if (roomId && roomId !== booking.studio) {
                playSound('drop');
                handleMoveBookingToRoom(booking, roomId);
                targetHandled = true;
              }
            }
          }
        }
      }

      setDragState(null);
      setHoverTarget(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };
  const formRef = React.useRef(null);

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

  const today = formatLocalDate(new Date());

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

    const toMinutes = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h < 6 ? h + 24 : h) * 60 + (m || 0);
    };

    const newStartMin = toMinutes(newStart);
    const newEndMin = toMinutes(newEnd);

    if (newStartMin >= newEndMin) {
      showToast('Invalid time range. Start time must be before end time.', 'error');
      return;
    }

    const hasConflict = activeBookings.some(b => {
      if (isEdit && b.id === bookingId) return false;
      if (b.studio !== newStudio || b.date !== newDate) return false;
      const bStartMin = toMinutes(b.startTime);
      const bEndMin = toMinutes(b.endTime);
      return (newStartMin < bEndMin) && (newEndMin > bStartMin);
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
        `${bookingData.project} on ${bookingData.date} (${bookingData.startTime}-${bookingData.endTime}) in ${bookingData.studio || 'Studio'}. Colorist: ${getUserName(bookingData.coloristId) || 'TBD'}.`
      );
      if (bookingData.coloristId) {
        sendDirectUserAlert(
          bookingData.coloristId,
          `📅 Studio Session Scheduled`,
          `${bookingData.project} on ${bookingData.date} (${bookingData.startTime}-${bookingData.endTime}) in ${bookingData.studio || 'Studio'}.`
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
        {canManageBookings && (
          <div className="flex items-center space-x-2">
            <button onClick={() => { setActiveSwapSource(booking); setShowSwapModal(booking); }} className="text-slate-300 hover:text-cyan-400 transition-colors bg-slate-900/50 p-2 rounded-xl" title="Interchange / Swap Room & Timing"><ArrowLeftRight size={16} /></button>
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

  return (
    <div className="w-full flex flex-col animate-in fade-in space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white">Studio Bookings</h2>
          <p className="text-slate-400 font-medium text-sm md:text-base">Manage studio availability and daily schedules.</p>
        </div>
        <div className="flex flex-row gap-2 shrink-0 items-center w-full md:w-auto mt-2 md:mt-0 justify-end">
          {calendarView === 'vault' ? (
            <button 
              onClick={() => setCalendarView('month')} 
              className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-colors flex items-center shadow-lg"
            >
              <Calendar size={14} className="mr-1.5 md:mr-2" /> CALENDAR
            </button>
          ) : (
            <button 
              onClick={() => setCalendarView('vault')} 
              className="flex-1 md:flex-none justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-colors flex items-center shadow-lg"
            >
              <Archive size={14} className="mr-1.5 md:mr-2" /> VAULT
            </button>
          )}
          {canManageBookings && (
            <button 
              onClick={() => setShowBookingModal(true)} 
              className="flex-[2] md:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-colors flex items-center shadow-lg"
            >
              <Plus size={14} className="mr-1.5 md:mr-2" /> ADD BOOKING
            </button>
          )}
        </div>
      </header>

      {/* MONTHLY CALENDAR VIEW */}
      {calendarView === 'month' && (
        <div className="w-full flex flex-col space-y-8 pb-8 animate-in fade-in">
          <div className="shrink-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-xl font-black text-white flex items-center">
                    <Calendar size={24} className="mr-3 text-indigo-400 shrink-0" />
                    Schedule for {(() => {
                      const [y, m, d] = (calendarDate || '').split('-').map(Number);
                      const dt = y && m && d ? new Date(y, m - 1, d) : new Date();
                      return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </h3>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m, d] = calendarDate.split('-').map(Number);
                        const prevDate = new Date(y, m - 1, d - 1);
                        setCalendarDate(formatLocalDate(prevDate));
                        setCalendarMonth(prevDate);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors border border-slate-700"
                      title="Previous Day"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setCalendarDate(formatLocalDate(now));
                        setCalendarMonth(now);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider text-white transition-colors border border-slate-700"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m, d] = calendarDate.split('-').map(Number);
                        const nextDate = new Date(y, m - 1, d + 1);
                        setCalendarDate(formatLocalDate(nextDate));
                        setCalendarMonth(nextDate);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors border border-slate-700"
                      title="Next Day"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700/60 transition-colors select-none">
                  <input 
                    type="checkbox" 
                    checked={swapColoristsToggle} 
                    onChange={(e) => setSwapColoristsToggle(e.target.checked)} 
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500" 
                  />
                  <span>Swap colorists</span>
                </label>
                <button
                  onClick={copyScheduleBrief}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-black tracking-widest transition-all shadow-lg"
                >
                  <ClipboardCopy size={16} />
                  COPY BRIEF
                </button>
              </div>
            </div>
            {activeSwapSource && (
              <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-2 border-cyan-500/50 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
                    <ArrowLeftRight size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                      <span>Interchange Mode Active</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                        {activeSwapSource.studio} • {activeSwapSource.startTime}–{activeSwapSource.endTime}
                      </span>
                    </p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      Click another booking to interchange Room & Timing with <span className="text-cyan-300 font-black">[{activeSwapSource.project}]</span>, or click an empty studio to move.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                  <button
                    onClick={() => setShowSwapModal(activeSwapSource)}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    Open Swap Dialog
                  </button>
                  <button
                    onClick={() => setActiveSwapSource(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {STUDIO_ROOMS.map(room => {
                const roomBookings = activeBookings
                  .filter(b => b.date === calendarDate && b.studio === room)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const isRoomHovered = hoverTarget?.type === 'room' && hoverTarget.room === room && dragState?.booking?.studio !== room;
                const activeDraggingBooking = dragState?.booking;

                return (
                  <div 
                    key={room}
                    data-room-id={room}
                    className={`bg-slate-900 rounded-3xl border p-6 flex flex-col h-full shadow-xl transition-all ${
                      isRoomHovered 
                        ? 'border-2 border-emerald-400 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.35)] scale-[1.01]' 
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="border-b border-slate-800 pb-4 mb-5 flex items-center justify-between">
                      <h3 className="font-black text-lg text-white flex items-center uppercase tracking-widest">
                        <div className={`w-4 h-4 rounded-md mr-3 ${studioColors[room]}`}></div>
                        {room}
                      </h3>
                      {activeSwapSource && activeSwapSource.studio !== room && (
                        <button
                          onClick={() => {
                            handleMoveBookingToRoom(activeSwapSource, room);
                            setActiveSwapSource(null);
                          }}
                          className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Move Here
                        </button>
                      )}
                    </div>
                    <div className="space-y-4 flex-1">
                      {roomBookings.length === 0 ? (
                        <div 
                          className={`flex flex-col items-center justify-center min-h-[140px] text-center p-4 border-2 border-dashed rounded-2xl transition-all ${
                            isRoomHovered
                              ? 'border-emerald-400 bg-emerald-950/50 text-emerald-300 scale-[1.02] shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                              : activeSwapSource && activeSwapSource.studio !== room
                              ? 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300'
                              : 'border-slate-800 text-slate-600'
                          }`}
                        >
                          {isRoomHovered ? (
                            <div className="text-emerald-300 font-black text-xs uppercase tracking-widest flex items-center gap-2 animate-pulse pointer-events-none">
                              <Plus size={16} /> Release to Place [{activeDraggingBooking?.project}] Here
                            </div>
                          ) : activeSwapSource && activeSwapSource.studio !== room ? (
                            <button
                              onClick={() => {
                                handleMoveBookingToRoom(activeSwapSource, room);
                                setActiveSwapSource(null);
                              }}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95"
                            >
                              <Plus size={14} /> Move [{activeSwapSource.project}] Here
                            </button>
                          ) : (
                            <>
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">No bookings for this date.</span>
                              {canManageBookings && (
                                <span className="text-[10px] text-slate-500 mt-1 font-bold">Drag any booking here to move to {room}</span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {roomBookings.map(booking => {
                            const isBeingDragged = dragState?.booking?.id === booking.id && dragState.isDragging;
                            const isHoveredTarget = hoverTarget?.type === 'booking' && hoverTarget.booking.id === booking.id;
                            const isSwapSource = activeSwapSource?.id === booking.id;
                            const isEligibleSwapTarget = activeSwapSource && activeSwapSource.id !== booking.id;

                            return (
                              <div 
                                key={booking.id} 
                                data-booking-id={booking.id}
                                className={`border rounded-2xl p-5 group relative shadow-md transition-all select-none ${
                                  isBeingDragged 
                                    ? 'opacity-25 scale-95 border-2 border-dashed border-indigo-400 bg-indigo-950/20 shadow-none' :
                                  isHoveredTarget 
                                    ? 'border-2 border-cyan-400 bg-cyan-950/90 shadow-[0_0_40px_rgba(34,211,238,0.7)] scale-[1.04] z-30 ring-4 ring-cyan-400/50' :
                                  isSwapSource 
                                    ? 'border-2 border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(34,211,238,0.4)] ring-2 ring-cyan-500/30' :
                                  isEligibleSwapTarget 
                                    ? 'border-slate-600 hover:border-cyan-400 hover:shadow-lg' :
                                  'bg-slate-800 border-slate-700 hover:border-slate-600'
                                } ${booking.date < today ? 'opacity-60 grayscale-[0.5]' : ''}`}
                              >
                                {/* Game-Like Drag Hover Target Banner */}
                                {isHoveredTarget && (
                                  <div className="animate-in fade-in zoom-in-95 duration-150 mb-3 pointer-events-none">
                                    <div className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xl animate-bounce">
                                      <ArrowLeftRight size={14} className="stroke-[3]" /> RELEASE TO SWAP ROOM & TIMING!
                                    </div>
                                    <div className="text-[10px] font-mono text-cyan-300 bg-slate-950/95 p-2.5 rounded-xl border border-cyan-500/30 space-y-1 mt-1.5 shadow-xl">
                                      <div>➔ <strong className="text-white">{activeDraggingBooking?.project}</strong> gets <span className="text-cyan-400 font-bold">{booking.studio} ({booking.startTime}–{booking.endTime})</span></div>
                                      <div>➔ <strong className="text-white">{booking.project}</strong> gets <span className="text-indigo-300 font-bold">{activeDraggingBooking?.studio} ({activeDraggingBooking?.startTime}–{activeDraggingBooking?.endTime})</span></div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-2">
                                    {canManageBookings && (
                                      <div 
                                        title="🎮 Drag card to another studio or drop onto another booking to interchange timing & room" 
                                        className="text-slate-400 group-hover:text-cyan-400 hover:scale-110 transition-all cursor-grab active:cursor-grabbing p-1 -ml-1 rounded"
                                        onPointerDown={(e) => handleCardPointerDown(e, booking)}
                                        style={{ touchAction: 'none' }}
                                      >
                                        <GripVertical size={16} />
                                      </div>
                                    )}
                                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg tracking-widest">
                                      {booking.startTime} - {booking.endTime}
                                    </span>
                                  </div>
                                  {canManageBookings && (
                                    <div className="flex items-center space-x-1.5">
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          if (activeSwapSource?.id === booking.id) {
                                            setActiveSwapSource(null);
                                          } else {
                                            setActiveSwapSource(booking);
                                            setShowSwapModal(booking);
                                          }
                                        }} 
                                        className={`p-2 rounded-xl transition-all ${
                                          isSwapSource 
                                            ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30' 
                                            : 'text-slate-300 hover:text-cyan-400 hover:bg-cyan-500/10'
                                        }`} 
                                        title="Interchange / Swap Room & Timing"
                                      >
                                        <ArrowLeftRight size={16} />
                                      </button>
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

                                {/* Interactive Click-to-Swap Action Button */}
                                {isEligibleSwapTarget && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInterchangeBookings(activeSwapSource, booking, swapColoristsToggle);
                                      setActiveSwapSource(null);
                                    }}
                                    className="w-full mt-3 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 animate-pulse"
                                  >
                                    <ArrowLeftRight size={14} /> Swap Room & Timing With This
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {isRoomHovered && (
                            <div className="p-3.5 border-2 border-dashed border-emerald-400 bg-emerald-950/40 rounded-2xl text-center text-emerald-300 font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                              <Plus size={16} /> Release to Move [{activeDraggingBooking?.project}] into {room}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MONTHLY CALENDAR OVERVIEW (INTERCHANGED TO BOTTOM) */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 md:p-6 shrink-0 shadow-xl overflow-x-hidden">
            <div className="flex items-center justify-between mb-6 w-full">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest">
                  {monthNames[calMonth]} <span className="text-indigo-400">{calYear}</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">Click any date to view and shuffle studio bookings above</p>
              </div>
              <div className="flex space-x-2 md:space-x-3">
                <button onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))} className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700" title="Previous Month"><ChevronLeft size={20} /></button>
                <button onClick={() => { const now = new Date(); setCalendarMonth(now); setCalendarDate(formatLocalDate(now)); }} className="px-3 md:px-5 py-2 md:py-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-xs md:text-sm font-bold text-white transition-colors uppercase tracking-widest border border-slate-700">Today</button>
                <button onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))} className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700" title="Next Month"><ChevronRight size={20} /></button>
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

      {/* Interchange / Swap Booking Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ArrowLeftRight size={20} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-widest">
                    Interchange Booking
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Swap room & timing with another booking on {showSwapModal.date}, or relocate to an open studio.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowSwapModal(null);
                  setActiveSwapSource(null);
                }} 
                className="text-slate-400 hover:text-white transition-colors p-2 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Source Booking Card */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border-2 border-cyan-500/30 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                    Active Selection
                  </span>
                  <span className="text-xs font-black text-slate-300 font-mono">
                    BID-{(showSwapModal.id || '').slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">{showSwapModal.project}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{showSwapModal.productionHouse}</p>
                
                <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Current Room</span>
                    <span className="text-xs font-black text-indigo-400">{showSwapModal.studio}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Current Time</span>
                    <span className="text-xs font-black text-slate-200">{showSwapModal.startTime} – {showSwapModal.endTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Colorist</span>
                    <span className="text-xs font-black text-slate-200">{getUserName(showSwapModal.coloristId)}</span>
                  </div>
                </div>
              </div>

              {/* Colorist swap toggle */}
              <div className="flex items-center justify-between bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={swapColoristsToggle}
                    onChange={(e) => setSwapColoristsToggle(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Also interchange assigned Colorists (Default: keep artists with their respective projects)</span>
                </label>
              </div>

              {/* Section 1: Interchange with another booking on the same date */}
              <div>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <ArrowLeftRight size={14} className="text-cyan-400" />
                  Interchange With Other Bookings on {showSwapModal.date}
                </h4>

                {activeBookings.filter(b => b.date === showSwapModal.date && b.id !== showSwapModal.id).length === 0 ? (
                  <div className="p-6 text-center text-slate-500 border border-slate-800 border-dashed rounded-2xl text-xs font-medium">
                    No other bookings on this date to interchange with. Use the studio mover below to relocate to another room.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings
                      .filter(b => b.date === showSwapModal.date && b.id !== showSwapModal.id)
                      .sort((a, b) => a.studio.localeCompare(b.studio) || a.startTime.localeCompare(b.startTime))
                      .map(target => (
                        <div key={target.id} className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-black text-white uppercase tracking-tight">{target.project}</span>
                              <span className="text-[10px] font-bold text-slate-400">({target.productionHouse})</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold mt-1">
                              <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{target.studio}</span>
                              <span className="text-slate-300">{target.startTime} – {target.endTime}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">{getUserName(target.coloristId)}</span>
                            </div>

                            {/* Interchange Visual Summary */}
                            <div className="mt-2.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/20 space-y-1">
                              <div>➔ <strong className="text-white">{showSwapModal.project}</strong> takes <strong>{target.studio} ({target.startTime}–{target.endTime})</strong></div>
                              <div>➔ <strong className="text-white">{target.project}</strong> takes <strong>{showSwapModal.studio} ({showSwapModal.startTime}–{showSwapModal.endTime})</strong></div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleInterchangeBookings(showSwapModal, target, swapColoristsToggle);
                              setShowSwapModal(null);
                              setActiveSwapSource(null);
                            }}
                            className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center gap-2"
                          >
                            <ArrowLeftRight size={14} /> Swap Both
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Section 2: Move to an Open Studio */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <Plus size={14} className="text-indigo-400" />
                  Or Move To Another Studio (Keep Timing: {showSwapModal.startTime}–{showSwapModal.endTime})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STUDIO_ROOMS.map(room => {
                    const isCurrent = showSwapModal.studio === room;
                    const hasConflict = activeBookings.some(b => 
                      b.id !== showSwapModal.id && 
                      b.date === showSwapModal.date && 
                      b.studio === room && 
                      (showSwapModal.startTime < b.endTime && showSwapModal.endTime > b.startTime)
                    );
                    return (
                      <button
                        key={room}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          handleMoveBookingToRoom(showSwapModal, room);
                          setShowSwapModal(null);
                          setActiveSwapSource(null);
                        }}
                        className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                          isCurrent
                            ? 'bg-slate-800/30 border-slate-800 text-slate-600 cursor-not-allowed'
                            : hasConflict
                            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500 text-amber-300'
                            : 'bg-slate-800 hover:bg-indigo-600 border-slate-700 text-white shadow-md hover:scale-105 active:scale-95'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-wider">{room}</span>
                        <span className="text-[9px] font-bold mt-1 text-slate-400">
                          {isCurrent ? '(Current)' : hasConflict ? 'Has Overlap' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSwapModal(null);
                  setActiveSwapSource(null);
                }}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {calendarView === 'vault' && (
        <div className="w-full space-y-8 pb-8 animate-in fade-in">
          
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
      {/* GAME-STYLE FLOATING DRAGGED CARD */}
      {dragState && dragState.isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${dragState.currentX - dragState.offsetX}px`,
            top: `${dragState.currentY - dragState.offsetY}px`,
            width: `${dragState.width}px`,
            pointerEvents: 'none',
            zIndex: 999999,
            transform: 'rotate(2.5deg) scale(1.05)',
            filter: 'drop-shadow(0 25px 35px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 30px rgba(99, 102, 241, 0.5))',
            transition: 'transform 0.05s ease-out',
            willChange: 'transform, left, top',
            touchAction: 'none'
          }}
        >
          <div className="bg-slate-900/95 border-2 border-cyan-400 rounded-2xl p-5 shadow-2xl ring-4 ring-cyan-500/30 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-1 rounded-lg tracking-widest flex items-center gap-1.5">
                <Clock size={12} /> {dragState.booking.startTime} – {dragState.booking.endTime}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30 animate-pulse flex items-center gap-1">
                <ArrowLeftRight size={11} /> DRAGGING...
              </span>
            </div>
            <h4 className="text-white font-black text-lg leading-tight uppercase tracking-tight">{dragState.booking.project}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dragState.booking.productionHouse}</p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-700/60 text-[11px] font-bold text-slate-300">
              <span className="text-indigo-400 font-black">{dragState.booking.studio}</span>
              <span className="text-slate-400">{getUserName(dragState.booking.coloristId)}</span>
            </div>
          </div>
        </div>
      )}
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
