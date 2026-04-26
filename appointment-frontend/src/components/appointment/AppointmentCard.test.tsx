import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppointmentCard } from './AppointmentCard'
import { reservationApi } from '@/services/api'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { ReservationResponse } from '@/types'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('@/services/api', () => ({
  reservationApi: {
    cancel: vi.fn(),
    confirm: vi.fn(),
    reject: vi.fn(),
    complete: vi.fn(),
    noShow: vi.fn(),
  },
}))

const baseReservation: ReservationResponse = {
  id: 'reservation-1',
  clientId: 'client-1',
  clientFullName: 'Jane Client',
  specialistId: 'specialist-1',
  specialistDisplayName: 'Dr Martin',
  serviceId: 'service-1',
  serviceName: 'Consultation',
  slot: {
    id: 'slot-1',
    specialistId: 'specialist-1',
    date: '2026-04-23',
    startTime: '09:00:00',
    endTime: '09:30:00',
    status: 'BOOKED',
  },
  status: 'CANCELED',
  depositRequired: false,
  createdAt: '2026-04-23T09:00:00Z',
}

describe('AppointmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigates when a client resumes a canceled appointment', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppointmentCard reservation={baseReservation} onUpdate={vi.fn()} />,
      { role: 'CLIENT' },
    )

    await user.click(screen.getByRole('button', { name: /reprendre rendez-vous/i }))

    expect(navigateMock).toHaveBeenCalledWith('/appointments/reservation-1')
  })

  it('confirms a pending appointment for a specialist', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const updatedReservation = { ...baseReservation, status: 'CONFIRMED' as const }
    vi.mocked(reservationApi.confirm).mockResolvedValue(updatedReservation)

    renderWithProviders(
      <AppointmentCard
        reservation={{ ...baseReservation, status: 'PENDING' }}
        onUpdate={onUpdate}
      />,
      { role: 'SPECIALIST' },
    )

    await user.click(screen.getByRole('button', { name: /confirmer/i }))

    await waitFor(() => {
      expect(reservationApi.confirm).toHaveBeenCalledWith('reservation-1')
      expect(onUpdate).toHaveBeenCalledWith(updatedReservation)
    })
  })
})
