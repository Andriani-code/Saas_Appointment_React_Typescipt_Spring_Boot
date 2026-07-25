import { type ClassValue, clsx } from 'clsx'
import type { ReservationStatus } from '@/types'
import axios from 'axios'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    
    // Handle Validation Errors (fieldErrors map)
    if (data?.fieldErrors) {
      const messages = Object.entries(data.fieldErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('\n')
      return messages || data.message || 'Validation échouée'
    }

    return data?.message || error.message || 'Une erreur est survenue'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Une erreur est survenue'
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatTime(timeStr: string): string {
  // timeStr = "HH:MM:SS" or "HH:MM"
  return timeStr.substring(0, 5)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getStatusBadgeClass(status: ReservationStatus): string {
  const map: Record<ReservationStatus, string> = {
    PENDING:   'badge-pending',
    CONFIRMED: 'badge-confirmed',
    COMPLETED: 'badge-completed',
    CANCELED:  'badge-canceled',
    REJECTED:  'badge-rejected',
    NO_SHOW:   'badge-no-show',
  }
  return map[status] ?? 'badge'
}

export function getStatusLabel(status: ReservationStatus): string {
  const map: Record<ReservationStatus, string> = {
    PENDING:   'En attente',
    CONFIRMED: 'Confirmé',
    COMPLETED: 'Terminé',
    CANCELED:  'Annulé',
    REJECTED:  'Rejeté',
    NO_SHOW:   'Absent',
  }
  return map[status] ?? status
}

export function dayOfWeekLabel(day: string): string {
  const map: Record<string, string> = {
    MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche',
  }
  return map[day] ?? day
}
