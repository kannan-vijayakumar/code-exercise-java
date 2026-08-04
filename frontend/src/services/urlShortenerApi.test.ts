import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  deleteUrl,
  listUrls,
  shortenUrl,
  toUrlShortenerApiError,
  UrlShortenerApiError,
} from './urlShortenerApi'

const fetchMock = vi.fn()

describe('urlShortenerApi', () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('serializes a shorten request and parses its response', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ shortUrl: 'http://localhost:8080/example' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      shortenUrl({ fullUrl: 'example.com', customAlias: undefined }),
    ).resolves.toEqual({ shortUrl: 'http://localhost:8080/example' })
    expect(fetchMock).toHaveBeenCalledWith('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullUrl: 'example.com' }),
    })
  })

  it('requests mappings and encodes an alias before deletion', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    await expect(listUrls()).resolves.toEqual([])
    await expect(deleteUrl('a/b')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenLastCalledWith('/api/a%2Fb', { method: 'DELETE' })
  })

  it('converts network failures into a user-facing API error', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(listUrls()).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the URL shortener service',
    })
  })

  it('preserves structured API errors and falls back for malformed responses', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'INVALID_URL', message: 'Enter a valid URL' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response('Unexpected error', { status: 500 }))

    await expect(listUrls()).rejects.toMatchObject({
      code: 'INVALID_URL',
      message: 'Enter a valid URL',
    })
    await expect(listUrls()).rejects.toMatchObject({
      code: 'REQUEST_FAILED',
      message: 'The request could not be completed',
    })
  })

  it('retains API errors and converts unknown failures to the generic error', () => {
    const apiError = new UrlShortenerApiError({
      code: 'INVALID_ALIAS',
      message: 'Alias is invalid',
    })

    expect(toUrlShortenerApiError(apiError)).toBe(apiError)
    expect(toUrlShortenerApiError(new Error('Unexpected'))).toMatchObject({
      code: 'REQUEST_FAILED',
      message: 'The request could not be completed',
    })
  })
})
