import React, { useState } from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { ProjectDashboard } from './components/ProjectDashboard';
import { RegistrationWizard } from './components/RegistrationWizard';
import { AtomicBookingLogger } from './components/AtomicBookingLogger';
import { CalendarView } from './components/CalendarView';
import './styles/app.css';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'register', 'atomic-logs', or 'calendar'

  return (
    <ProjectProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        
        {/* Navigation / Header */}
        <header className="glass-panel" style={{ 
          margin: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          borderRadius: '16px'
        }}>
          <div>
            <h1 className="text-h1" style={{ margin: 0, fontSize: '1.65rem', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Studio Tunnel
            </h1>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>Operations & Financial Comptroller Command Center</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className={view === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('dashboard')}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              📁 Projects Directory
            </button>
            <button 
              className={view === 'calendar' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('calendar')}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              📅 Studio Calendar
            </button>
            <button 
              className={view === 'atomic-logs' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('atomic-logs')}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              📋 Logs & Fast Booking
            </button>
            <button 
              className={view === 'register' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setView('register')}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              + Register Project
            </button>
          </div>
        </header>

        {/* Views */}
        <main style={{ flex: 1 }}>
          {view === 'dashboard' ? (
            <ProjectDashboard 
              onNewProject={() => setView('register')} 
              onOpenBooking={() => setView('atomic-logs')}
            />
          ) : view === 'calendar' ? (
            <CalendarView onComplete={() => setView('dashboard')} />
          ) : view === 'atomic-logs' ? (
            <AtomicBookingLogger onComplete={() => setView('dashboard')} />
          ) : (
            <RegistrationWizard onComplete={() => setView('dashboard')} />
          )}
        </main>
      </div>
    </ProjectProvider>
  );
}

export default App;
