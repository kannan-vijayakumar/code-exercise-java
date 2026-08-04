import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ShortenForm from './ShortenForm'

const { copyText, shortenUrl } = vi.hoisted(() => ({
  copyText: vi.fn(),
  shortenUrl: vi.fn(),
}))

vi.mock('../services/urlShortenerApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/urlShortenerApi')>()
  return { ...actual, shortenUrl }
})

vi.mock('../services/clipboard', () => ({ copyText }))

describe('ShortenForm', () => {
  beforeEach(() => {
    copyText.mockReset()
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

  it('submits an undefined custom alias when the field is blank', async () => {
    shortenUrl.mockResolvedValue({ shortUrl: 'http://localhost:8080/example' })
    const user = userEvent.setup()

    render(<ShortenForm onShortened={vi.fn()} />)

    await user.type(screen.getByLabelText('Full URL'), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))

    await waitFor(() =>
      expect(shortenUrl).toHaveBeenCalledWith({
        fullUrl: 'example.com',
        customAlias: undefined,
      }),
    )
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

  it('shows a general error for a network failure', async () => {
    const { UrlShortenerApiError } =
      await import('../services/urlShortenerApi')
    shortenUrl.mockRejectedValue(
      new UrlShortenerApiError({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the URL shortener service',
      }),
    )
    const user = userEvent.setup()

    render(<ShortenForm onShortened={vi.fn()} />)

    await user.type(screen.getByLabelText('Full URL'), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))

    expect(
      await screen.findByText('Unable to reach the URL shortener service'),
    ).toBeInTheDocument()
  })

  it('copies the created short URL and reports a clipboard failure', async () => {
    shortenUrl.mockResolvedValue({ shortUrl: 'http://localhost:8080/example' })
    copyText.mockRejectedValue(new Error('Clipboard access denied'))
    const user = userEvent.setup()

    render(<ShortenForm onShortened={vi.fn()} />)

    await user.type(screen.getByLabelText('Full URL'), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))
    await user.click(screen.getByRole('button', { name: 'Copy short URL' }))

    expect(copyText).toHaveBeenCalledWith('http://localhost:8080/example')
    expect(await screen.findByText('Clipboard access denied')).toBeInTheDocument()
  })

  it('shows copied feedback after copying the created short URL', async () => {
    shortenUrl.mockResolvedValue({ shortUrl: 'http://localhost:8080/example' })
    copyText.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<ShortenForm onShortened={vi.fn()} />)

    await user.type(screen.getByLabelText('Full URL'), 'example.com')
    await user.click(screen.getByRole('button', { name: 'Shorten URL' }))
    await user.click(screen.getByRole('button', { name: 'Copy short URL' }))

    expect(copyText).toHaveBeenCalledWith('http://localhost:8080/example')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
  })
})
