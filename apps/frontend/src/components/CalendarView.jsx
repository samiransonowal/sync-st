import React, { useState, useEffect } from 'react';
import { getTasksFromBackend, getProjectsFromBackend, logTaskToBackend } from '../api/syncApi';
import '../styles/app.css';

export const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    client: '',
    taskType: 'Studio 01 Booking',
    assignedArtist: 'Yash Soni',
    actualHrs: 4.0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projsRes] = await Promise.all([
        getTasksFromBackend(),
        getProjectsFromBackend()
      ]);
      setTasks(tasksRes || []);
      setProjects(projsRes || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => t.taskDate && t.taskDate.startsWith(dateStr));

      days.push(
        <div 
          key={day} 
          className="calendar-day"
          onClick={() => {
            setSelectedDate(dateStr);
            setIsModalOpen(true);
          }}
        >
          <div className="day-number">{day}</div>
          <div className="task-chips">
            {dayTasks.map((t, idx) => (
              <div key={idx} className="task-chip" title={`${t.projectName} - ${t.taskType}`}>
                <div className="task-chip-title">{t.projectName || t.projectCode}</div>
                <div className="task-chip-subtitle">{t.taskType} ({t.actualHrs}h)</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleProjectSelect = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setFormData(prev => ({ ...prev, projectCode: `PJ-${Date.now().toString().slice(-6)}`, projectName: '', client: '' }));
    } else {
      const selected = projects.find(p => p.id === val || p.projectCode === val);
      if (selected) {
        setFormData(prev => ({ ...prev, projectCode: selected.projectCode || selected.id, projectName: selected.projectName || selected.name, client: selected.producer || selected.client || '' }));
      }
    }
  };

  const handleLogBooking = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await logTaskToBackend({
        ...formData,
        date: selectedDate,
        isNewProject: false
      });
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to log booking:', err);
      alert('Failed to save booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="calendar-container flex-col gap-4" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header className="glass-panel flex-row justify-between" style={{ alignItems: 'center' }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Studio Calendar</h2>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>
            Synced directly with LOG BOOK_SYNC
          </p>
        </div>
        <div className="flex-row gap-4" style={{ alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handlePrevMonth}>◀</button>
          <span style={{ fontSize: '1.2rem', fontWeight: 600, minWidth: '150px', textAlign: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn-secondary" onClick={handleNextMonth}>▶</button>
          <button className="btn-secondary" onClick={fetchData} disabled={isLoading}>
            {isLoading ? '🔄 Syncing...' : '🔄 Refresh'}
          </button>
        </div>
      </header>

      <div className="glass-panel calendar-wrapper">
        <div className="calendar-header-row">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="calendar-header-cell">{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {renderCalendarDays()}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="flex-row justify-between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
              <h3 className="text-h3" style={{ margin: 0 }}>Log Booking for {selectedDate}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleLogBooking} className="flex-col gap-4">
              <div className="flex-col gap-2">
                <label className="text-muted">Project</label>
                <select className="form-control" onChange={handleProjectSelect} defaultValue="">
                  <option value="" disabled>-- Select Existing Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.projectCode})</option>
                  ))}
                  <option value="__NEW__">+ Add New Project Booking</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="flex-col gap-2">
                  <label className="text-muted">Project Code</label>
                  <input type="text" required className="form-control" value={formData.projectCode} onChange={e => setFormData(prev => ({...prev, projectCode: e.target.value}))} />
                </div>
                <div className="flex-col gap-2">
                  <label className="text-muted">Project Name</label>
                  <input type="text" required className="form-control" value={formData.projectName} onChange={e => setFormData(prev => ({...prev, projectName: e.target.value}))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="flex-col gap-2">
                  <label className="text-muted">Task / Booking Type</label>
                  <select className="form-control" value={formData.taskType} onChange={e => setFormData(prev => ({...prev, taskType: e.target.value}))}>
                    <option value="Studio 01 Booking">Studio 01 Booking</option>
                    <option value="Studio 02 Booking">Studio 02 Booking</option>
                    <option value="Color Grade">Color Grade</option>
                    <option value="Conform Session">Conform Session</option>
                  </select>
                </div>
                <div className="flex-col gap-2">
                  <label className="text-muted">Assigned Artist</label>
                  <select className="form-control" value={formData.assignedArtist} onChange={e => setFormData(prev => ({...prev, assignedArtist: e.target.value}))}>
                    <option value="Yash Soni">Yash Soni</option>
                    <option value="Sujith Vijayan">Sujith Vijayan</option>
                  </select>
                </div>
              </div>
              <div className="flex-col gap-2">
                <label className="text-muted">Duration (Hours)</label>
                <input type="number" step="0.5" required className="form-control" value={formData.actualHrs} onChange={e => setFormData(prev => ({...prev, actualHrs: parseFloat(e.target.value)}))} />
              </div>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Logging...' : 'Submit Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
