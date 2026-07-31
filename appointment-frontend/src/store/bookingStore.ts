import { create } from 'zustand';
import type { ProviderResponse } from '@/types';

interface BookingState {
  selectedProvider: ProviderResponse | null;
  selectedDate: string | null; // format: YYYY-MM-DD
  selectedSlot: string | null; // format: HH:mm
  setProvider: (provider: ProviderResponse | null) => void;
  setDate: (date: string | null) => void;
  setSlot: (slot: string | null) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedProvider: null,
  selectedDate: null,
  selectedSlot: null,
  
  setProvider: (provider) => set({ 
    selectedProvider: provider, 
    selectedDate: null, 
    selectedSlot: null 
  }),
  
  setDate: (date) => set({ 
    selectedDate: date, 
    selectedSlot: null 
  }),
  
  setSlot: (slot) => set({ 
    selectedSlot: slot 
  }),
  
  resetBooking: () => set({ 
    selectedProvider: null, 
    selectedDate: null, 
    selectedSlot: null 
  })
}));
