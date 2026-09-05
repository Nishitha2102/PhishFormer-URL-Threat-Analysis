import { create } from 'zustand';
import api from '../lib/api';

const useScanStore = create((set) => ({
  currentScan: null,
  scanHistory: [],
  historyMeta: { page: 1, pages: 1, total: 0 },
  isLoading: false,
  error: null,

  scanUrl: async (url, model) => {
    set({ isLoading: true, error: null, currentScan: null });
    try {
      const res = await api.post('/api/scan', { url, model });
      set({ currentScan: res.data, isLoading: false });
      return res.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchHistory: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/api/scan/history?page=${page}&limit=${limit}`);
      set({ 
        scanHistory: res.data.logs, 
        historyMeta: { page: res.data.page, pages: res.data.pages, total: res.data.total },
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
    }
  },

  clearCurrentScan: () => set({ currentScan: null })
}));

export default useScanStore;
