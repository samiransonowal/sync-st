import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import '../styles/app.css';

export const ProjectDashboard = ({ onNewProject, onOpenBooking }) => {
  const { projects, deleteProject, isLoading, lastSyncedAt, refreshData, syncError } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex-col gap-6" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Overview Banner */}
      {!activeProject && (
        <header className="glass-panel flex-row justify-between" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 className="text-h2" style={{ margin: 0 }}>Studio Project Directory</h2>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '12px', 
                background: syncError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: syncError ? '#ef4444' : '#10b981',
                border: `1px solid ${syncError ? '#ef4444' : '#10b981'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: syncError ? '#ef4444' : '#10b981'
                }}></span>
                {isLoading ? 'Syncing Google Sheets...' : syncError ? 'Sync Error' : 'Live LOG BOOK_SYNC'}
              </span>
            </div>
            <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>
              Active studio projects, billing ledger mapping, and client account directory.
              {lastSyncedAt && <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>• Last fetched: {lastSyncedAt.toLocaleTimeString()}</span>}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn-secondary" 
              onClick={refreshData}
              disabled={isLoading}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              🔄 {isLoading ? 'Syncing...' : 'Sync Live Data'}
            </button>
            <button className="btn-primary" onClick={onNewProject}>
              + Register New Project
            </button>
          </div>
        </header>
      )}

      {/* Main View: Project Cards Grid */}
      {!activeProject ? (
        <section className="flex-col gap-4 animate-fade-in">
          {projects.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
              <p className="text-muted">No projects registered yet. Click below to register your first project or sync from Google Sheets.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={refreshData}>
                  🔄 Sync from Sheets
                </button>
                <button className="btn-primary" onClick={onNewProject}>
                  + Register New Project
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {projects.map(p => (
                <div 
                  key={p.id} 
                  className="glass-panel flex-col justify-between hover-row" 
                  style={{ 
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-panel)',
                    padding: '1.25rem',
                    gap: '1rem'
                  }}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  <div className="flex-row justify-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className="flex-row gap-2" style={{ marginBottom: '0.35rem' }}>
                        <h3 className="text-h3" style={{ margin: 0, fontSize: '1.15rem' }}>{p.projectName || p.name || 'Untitled Project'}</h3>
                      </div>
                      <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                        Client / Producer: <strong style={{ color: 'var(--text-main)' }}>{p.producer || p.client || 'General Client'}</strong>
                      </p>
                      {p.projectCode && (
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Code: {p.projectCode}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${p.projectName || p.id}" from local cache?`)) {
                          deleteProject(p.id);
                          if (selectedProjectId === p.id) setSelectedProjectId(null);
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--status-blocked)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7 }}
                      title="Remove from Local Cache"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.8rem' }}>
                    <span className="status-badge status-active" style={{ fontSize: '0.65rem' }}>
                      {p.projectType || 'Commercial'}
                    </span>
                    <span style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      View Project Details →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Active Project Details Card */
        <section className="glass-panel flex-col gap-6 animate-fade-in" style={{ border: '1px solid var(--status-active)', width: '100%' }}>
          
          {/* Header Bar */}
          <div className="flex-row justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div className="flex-row gap-4" style={{ alignItems: 'center' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedProjectId(null)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Return to all projects list"
              >
                ◀ All Projects
              </button>
              <div>
                <h3 className="text-h2" style={{ margin: 0, fontSize: '1.4rem' }}>{activeProject.projectName || activeProject.name}</h3>
                <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem' }}>
                  Client / Producer: {activeProject.producer || activeProject.client} · Type: {activeProject.projectType || 'Commercial'}
                </p>
              </div>
            </div>
            
            <div className="flex-row gap-3">
              {onOpenBooking && (
                <button 
                  className="btn-primary" 
                  onClick={() => onOpenBooking(activeProject)} 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  📋 Log Session for this Project
                </button>
              )}
              <button className="btn-secondary" onClick={onNewProject} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                + Register New Project
              </button>
            </div>
          </div>

          {/* Project Details & Team Contact Matrix */}
          <div className="flex-col gap-6" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            
            {/* General Project Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Project Code</span>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{activeProject.projectCode || activeProject.id}</div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Client Account</span>
                <div style={{ fontWeight: 600 }}>{activeProject.producer || activeProject.client || 'General Client'}</div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Producer Contact</span>
                <div style={{ fontWeight: 600 }}>{activeProject.producerContact || '—'}</div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Project Type</span>
                <div style={{ fontWeight: 600 }}>{activeProject.projectType || 'Commercial'}</div>
              </div>
            </div>

            {/* HOD Team Contacts (if registered) */}
            {activeProject.roles && Object.keys(activeProject.roles).length > 0 && (
              <div className="flex-col gap-4">
                <h4 style={{ color: 'var(--status-active)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', margin: 0 }}>
                  Key Department Contacts
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                  {activeProject.roles.director?.name && (
                    <div><span className="text-muted">Director:</span> {activeProject.roles.director.name} ({activeProject.roles.director.contact || '—'})</div>
                  )}
                  {activeProject.roles.dop?.name && (
                    <div><span className="text-muted">DOP:</span> {activeProject.roles.dop.name} ({activeProject.roles.dop.contact || '—'})</div>
                  )}
                  {activeProject.roles.editor?.name && (
                    <div><span className="text-muted">Offline Editor:</span> {activeProject.roles.editor.name} ({activeProject.roles.editor.contact || '—'})</div>
                  )}
                  {activeProject.roles.colorist?.name && (
                    <div><span className="text-muted">Colorist:</span> {activeProject.roles.colorist.name} ({activeProject.roles.colorist.contact || '—'})</div>
                  )}
                  {activeProject.roles.vfxHead?.name && (
                    <div><span className="text-muted">VFX Head:</span> {activeProject.roles.vfxHead.name} ({activeProject.roles.vfxHead.contact || '—'})</div>
                  )}
                  {activeProject.roles.onlineArtist?.name && (
                    <div><span className="text-muted">Online / Flame:</span> {activeProject.roles.onlineArtist.name} ({activeProject.roles.onlineArtist.contact || '—'})</div>
                  )}
                  {activeProject.roles.musicDirector?.name && (
                    <div><span className="text-muted">Music Director:</span> {activeProject.roles.musicDirector.name} ({activeProject.roles.musicDirector.contact || '—'})</div>
                  )}
                  {activeProject.roles.mixEngineer?.name && (
                    <div><span className="text-muted">Sound Mix:</span> {activeProject.roles.mixEngineer.name} ({activeProject.roles.mixEngineer.contact || '—'})</div>
                  )}
                </div>
              </div>
            )}

          </div>

        </section>
      )}

    </div>
  );
};
