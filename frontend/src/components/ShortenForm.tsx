import { useEffect, useRef, useState, type FormEvent } from 'react'
import { copyText } from '../services/clipboard'
import logger from '../services/logger'
import {
  shortenUrl,
  toUrlShortenerApiError,
  type UrlShortenerApiError,
} from '../services/urlShortenerApi'

interface ShortenFormProps {
  onShortened: () => void
}

function ShortenForm({ onShortened }: ShortenFormProps) {
  const [fullUrl, setFullUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [error, setError] = useState<UrlShortenerApiError | null>(null)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)

  const fullUrlError = error?.code === 'INVALID_URL' ? error.message : null
  const aliasError =
    error?.code === 'INVALID_ALIAS' || error?.code === 'ALIAS_ALREADY_EXISTS'
      ? error.message
      : null
  const generalError =
    error !== null && fullUrlError === null && aliasError === null
      ? error.message
      : null
  useEffect(() => {
    if (error !== null) {
      errorSummaryRef.current?.focus()
    }
  }, [error])

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setShortUrl(null)
    setIsCopied(false)
    setCopyError(null)
    setIsSubmitting(true)

    try {
      const response = await shortenUrl({
        fullUrl,
        customAlias: customAlias.trim() || undefined,
      })
      setShortUrl(response.shortUrl)
      setFullUrl('')
      setCustomAlias('')
      onShortened()
    } catch (caughtError) {
      setError(toUrlShortenerApiError(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCopy() {
    if (shortUrl === null) {
      return
    }

    setCopyError(null)
    try {
      await copyText(shortUrl)
      setIsCopied(true)
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000)
    } catch (caughtError) {
      logger.warn('Failed to copy short URL to clipboard', caughtError)
      setCopyError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to copy the short URL',
      )
    }
  }

  return (
    <section aria-labelledby="shorten-heading" id="shorten-form">
      <h2 className="govuk-heading-l" id="shorten-heading">
        Shorten a URL
      </h2>

      {error !== null && (
        <div
          className="govuk-error-summary"
          aria-labelledby="error-summary-title"
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
        >
          <h2 className="govuk-error-summary__title" id="error-summary-title">
            There is a problem
          </h2>
          <div className="govuk-error-summary__body">
            <ul className="govuk-list govuk-error-summary__list">
              {fullUrlError !== null && (
                <li>
                  <a href="#full-url">{fullUrlError}</a>
                </li>
              )}
              {aliasError !== null && (
                <li>
                  <a href="#custom-alias">{aliasError}</a>
                </li>
              )}
              {generalError !== null && <li>{generalError}</li>}
            </ul>
          </div>
        </div>
      )}

      {shortUrl !== null && (
        <div className="govuk-notification-banner govuk-notification-banner--success" role="status">
          <div className="govuk-notification-banner__header">
            <h2 className="govuk-notification-banner__title">Success</h2>
          </div>
          <div className="govuk-notification-banner__content">
            <p className="govuk-notification-banner__heading">
              Your short URL is{' '}
              <a className="govuk-link" href={shortUrl}>
                {shortUrl}
              </a>
            </p>
            <div className="app-button-row">
              <button
                className="govuk-button govuk-button--secondary app-copy-button"
                onClick={() => void handleCopy()}
                type="button"
              >
                {isCopied ? 'Copied' : 'Copy short URL'}
              </button>
            </div>
            {copyError !== null && (
              <p className="govuk-error-message">
                <span className="govuk-visually-hidden">Error:</span> {copyError}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`govuk-form-group${fullUrlError !== null ? ' govuk-form-group--error' : ''}`}>
          <label className="govuk-label govuk-label--m" htmlFor="full-url">
            Full URL
          </label>
          <div className="govuk-hint">
            For example, google.com or https://www.example.com
          </div>
          {fullUrlError !== null && (
            <p className="govuk-error-message" id="full-url-error">
              <span className="govuk-visually-hidden">Error:</span> {fullUrlError}
            </p>
          )}
          <input
            aria-describedby={fullUrlError !== null ? 'full-url-error' : undefined}
            className={`govuk-input${fullUrlError !== null ? ' govuk-input--error' : ''}`}
            id="full-url"
            inputMode="url"
            name="fullUrl"
            onChange={(event) => setFullUrl(event.target.value)}
            required
            type="text"
            value={fullUrl}
          />
        </div>

        <div className={`govuk-form-group${aliasError !== null ? ' govuk-form-group--error' : ''}`}>
          <label className="govuk-label govuk-label--m" htmlFor="custom-alias">
            Custom alias <span className="govuk-hint">(optional)</span>
          </label>
          <div className="govuk-hint">
            Use 3 to 50 letters, numbers, hyphens, or underscores.
          </div>
          {aliasError !== null && (
            <p className="govuk-error-message" id="custom-alias-error">
              <span className="govuk-visually-hidden">Error:</span> {aliasError}
            </p>
          )}
          <input
            aria-describedby={aliasError !== null ? 'custom-alias-error' : undefined}
            className={`govuk-input${aliasError !== null ? ' govuk-input--error' : ''}`}
            id="custom-alias"
            name="customAlias"
            onChange={(event) => setCustomAlias(event.target.value)}
            value={customAlias}
          />
        </div>

        <button className="govuk-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Shortening URL...' : 'Shorten URL'}
        </button>
      </form>
    </section>
  )
}

export default ShortenForm
