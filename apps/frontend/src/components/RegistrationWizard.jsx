import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getClientCrmFromBackend } from '../api/syncApi';
import '../styles/app.css';

export const RegistrationWizard = ({ onComplete }) => {
  const { addProject } = useProject();
  const [step, setStep] = useState(1);
  const [clientCrmList, setClientCrmList] = useState([]);
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: 'Advertisement',
    producer: '',
    producerContact: '',
    ditRequired: false,
    driveAction: 'None',
    roles: {
      producer: { name: '', contact: '' },
      director: { name: '', contact: '' },
      dop: { name: '', contact: '' },
      directorsAssistant: { name: '', contact: '' },
      editor: { name: '', contact: '' },
      assistantEditor: { name: '', contact: '' },
      colorist: { name: '', contact: '' },
      coloristLp: { name: '', contact: '' },
      vfxHead: { name: '', contact: '' },
      vfxLp: { name: '', contact: '' },
      onlineArtist: { name: '', contact: '' },
      onlineStudioLp: { name: '', contact: '' },
      musicDirector: { name: '', contact: '' },
      backgroundScoreArtist: { name: '', contact: '' },
      mixEngineer: { name: '', contact: '' },
      soundStudioLp: { name: '', contact: '' },
      voArtist: { name: '', contact: '' },
      dubbingLp: { name: '', contact: '' },
      masteringHead: { name: '', contact: '' }
    }
  });

  useEffect(() => {
    getClientCrmFromBackend().then(clients => {
      if (Array.isArray(clients)) setClientCrmList(clients);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [roleKey]: {
          ...prev.roles[roleKey],
          [field]: value
        }
      }
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.projectName || !formData.producer || !formData.producerContact) {
        alert('Please fill out all required fields: Project Name, Producer Name & Contact.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Inject top-level producer into roles structure
    const updatedRoles = {
      ...formData.roles,
      producer: { name: formData.producer, contact: formData.producerContact }
    };
    addProject({
      projectName: formData.projectName,
      projectType: formData.projectType,
      producer: formData.producer,
      producerContact: formData.producerContact,
      ditRequired: formData.ditRequired,
      driveAction: formData.driveAction,
      roles: updatedRoles
    });
    onComplete();
  };

  // Helper to render Name & Contact input row
  const renderRoleInputs = (roleKey, label) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
        <div className="flex-col gap-1">
          <label className="text-muted" style={{ fontSize: '0.8rem' }}>{label} Name</label>
          <input 
            type="text" 
            value={formData.roles[roleKey].name} 
            onChange={e => handleRoleChange(roleKey, 'name', e.target.value)} 
            placeholder={`${label} name`} 
            style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}
          />
        </div>
        <div className="flex-col gap-1">
          <label className="text-muted" style={{ fontSize: '0.8rem' }}>{label} Contact (Email/Phone)</label>
          <input 
            type="text" 
            value={formData.roles[roleKey].contact} 
            onChange={e => handleRoleChange(roleKey, 'contact', e.target.value)} 
            placeholder="Email or phone number" 
            style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col gap-6" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Progress Tracker */}
      <div className="glass-panel flex-row justify-between" style={{ padding: '1rem 2rem', borderRadius: '12px' }}>
        {[1, 2, 3, 4].map(num => (
          <div key={num} className="flex-row gap-2" style={{ opacity: step === num ? 1 : 0.5 }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: step >= num ? 'var(--status-active)' : 'rgba(255,255,255,0.1)',
              color: '#000',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem'
            }}>{num}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {num === 1 && 'Core Details'}
              {num === 2 && 'Picture Post'}
              {num === 3 && 'Audio Post'}
              {num === 4 && 'Additional Services & Review'}
            </span>
          </div>
        ))}
      </div>

      {/* Form Wizard */}
      <form onSubmit={handleSubmit} className="glass-panel flex-col gap-6">
        
        {step === 1 && (
          <div className="flex-col gap-4 animate-fade-in">
            <h3 className="text-h2">Step 1: Project Details & Core Leadership</h3>
            <p className="text-muted">Set up basic project metadata and your primary HOD leadership contacts.</p>

            {/* AUTOMATED ALLOCATION NOTICE BANNER */}
            <div style={{ background: 'rgba(0, 229, 255, 0.08)', borderRadius: '8px', padding: '0.85rem 1rem', border: '1px solid var(--status-active)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>⚡</span>
              <div style={{ fontSize: '0.85rem', color: '#E0E0E0', lineHeight: 1.4 }}>
                <strong style={{ color: 'var(--status-active)' }}>Automated Project Code Allocation:</strong> You do not need to manually enter or calculate any project code. Simply write your <strong>Project Name</strong> below — your official sequential Project Code ID is automatically allotted by the website.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1rem' }}>
              <div className="flex-col gap-1">
                <label className="text-muted">Project Name *</label>
                <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} placeholder="e.g. Stir Fry Commercial" style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '6px' }} required />
              </div>
              <div className="flex-col gap-1">
                <label className="text-muted">Project Type</label>
                <select name="projectType" value={formData.projectType} onChange={handleChange} style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '6px', height: '40px' }}>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Feature Film">Feature Film</option>
                  <option value="Web Series">Web Series</option>
                  <option value="Music Video">Music Video</option>
                </select>
              </div>
            </div>

            {/* AUTOMATED PROJECT CODE DISPLAY BADGE */}
            <div className="flex-col gap-1" style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ color: 'var(--status-active)', fontWeight: 700, fontSize: '0.8rem' }}>✓ Project Code Allotted (Automated)</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: '#00FFCC', letterSpacing: '0.05em' }}>
                  {formData.projectName ? `AUTO_${formData.projectType.slice(0,2).toUpperCase()}_01` : '1043_MIS_OT'}
                </span>
                <span style={{ fontSize: '0.7rem', background: 'rgba(0, 255, 204, 0.15)', color: '#00FFCC', border: '1px solid rgba(0, 255, 204, 0.4)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                  AUTO-ALLOTTED
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="flex-col gap-1">
                <label className="text-muted">Post Producer / Client Name * (Client_CRM Sync)</label>
                <input type="text" name="producer" value={formData.producer} onChange={handleChange} list="reactClientCrmList" placeholder="Search CRM or type new client..." style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '6px' }} required />
                <datalist id="reactClientCrmList">
                  {clientCrmList.map((c, idx) => (
                    <option key={idx} value={typeof c === 'string' ? c : c.name} />
                  ))}
                </datalist>
              </div>
              <div className="flex-col gap-1">
                <label className="text-muted">Producer Contact Info *</label>
                <input type="text" name="producerContact" value={formData.producerContact} onChange={handleChange} placeholder="Email / Phone" style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem', borderRadius: '6px' }} required />
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            {renderRoleInputs('director', 'Director')}
            {renderRoleInputs('dop', 'DOP')}
            {renderRoleInputs('directorsAssistant', "Director's Assistant")}
          </div>
        )}

        {step === 2 && (
          <div className="flex-col gap-4 animate-fade-in">
            <h3 className="text-h2">Step 2: Picture & Visual Department</h3>
            <p className="text-muted">Assign HODs and Line Producers (LP) overseeing the edit, VFX, grade, and online conform.</p>

            {renderRoleInputs('editor', 'Editor')}
            {renderRoleInputs('assistantEditor', 'Assistant Editor')}
            {renderRoleInputs('colorist', 'Colorist')}
            {renderRoleInputs('coloristLp', 'Colorist LP')}
            {renderRoleInputs('vfxHead', 'VFX Head')}
            {renderRoleInputs('vfxLp', 'VFX LP')}
            {renderRoleInputs('onlineArtist', 'Online Artist')}
            {renderRoleInputs('onlineStudioLp', 'Online Studio LP')}
          </div>
        )}

        {step === 3 && (
          <div className="flex-col gap-4 animate-fade-in">
            <h3 className="text-h2">Step 3: Audio Post Department</h3>
            <p className="text-muted">Add background score creators, mixing engineers, VO artists, and sound studio LPs.</p>

            {renderRoleInputs('musicDirector', 'Music Director')}
            {renderRoleInputs('backgroundScoreArtist', 'Background Score Artist')}
            {renderRoleInputs('mixEngineer', 'Mix Engineer')}
            {renderRoleInputs('soundStudioLp', 'Sound Studio LP')}
            {renderRoleInputs('voArtist', 'VO Artist')}
            {renderRoleInputs('dubbingLp', 'Dubbing LP')}
          </div>
        )}

        {step === 4 && (
          <div className="flex-col gap-4 animate-fade-in">
            <h3 className="text-h2">Step 4: Additional Services & Review</h3>
            <p className="text-muted">Configure DIT & hardware requirements, assign mastering head, and submit project.</p>

            {renderRoleInputs('masteringHead', 'Mastering Head')}

            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

            {/* DIT & Storage configuration */}
            <div style={{ background: 'rgba(0,229,255,0.03)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border-glow)' }} className="flex-col gap-4">
              <h4 style={{ margin: 0, color: 'var(--status-active)' }}>DIT & Storage Solutions</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="flex-col gap-1">
                  <label className="text-muted" style={{ fontSize: '0.85rem' }}>DIT Services Required?</label>
                  <select name="ditRequired" value={formData.ditRequired ? 'true' : 'false'} onChange={e => setFormData(prev => ({ ...prev, ditRequired: e.target.value === 'true' }))} style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', height: '38px' }}>
                    <option value="false">No DIT services needed</option>
                    <option value="true">Yes, request World-Class DIT</option>
                  </select>
                </div>
                
                <div className="flex-col gap-1">
                  <label className="text-muted" style={{ fontSize: '0.85rem' }}>Hard Drive Sales / Rental</label>
                  <select name="driveAction" value={formData.driveAction} onChange={handleChange} style={{ background: '#000', color: '#fff', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', height: '38px' }}>
                    <option value="None">No extra drive purchase/rental</option>
                    <option value="Rent SSDs">Rent high-speed SSD Master Drives</option>
                    <option value="Buy LTO">Buy LTO Archival Tape Cartridges</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Summary list */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--border-color)' }} className="flex-col gap-3">
              <h4 style={{ margin: 0, color: 'var(--status-active)' }}>Project Information Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><span className="text-muted">Project Name:</span> {formData.projectName || 'Unnamed'}</div>
                <div><span className="text-muted">Project Type:</span> {formData.projectType}</div>
                <div><span className="text-muted">Producer:</span> {formData.producer} ({formData.producerContact})</div>
                <div><span className="text-muted">DIT Needed:</span> {formData.ditRequired ? 'Yes' : 'No'}</div>
                <div><span className="text-muted">Drive Action:</span> {formData.driveAction}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex-row justify-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handlePrev}
            disabled={step === 1}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button type="button" className="btn-primary" onClick={handleNext}>
              Next Step
            </button>
          ) : (
            <button type="submit" className="btn-primary" style={{ background: 'var(--status-approved)', color: '#fff' }}>
              Confirm & Initialize 10-Step Ad Pipeline
            </button>
          )}
        </div>

      </form>
    </div>
  );
};
