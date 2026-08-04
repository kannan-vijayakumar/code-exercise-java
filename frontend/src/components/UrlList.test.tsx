import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UrlList from './UrlList'

const { deleteUrl, listUrls } = vi.hoisted(() => ({
  deleteUrl: vi.fn(),
  listUrls: vi.fn(),
}))

vi.mock('../services/urlShortenerApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../services/urlShortenerApi')>()
  return { ...actual, deleteUrl, listUrls }
})

describe('UrlList', () => {
  beforeEach(() => {
    deleteUrl.mockReset()
    listUrls.mockReset()
  })

  it('requires confirmation before deleting a URL', async () => {
    listUrls.mockResolvedValue([
      {
        alias: 'example',
        fullUrl: 'https://example.com',
        shortUrl: 'http://localhost:8080/example',
      },
    ])
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
})
