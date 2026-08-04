import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShortenForm from './ShortenForm'

const { shortenUrl } = vi.hoisted(() => ({ shortenUrl: vi.fn() }))

vi.mock('../services/urlShortenerApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/urlShortenerApi')>()
  return { ...actual, shortenUrl }
})

describe('ShortenForm', () => {
  beforeEach(() => {
    shortenUrl.mockReset()
  })

  it('submits a trimmed custom alias then clears the form after success', async () => {
    shortenUrl.mockResolvedValue({ shortUrl: 'http://localhost:8080/example' })
    const onShortened = vi.fn()
    const user = userEvent.setup()

    render(<ShortenForm onShortened={onShortened} />)

    await user.type(screen.getByLabelText('Full URL'), 'example.com')
    await user.type(screen.getByLabelText(/Custom alias/), ' example ')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))

    await waitFor(() =>
      expect(shortenUrl).toHaveBeenCalledWith({
        fullUrl: 'example.com',
        customAlias: 'example',
      }),
    )
    expect(await screen.findByText('Your short URL is')).toBeInTheDocument()
    expect(screen.getByLabelText('Full URL')).toHaveValue('')
    expect(screen.getByLabelText(/Custom alias/)).toHaveValue('')
    expect(onShortened).toHaveBeenCalledOnce()
  })

  it('focuses the error summary for a validation error', async () => {
    const { UrlShortenerApiError } =
      await import('../services/urlShortenerApi')
    shortenUrl.mockRejectedValue(
      new UrlShortenerApiError({ code: 'INVALID_URL', message: 'Invalid URL' }),
    )
    const user = userEvent.setup()

    render(<ShortenForm onShortened={vi.fn()} />)

    await user.type(screen.getByLabelText('Full URL'), 'invalid')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))

    const errorSummary = await screen.findByRole('alert')
    expect(errorSummary).toHaveFocus()
    expect(within(errorSummary).getByText('Invalid URL')).toBeInTheDocument()
  })
})
