import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/ShortenForm', () => ({
  default: ({ onShortened }: { onShortened: () => void }) => (
    <button onClick={onShortened} type="button">
      Create a short URL
    </button>
  ),
}))

vi.mock('./components/UrlList', () => ({
  default: ({ refreshKey }: { refreshKey: number }) => (
    <p>Refresh count: {refreshKey}</p>
  ),
}))

describe('App', () => {
  it('provides page navigation and refreshes the list after a URL is created', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('link', { name: 'Create URL' })).toHaveAttribute(
      'href',
      '#shorten-form',
    )
    expect(screen.getByText('Refresh count: 0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create a short URL' }))

    expect(screen.getByText('Refresh count: 1')).toBeInTheDocument()
  })
})
