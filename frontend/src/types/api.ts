export interface ShortenUrlRequest {
  fullUrl: string
  customAlias?: string
}

export interface ShortenUrlResponse {
  shortUrl: string
}

export interface ShortenedUrl {
  alias: string
  fullUrl: string
  shortUrl: string
}

export interface ApiError {
  code: string
  message: string
}
