import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Contenu</p>
      </Modal>,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Détail du rendez-vous">
        <p>Contenu du modal</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Détail du rendez-vous')).toBeInTheDocument()
    expect(screen.getByText('Contenu du modal')).toBeInTheDocument()
  })

  it('closes when clicking the Fermer button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Contenu</p>
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when pressing Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Contenu</p>
      </Modal>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the dialog content', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose}>
        <p>Contenu</p>
      </Modal>,
    )
    await user.click(screen.getByText('Contenu'))
    // Le clic sur le contenu ne ferme pas le modal
    expect(onClose).not.toHaveBeenCalled()
  })
})
