import { create } from 'zustand';

interface ConfigState {
  llmApiKey: string;
  dashscopeApiKey: string;
  httpsProxy: string;
  isConfigured: boolean;
  load: () => void;
  save: (config: { llmApiKey?: string; dashscopeApiKey?: string; httpsProxy?: string }) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  llmApiKey: '',
  dashscopeApiKey: '',
  httpsProxy: '',
  isConfigured: false,

  load: () => {
    try {
      const raw = localStorage.getItem('sf_config');
      if (raw) {
        const config = JSON.parse(raw);
        set({
          llmApiKey: config.llmApiKey || '',
          dashscopeApiKey: config.dashscopeApiKey || '',
          httpsProxy: config.httpsProxy || '',
          isConfigured: !!(config.llmApiKey && config.dashscopeApiKey),
        });
      }
    } catch { /* ignore */ }
  },

  save: (config) => {
    set((state) => {
      const updated = {
        llmApiKey: config.llmApiKey ?? state.llmApiKey,
        dashscopeApiKey: config.dashscopeApiKey ?? state.dashscopeApiKey,
        httpsProxy: config.httpsProxy ?? state.httpsProxy,
      };
      localStorage.setItem('sf_config', JSON.stringify(updated));
      return {
        ...updated,
        isConfigured: !!(updated.llmApiKey && updated.dashscopeApiKey),
      };
    });
  },
}));

// Load on import
useConfigStore.getState().load();
