import { create } from 'zustand';
import type { SpecialistResponse } from '@/types';

interface BookingState {
  selectedSpecialist: SpecialistResponse | null;
  selectedDate: string | null; // format: YYYY-MM-DD
  selectedSlot: string | null; // format: HH:mm
  setSpecialist: (specialist: SpecialistResponse | null) => void;
  setDate: (date: string | null) => void;
  setSlot: (slot: string | null) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedSpecialist: null,
  selectedDate: null,
  selectedSlot: null,
  
  setSpecialist: (specialist) => set({ 
    selectedSpecialist: specialist, 
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
    selectedSpecialist: null, 
    selectedDate: null, 
    selectedSlot: null 
  })
}));
