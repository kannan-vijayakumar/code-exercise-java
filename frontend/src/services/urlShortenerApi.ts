import type {
  ApiError,
  ShortenedUrl,
  ShortenUrlRequest,
  ShortenUrlResponse,
} from '../types/api'
import logger from './logger'

const API_BASE_PATH = '/api'

export class UrlShortenerApiError extends Error {
  readonly code: string

  constructor({ code, message }: ApiError) {
    super(message)
    this.name = 'UrlShortenerApiError'
    this.code = code
  }
}

export async function shortenUrl(
  request: ShortenUrlRequest,
): Promise<ShortenUrlResponse> {
  return requestJson<ShortenUrlResponse>('/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
}

export async function listUrls(): Promise<ShortenedUrl[]> {
  return requestJson<ShortenedUrl[]>('/urls')
}

export async function deleteUrl(alias: string): Promise<void> {
  await request('/' + encodeURIComponent(alias), { method: 'DELETE' })
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await request(path, init)
  return (await response.json()) as T
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(API_BASE_PATH + path, init)
  } catch (networkError) {
    logger.error('Network request failed', { path }, networkError)
    throw new UrlShortenerApiError({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the URL shortener service',
    })
  }

  if (!response.ok) {
    const error = await toResponseError(response)
    logger.warn('API request rejected', { path, status: response.status, code: error.code })
    throw error
  }

  return response
}

async function toResponseError(response: Response): Promise<UrlShortenerApiError> {
  try {
    const error = (await response.json()) as ApiError
    if (typeof error.code === 'string' && typeof error.message === 'string') {
      return new UrlShortenerApiError(error)
    }
  } catch {
    // Use the generic error when a non-JSON response cannot be parsed.
    logger.warn('Failed to parse error response body', { status: response.status })
  }

  return new UrlShortenerApiError({
    code: 'REQUEST_FAILED',
    message: 'The request could not be completed',
  })
}

export function toUrlShortenerApiError(error: unknown): UrlShortenerApiError {
  if (error instanceof UrlShortenerApiError) {
    return error
  }

  logger.error('Unexpected error converted to UrlShortenerApiError', error)
  return new UrlShortenerApiError({
    code: 'REQUEST_FAILED',
    message: 'The request could not be completed',
  })
}
