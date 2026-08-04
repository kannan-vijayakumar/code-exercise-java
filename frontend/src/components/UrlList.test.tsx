import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UrlList from './UrlList'

const { copyText, deleteUrl, listUrls } = vi.hoisted(() => ({
  copyText: vi.fn(),
  deleteUrl: vi.fn(),
  listUrls: vi.fn(),
}))

vi.mock('../services/urlShortenerApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/urlShortenerApi')>()
  return { ...actual, deleteUrl, listUrls }
})

vi.mock('../services/clipboard', () => ({ copyText }))

const shortenedUrl = {
  alias: 'example',
  fullUrl: 'https://example.com',
  shortUrl: 'http://localhost:8080/example',
}

describe('UrlList', () => {
  beforeEach(() => {
    copyText.mockReset()
    deleteUrl.mockReset()
    listUrls.mockReset()
  })

  it('requires confirmation before deleting a URL', async () => {
    listUrls.mockResolvedValue([shortenedUrl])
    deleteUrl.mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<UrlList refreshKey={0} />)

    await screen.findByText('https://example.com')
    await user.click(screen.getByRole('button', { name: 'Delete example' }))

    expect(deleteUrl).not.toHaveBeenCalled()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' && element.textContent === 'Delete example?',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => expect(deleteUrl).toHaveBeenCalledWith('example'))
    await waitFor(() =>
      expect(
        screen.getByText(/You have not created any short URLs yet/),
      ).toBeInTheDocument(),
    )
  })

  it('keeps a URL when deletion is cancelled', async () => {
    listUrls.mockResolvedValue([shortenedUrl])
    const user = userEvent.setup()

    render(<UrlList refreshKey={0} />)

    await screen.findByText(shortenedUrl.fullUrl)
    await user.click(screen.getByRole('button', { name: 'Delete example' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(deleteUrl).not.toHaveBeenCalled()
    expect(screen.getByText(shortenedUrl.fullUrl)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Delete example' }),
    ).toBeInTheDocument()
  })

  it('shows an API error when loading mappings fails', async () => {
    const { UrlShortenerApiError } =
      await import('../services/urlShortenerApi')
    listUrls.mockRejectedValue(
      new UrlShortenerApiError({
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the URL shortener service',
      }),
    )

    render(<UrlList refreshKey={0} />)

    const errorSummary = await screen.findByRole('alert')
    expect(errorSummary).toHaveTextContent('Unable to load short URLs')
    expect(errorSummary).toHaveTextContent(
      'Unable to reach the URL shortener service',
    )
  })

  it('shows a copy error when clipboard access fails', async () => {
    listUrls.mockResolvedValue([shortenedUrl])
    copyText.mockRejectedValue(new Error('Clipboard access denied'))
    const user = userEvent.setup()

    render(<UrlList refreshKey={0} />)

    await screen.findByText(shortenedUrl.fullUrl)
    await user.click(screen.getByRole('button', { name: 'Copy short URL' }))

    expect(
      await screen.findByText('Unable to copy the short URL'),
    ).toBeInTheDocument()
  })

  it('opens the original URL safely in a separate tab', async () => {
    listUrls.mockResolvedValue([shortenedUrl])

    render(<UrlList refreshKey={0} />)

    const fullUrlLink = await screen.findByRole('link', {
      name: shortenedUrl.fullUrl,
    })
    expect(fullUrlLink).toHaveAttribute('target', '_blank')
    expect(fullUrlLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the deletion error next to the URL that could not be removed', async () => {
    const { UrlShortenerApiError } =
      await import('../services/urlShortenerApi')
    listUrls.mockResolvedValue([shortenedUrl])
    deleteUrl.mockRejectedValue(
      new UrlShortenerApiError({
        code: 'REQUEST_FAILED',
        message: 'Unable to delete this short URL',
      }),
    )
    const user = userEvent.setup()

    render(<UrlList refreshKey={0} />)

    await screen.findByText(shortenedUrl.fullUrl)
    await user.click(screen.getByRole('button', { name: 'Delete example' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(
      await screen.findByText('Unable to delete this short URL'),
    ).toBeInTheDocument()
    expect(screen.getByText(shortenedUrl.fullUrl)).toBeInTheDocument()
  })

  it('reloads mappings when refreshKey changes', async () => {
    listUrls
      .mockResolvedValueOnce([shortenedUrl])
      .mockResolvedValueOnce([
        {
          ...shortenedUrl,
          alias: 'updated',
          shortUrl: 'http://localhost:8080/updated',
        },
      ])

    const { rerender } = render(<UrlList refreshKey={0} />)

    await screen.findByText(shortenedUrl.fullUrl)
    rerender(<UrlList refreshKey={1} />)

    await waitFor(() => expect(listUrls).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('updated')).toBeInTheDocument()
  })
})
