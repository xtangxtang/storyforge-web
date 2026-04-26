import { create } from 'zustand';
import type { Project, Brief, Asset, Storyboard, VideoClip } from '../types';

const STORAGE_KEY = 'sf_projects';

interface ProjectData {
  project: Project;
  brief?: Brief;
  assets: Asset[];
  storyboards: Storyboard[];
  videoClips: VideoClip[];
}

interface ProjectStore {
  projects: Project[];
  projectData: Map<string, ProjectData>;
  getAllProjects: () => Project[];
  getProjectData: (id: string) => ProjectData | undefined;
  saveProject: (project: Project, data?: Partial<ProjectData>) => void;
  updateProjectState: (id: string, state: Project['state']) => void;
  deleteProject: (id: string) => void;
  loadAll: () => void;
}

function loadFromStorage(): Map<string, ProjectData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const entries: [string, ProjectData][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveToStorage(data: Map<string, ProjectData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...data]));
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  projectData: new Map(),

  getAllProjects: () => {
    return get().projects.sort((a, b) => b.createdAt - a.createdAt);
  },

  getProjectData: (id) => {
    return get().projectData.get(id);
  },

  saveProject: (project, partialData) => {
    set((state) => {
      const newData = get().projectData.get(project.id) || {
        project,
        assets: [],
        storyboards: [],
        videoClips: [],
      };
      if (partialData?.brief) newData.brief = partialData.brief;
      if (partialData?.assets) newData.assets = partialData.assets;
      if (partialData?.storyboards) newData.storyboards = partialData.storyboards;
      if (partialData?.videoClips) newData.videoClips = partialData.videoClips;

      const updated = new Map(state.projectData);
      updated.set(project.id, { ...newData, project });

      const projList = state.projects.some(p => p.id === project.id)
        ? state.projects.map(p => p.id === project.id ? project : p)
        : [...state.projects, project];

      saveToStorage(updated);
      return { projects: projList, projectData: updated };
    });
  },

  updateProjectState: (id, state) => {
    set((prev) => {
      const updated = new Map(prev.projectData);
      const data = updated.get(id);
      if (data) {
        updated.set(id, {
          ...data,
          project: { ...data.project, state, updatedAt: Date.now() },
        });
      }
      const projList = prev.projects.map(p =>
        p.id === id ? { ...p, state, updatedAt: Date.now() } : p
      );
      saveToStorage(updated);
      return { projects: projList, projectData: updated };
    });
  },

  deleteProject: (id) => {
    set((prev) => {
      const updated = new Map(prev.projectData);
      updated.delete(id);
      const projList = prev.projects.filter(p => p.id !== id);
      saveToStorage(updated);
      return { projects: projList, projectData: updated };
    });
  },

  loadAll: () => {
    const data = loadFromStorage();
    set({
      projectData: data,
      projects: [...data.values()].map(d => d.project),
    });
  },
}));

// Load on import
useProjectStore.getState().loadAll();
