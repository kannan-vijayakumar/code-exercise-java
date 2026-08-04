import type {
  ApiError,
  ShortenedUrl,
  ShortenUrlRequest,
  ShortenUrlResponse,
} from '../types/api'

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
  } catch {
    throw new UrlShortenerApiError({
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the URL shortener service',
    })
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return response
}

async function toApiError(response: Response): Promise<UrlShortenerApiError> {
  try {
    const error = (await response.json()) as ApiError
    if (typeof error.code === 'string' && typeof error.message === 'string') {
      return new UrlShortenerApiError(error)
    }
  } catch {
    // Use the generic error when a non-JSON response cannot be parsed.
  }

  return new UrlShortenerApiError({
    code: 'REQUEST_FAILED',
    message: 'The request could not be completed',
  })
}
