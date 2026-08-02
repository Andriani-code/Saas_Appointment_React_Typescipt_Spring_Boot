import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppointmentCard } from './AppointmentCard'
import { messagingApi, reservationApi } from '@/services/api'
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
  messagingApi: {
    getOrCreateConversationForReservation: vi.fn(),
  },
}))

const baseReservation: ReservationResponse = {
  id: 'reservation-1',
  clientId: 'client-1',
  clientFullName: 'Jane Client',
  providerId: 'provider-1',
  providerDisplayName: 'Dr Martin',
  serviceId: 'service-1',
  serviceName: 'Consultation',
  slot: {
    id: 'slot-1',
    providerId: 'provider-1',
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

    expect(navigateMock).toHaveBeenCalledWith('/appointments')
  })

  it('confirms a pending appointment for a provider', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const updatedReservation = { ...baseReservation, status: 'CONFIRMED' as const }
    vi.mocked(reservationApi.confirm).mockResolvedValue(updatedReservation)

    renderWithProviders(
      <AppointmentCard
        reservation={{ ...baseReservation, status: 'PENDING' }}
        onUpdate={onUpdate}
      />,
      { role: 'PROVIDER' },
    )

    await user.click(screen.getByRole('button', { name: /confirmer/i }))

    await waitFor(() => {
      expect(reservationApi.confirm).toHaveBeenCalledWith('reservation-1')
      expect(onUpdate).toHaveBeenCalledWith(updatedReservation)
    })
  })

  it('opens the conversation from the message menu item', async () => {
    const user = userEvent.setup()
    vi.mocked(messagingApi.getOrCreateConversationForReservation).mockResolvedValue({
      id: 'conversation-1',
      clientId: 'client-1',
      clientFullName: 'Jane Client',
      providerId: 'provider-1',
      providerDisplayName: 'Dr Martin',
      isActive: true,
      unreadCount: 0,
      createdAt: '2026-04-23T09:00:00Z',
    })

    renderWithProviders(
      <AppointmentCard reservation={baseReservation} onUpdate={vi.fn()} />,
      { role: 'CLIENT' },
    )

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /envoyer un message/i }))

    await waitFor(() => {
      expect(messagingApi.getOrCreateConversationForReservation).toHaveBeenCalledWith('reservation-1')
      expect(navigateMock).toHaveBeenCalledWith('/messages', { state: { conversationId: 'conversation-1' } })
    })
  })

  it('shows the reservation details modal from the menu', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <AppointmentCard reservation={baseReservation} onUpdate={vi.fn()} />,
      { role: 'CLIENT' },
    )

    await user.click(screen.getByRole('button', { name: /ouvrir le menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /voir le detail/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Détail du rendez-vous')).toBeInTheDocument()
    expect(screen.getByText('Jane Client')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
