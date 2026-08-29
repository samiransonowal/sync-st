import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { logTaskToBackend, getTasksFromBackend, getProjectsFromBackend } from '../api/syncApi';
import '../styles/app.css';

export const AtomicBookingLogger = ({ onComplete }) => {
  const { projects } = useProject();
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    isNewProject: false,
    projectCode: '',
    projectName: '',
    client: '',
    taskType: 'Studio 01 Booking',
    assignedArtist: 'Yash Soni',
    date: new Date().toISOString().slice(0, 10),
    actualHrs: 4.0,
    hourlyRate: 5000,
    isClosed: false,
    notes: ''
  });

  const fetchRecentTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const liveTasks = await getTasksFromBackend();
      setTasks(liveTasks || []);
    } catch (err) {
      console.error("Failed to load atomic tasks:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchRecentTasks();
  }, []);

  const handleProjectSelect = (e) => {
    const val = e.target.value;
    if (val === '__NEW__') {
      setFormData(prev => ({
        ...prev,
        isNewProject: true,
        projectCode: `PJ-${Date.now().toString().slice(-6)}`,
        projectName: '',
        client: ''
      }));
    } else {
      const selected = projects.find(p => p.id === val || p.projectCode === val);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          isNewProject: false,
          projectCode: selected.projectCode || selected.id,
          projectName: selected.projectName || selected.name,
          client: selected.producer || selected.client || ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          isNewProject: false,
          projectCode: val,
          projectName: val,
          client: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName && !formData.projectCode) {
      alert('Please select or enter a Project Name/Code.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        ...formData,
        bookingHrs: formData.actualHrs,
        duration: formData.actualHrs
      };
      
      const res = await logTaskToBackend(payload);
      setFeedback({ type: 'success', message: res.message || 'Studio Booking task logged directly to Atomic_Task_Logs!' });
      
      // Refresh tasks list
      await fetchRecentTasks();
      
      // Reset form fields
      setFormData(prev => ({
        ...prev,
        notes: '',
        actualHrs: 4.0
      }));
    } catch (err) {
      console.error("Error logging booking task:", err);
      setFeedback({ type: 'error', message: err.message || 'Failed to submit booking session.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-col gap-6" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <header className="glass-panel flex-row justify-between" style={{ alignItems: 'center' }}>
        <div>
          <h2 className="text-h2" style={{ margin: 0 }}>Studio Bookings & Atomic Task Logging</h2>
          <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>
            Logs session bookings and work tasks directly to <strong style={{ color: 'var(--status-active)' }}>Atomic_Task_Logs</strong> in LOG BOOK_SYNC.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchRecentTasks} disabled={isLoadingTasks}>
          🔄 {isLoadingTasks ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </header>

      {/* Main Content Grid: Form + Live Logs Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="glass-panel flex-col gap-4" style={{ padding: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 className="text-h3" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--status-active)' }}>
            + Log Studio Booking Session
          </h3>

          {feedback && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: feedback.type === 'success' ? '#10b981' : '#ef4444',
              border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`
            }}>
              {feedback.message}
            </div>
          )}

          {/* Project Selector */}
          <div className="flex-col gap-2">
            <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Project</label>
            <select 
              className="form-control"
              onChange={handleProjectSelect}
              defaultValue=""
              style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
            >
              <option value="" disabled>-- Select Existing Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectName} ({p.projectCode || p.id})
                </option>
              ))}
              <option value="__NEW__">+ Add New Project Booking</option>
            </select>
          </div>

          {/* Separate Project Code and Project Name Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Project Code</label>
              <input 
                type="text"
                required
                className="form-control"
                placeholder="e.g. PJ-1001"
                value={formData.projectCode}
                onChange={e => setFormData(prev => ({ ...prev, projectCode: e.target.value }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Project Name</label>
              <input 
                type="text"
                required
                className="form-control"
                placeholder="e.g. Nike - Run Unleashed"
                value={formData.projectName}
                onChange={e => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          {/* Client Name */}
          <div className="flex-col gap-2">
            <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Company / Client Name</label>
            <input 
              type="text"
              className="form-control"
              placeholder="e.g. Mindshare / Wieden+Kennedy"
              value={formData.client}
              onChange={e => setFormData(prev => ({ ...prev, client: e.target.value }))}
              style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
            />
          </div>

          {/* Task Type & Artist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Task / Booking Type</label>
              <select 
                value={formData.taskType}
                onChange={e => setFormData(prev => ({ ...prev, taskType: e.target.value }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
              >
                <option value="Studio 01 Booking">Studio 01 Booking</option>
                <option value="Studio 02 Booking">Studio 02 Booking</option>
                <option value="Studio 03 Booking">Studio 03 Booking</option>
                <option value="Color Grade">Color Grade</option>
                <option value="Conform Session">Conform Session</option>
                <option value="Assist Session">Assist Session</option>
                <option value="Mastering & QC">Mastering & QC</option>
              </select>
            </div>

            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assigned Artist</label>
              <select 
                value={formData.assignedArtist}
                onChange={e => setFormData(prev => ({ ...prev, assignedArtist: e.target.value }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
              >
                <option value="Yash Soni">Yash Soni</option>
                <option value="Sujith Vijayan">Sujith Vijayan</option>
                <option value="Manoj Sahu">Manoj Sahu</option>
                <option value="Samiran Sonowal">Samiran Sonowal</option>
                <option value="Jay Dantara">Jay Dantara</option>
                <option value="Assistant Artist">Assistant Artist</option>
              </select>
            </div>
          </div>

          {/* Date & Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Task Date</label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)', colorScheme: 'dark' }}
              />
            </div>

            <div className="flex-col gap-2">
              <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Duration (Hours)</label>
              <input 
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={formData.actualHrs}
                onChange={e => setFormData(prev => ({ ...prev, actualHrs: parseFloat(e.target.value) || 0 }))}
                style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex-col gap-2">
            <label className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Session Notes / Scope</label>
            <textarea 
              rows="3"
              placeholder="e.g. SDR grade pass for 30s TVC + HDR master render"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)', resize: 'none' }}
            />
          </div>

          <button 
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}
          >
            {isSubmitting ? 'Logging to LOG BOOK_SYNC...' : 'Submit Session to LOG BOOK_SYNC'}
          </button>
        </form>

        {/* Live Atomic_Task_Logs Table View */}
        <div className="glass-panel flex-col gap-4" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', minHeight: '520px' }}>
          <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
            <h3 className="text-h3" style={{ margin: 0, fontSize: '1.1rem' }}>
              Live Atomic_Task_Logs Records
            </h3>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>
              {tasks.length} total entries
            </span>
          </div>

          {isLoadingTasks ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading task records from Google Sheets...
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No booking or task records found in Atomic_Task_Logs yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.6rem' }}>Date</th>
                    <th style={{ padding: '0.6rem' }}>Project Code</th>
                    <th style={{ padding: '0.6rem' }}>Project Name</th>
                    <th style={{ padding: '0.6rem' }}>Task Type</th>
                    <th style={{ padding: '0.6rem' }}>Artist</th>
                    <th style={{ padding: '0.6rem' }}>Hours</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 20).map((t, idx) => (
                    <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.6rem', whiteSpace: 'nowrap' }}>
                        {t.taskDate ? String(t.taskDate).slice(0, 10) : '—'}
                      </td>
                      <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--status-active)' }}>
                        {t.projectCode || '—'}
                      </td>
                      <td style={{ padding: '0.6rem', fontWeight: 500 }}>
                        {t.projectName || '—'}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                          {t.taskType || 'Booking'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem' }}>{t.assignedArtist || '—'}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 700 }}>{t.actualHrs || 0} hrs</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className="status-badge status-active" style={{ fontSize: '0.7rem' }}>
                          {t.taskStatus || 'Logged'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
