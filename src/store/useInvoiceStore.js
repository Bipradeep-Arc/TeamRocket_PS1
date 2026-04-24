import { create } from 'zustand';
import { produce } from 'immer';

export const useInvoiceStore = create((set) => ({
  data: {
    themeColor: '#0f172a',
    companyName: 'Phoenix IO',
    clientName: '',
    taxRate: 8,
    discountRate: 0,
    currency: 'USD', // NEW: Default to USD
    items: [
      { id: 'item-1', description: 'Enterprise Web Development', qty: 1, rate: 5000 }
    ],
  },

  updateField: (field, value) => set(produce(state => {
    let finalValue = value;
    if (field === 'taxRate' || field === 'discountRate') {
      finalValue = value === '' ? '' : Number(value);
    }
    state.data[field] = finalValue;
  })),

  updateItem: (id, field, value) => set(produce(state => {
    const item = state.data.items.find(i => i.id === id);
    if (item && field in item) {
      item[field] = (field === 'qty' || field === 'rate') ? Number(value) || 0 : value;
    }
  })),
  
  addItem: () => set(produce(state => {
    state.data.items.push({
      id: `item-${Date.now()}`,
      description: '',
      qty: 1,
      rate: 0
    });
  })),

  removeItem: (id) => set(produce(state => {
    state.data.items = state.data.items.filter(i => i.id !== id);
  })),

  hydrateData: (newData) => set({ data: newData }),

  reorderItems: (activeId, overId) => set(produce(state => {
    const oldIndex = state.data.items.findIndex(i => i.id === activeId);
    const newIndex = state.data.items.findIndex(i => i.id === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const [movedItem] = state.data.items.splice(oldIndex, 1);
      state.data.items.splice(newIndex, 0, movedItem);
    }
  }))
}));