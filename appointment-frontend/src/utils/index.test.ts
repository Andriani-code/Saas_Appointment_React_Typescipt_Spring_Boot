import { describe, expect, it } from 'vitest'
import axios from 'axios'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
  getErrorMessage,
  getInitials,
  getStatusBadgeClass,
  getStatusLabel,
  dayOfWeekLabel,
} from './index'

describe('utils', () => {
  describe('cn', () => {
    it('joins class names and drops falsy values', () => {
      expect(cn('a', false, 'b', undefined, null, 'c')).toBe('a b c')
    })
  })

  describe('formatDate', () => {
    it('formats a date in French locale', () => {
      // Date locale sans 'Z' pour rester indépendant du fuseau horaire du runner
      const result = formatDate('2026-04-23T00:00:00')
      expect(result).toMatch(/avr\. 2026/)
    })
  })

  describe('formatTime', () => {
    it('keeps HH:MM from a full time string', () => {
      expect(formatTime('09:30:00')).toBe('09:30')
      expect(formatTime('14:05')).toBe('14:05')
    })
  })

  describe('formatCurrency', () => {
    it('formats MGA amounts with Ar suffix', () => {
      expect(formatCurrency(50000)).toBe('50,000 Ar')
    })
  })

  describe('formatDuration', () => {
    it('formats minutes under one hour', () => {
      expect(formatDuration(45)).toBe('45 min')
    })

    it('formats full hours', () => {
      expect(formatDuration(120)).toBe('2h')
    })

    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30min')
    })
  })

  describe('getInitials', () => {
    it('takes the first letter of up to two words', () => {
      expect(getInitials('Jane Doe')).toBe('JD')
      expect(getInitials('Dr Martin')).toBe('DM')
    })
  })

  describe('getStatusBadgeClass', () => {
    it('maps every reservation status', () => {
      expect(getStatusBadgeClass('PENDING')).toBe('badge-pending')
      expect(getStatusBadgeClass('CONFIRMED')).toBe('badge-confirmed')
      expect(getStatusBadgeClass('COMPLETED')).toBe('badge-completed')
      expect(getStatusBadgeClass('CANCELED')).toBe('badge-canceled')
      expect(getStatusBadgeClass('REJECTED')).toBe('badge-rejected')
      expect(getStatusBadgeClass('NO_SHOW')).toBe('badge-no-show')
    })
  })

  describe('getStatusLabel', () => {
    it('maps every reservation status to a French label', () => {
      expect(getStatusLabel('PENDING')).toBe('En attente')
      expect(getStatusLabel('CONFIRMED')).toBe('Confirmé')
      expect(getStatusLabel('COMPLETED')).toBe('Terminé')
      expect(getStatusLabel('CANCELED')).toBe('Annulé')
      expect(getStatusLabel('REJECTED')).toBe('Rejeté')
      expect(getStatusLabel('NO_SHOW')).toBe('Absent')
    })
  })

  describe('dayOfWeekLabel', () => {
    it('maps English day keys to French labels', () => {
      expect(dayOfWeekLabel('MONDAY')).toBe('Lundi')
      expect(dayOfWeekLabel('SUNDAY')).toBe('Dimanche')
    })

    it('returns the input unchanged for unknown keys', () => {
      expect(dayOfWeekLabel('FOO')).toBe('FOO')
    })
  })

  describe('getErrorMessage', () => {
    it('extracts the message from an axios error response', () => {
      const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
        data: { message: 'Invalid credentials' },
      })
      expect(getErrorMessage(error)).toBe('Invalid credentials')
    })

    it('joins validation field errors', () => {
      const error = new axios.AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as never,
        data: { fieldErrors: { email: 'must be valid', password: 'too short' } },
      })
      expect(getErrorMessage(error)).toBe('email: must be valid\npassword: too short')
    })

    it('returns a generic message for unknown errors', () => {
      expect(getErrorMessage('nope')).toBe('Une erreur est survenue')
    })
  })
})
