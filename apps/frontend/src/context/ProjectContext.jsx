import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logTaskToBackend, getProjectsFromBackend, getTasksFromBackend } from '../api/syncApi';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('st_studio_projects_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('st_studio_projects_v1', JSON.stringify(projects));
  }, [projects]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setSyncError(null);
    try {
      console.log("[SYNC API] Fetching live data from LOG BOOK_SYNC...");
      const remoteProjects = await getProjectsFromBackend();
      
      if (Array.isArray(remoteProjects) && remoteProjects.length > 0) {
        setProjects(prevProjects => {
          const projectMap = new Map();
          // First put existing local projects in map
          prevProjects.forEach(p => projectMap.set(p.id, p));

          // Merge remote projects from LOG BOOK_SYNC
          remoteProjects.forEach(rp => {
            const pId = rp.id || rp.projectCode || rp.code;
            const pName = rp.projectName || rp.name || pId;
            const existing = Array.from(projectMap.values()).find(
              p => p.id === pId || p.projectName === pName
            );

            if (existing) {
              projectMap.set(existing.id, {
                ...existing,
                projectName: pName,
                producer: rp.client || rp.clientName || existing.producer || 'General Client',
                projectCode: pId
              });
            } else {
              projectMap.set(pId, {
                id: pId,
                projectCode: pId,
                projectName: pName,
                projectType: rp.billingType || 'Commercial',
                producer: rp.client || rp.clientName || 'General Client',
                roles: {}
              });
            }
          });

          return Array.from(projectMap.values());
        });
      }
      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("[SYNC API] Error refreshing live data:", err);
      setSyncError(err.message || 'Failed to sync with backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addProject = async (projectData) => {
    const newProject = {
      id: projectData.projectCode || `PJ-${Date.now().toString().slice(-6)}`,
      projectCode: projectData.projectCode || `PJ-${Date.now().toString().slice(-6)}`,
      projectName: projectData.projectName || 'New Project',
      projectType: projectData.projectType || 'Commercial',
      producer: projectData.producer || 'General Client',
      producerContact: projectData.producerContact || '',
      roles: projectData.roles || {}
    };
    
    // Update local state
    setProjects(prev => [...prev, newProject]);
    
    // Push booking/project initialization to Google Apps Script / LOG BOOK_SYNC
    try {
      console.log("Pushing new project/booking to Google Apps Script...");
      await logTaskToBackend(newProject);
      console.log("Project successfully pushed to backend!");
      await refreshData();
    } catch (error) {
      console.error("Failed to push to backend:", error);
      alert("Error saving to backend: " + error.message);
    }
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      deleteProject,
      isLoading,
      lastSyncedAt,
      syncError,
      refreshData
    }}>
      {children}
    </ProjectContext.Provider>
  );
};
