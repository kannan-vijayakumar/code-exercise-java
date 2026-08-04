import { useEffect, useRef, useState } from 'react'
import {
  deleteUrl,
  listUrls,
  toUrlShortenerApiError,
  type UrlShortenerApiError,
} from '../services/urlShortenerApi'
import { copyText } from '../services/clipboard'
import logger from '../services/logger'
import type { ShortenedUrl } from '../types/api'

interface UrlListProps {
  refreshKey: number
}

function UrlList({ refreshKey }: UrlListProps) {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [error, setError] = useState<UrlShortenerApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingAlias, setDeletingAlias] = useState<string | null>(null)
  const [confirmingAlias, setConfirmingAlias] = useState<string | null>(null)
  const [deleteErrorAlias, setDeleteErrorAlias] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<UrlShortenerApiError | null>(null)
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null)
  const [copyErrorAlias, setCopyErrorAlias] = useState<string | null>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    async function loadUrls() {
      setIsLoading(true)
      setError(null)

      try {
        const mappings = await listUrls()
        if (isCurrent) {
          setUrls(mappings)
        }
      } catch (caughtError) {
        if (isCurrent) {
          setError(toUrlShortenerApiError(caughtError))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadUrls()

    return () => {
      isCurrent = false
    }
  }, [refreshKey])

  async function handleDelete(alias: string) {
    setDeleteError(null)
    setDeleteErrorAlias(null)
    setDeletingAlias(alias)

    try {
      await deleteUrl(alias)
      setUrls((currentUrls) =>
        currentUrls.filter((shortenedUrl) => shortenedUrl.alias !== alias),
      )
      setConfirmingAlias(null)
    } catch (caughtError) {
      setDeleteError(toUrlShortenerApiError(caughtError))
      setDeleteErrorAlias(alias)
    } finally {
      setDeletingAlias(null)
    }
  }

  function requestDelete(alias: string) {
    setDeleteError(null)
    setDeleteErrorAlias(null)
    setConfirmingAlias(alias)
  }

  async function handleCopy(alias: string, shortUrl: string) {
    setCopyErrorAlias(null)
    try {
      await copyText(shortUrl)
      setCopiedAlias(alias)
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current)
      }
      copyResetTimeoutRef.current = window.setTimeout(() => setCopiedAlias(null), 2000)
    } catch {
      logger.warn('Failed to copy short URL to clipboard', { alias })
      setCopyErrorAlias(alias)
    }
  }

  return (
    <section aria-labelledby="urls-heading" id="urls-list">
      <h2 className="govuk-heading-l" id="urls-heading">
        Your short URLs
      </h2>

      {isLoading && <p className="govuk-body">Loading your short URLs...</p>}

      {!isLoading && error !== null && (
        <div
          aria-labelledby="url-list-error-title"
          className="govuk-error-summary"
          role="alert"
        >
          <h2 className="govuk-error-summary__title" id="url-list-error-title">
            Unable to load short URLs
          </h2>
          <div className="govuk-error-summary__body">
            <p>{error.message}</p>
          </div>
        </div>
      )}

      {!isLoading && error === null && urls.length === 0 && (
        <p className="govuk-body">You have not created any short URLs yet.</p>
      )}

      {!isLoading && error === null && urls.length > 0 && (
        <div className="url-list__table-wrapper">
          <table className="govuk-table url-list__table">
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th className="govuk-table__header" scope="col">
                Alias
              </th>
              <th className="govuk-table__header" scope="col">
                Full URL
              </th>
              <th className="govuk-table__header" scope="col">
                Short URL
              </th>
              <th className="govuk-table__header" scope="col">
                Actions
              </th>
            </tr>
          </thead>
            <tbody className="govuk-table__body">
              {urls.map((shortenedUrl) => (
                <tr className="govuk-table__row" key={shortenedUrl.alias}>
                  <td className="govuk-table__cell">{shortenedUrl.alias}</td>
                  <td className="govuk-table__cell url-list__url">
                    <a
                      className="govuk-link"
                      href={shortenedUrl.fullUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {shortenedUrl.fullUrl}
                    </a>
                  </td>
                  <td className="govuk-table__cell url-list__url">
                    <a className="govuk-link" href={shortenedUrl.shortUrl}>
                      {shortenedUrl.shortUrl}
                    </a>
                  </td>
                  <td className="govuk-table__cell url-list__actions">
                    <div className="url-list__action-buttons">
                      <button
                        className="govuk-button govuk-button--secondary"
                        onClick={() => void handleCopy(shortenedUrl.alias, shortenedUrl.shortUrl)}
                        type="button"
                      >
                        {copiedAlias === shortenedUrl.alias
                          ? 'Copied'
                          : 'Copy short URL'}
                      </button>
                      {confirmingAlias !== shortenedUrl.alias && (
                        <button
                          aria-label={`Delete ${shortenedUrl.alias}`}
                          className="govuk-button govuk-button--warning"
                          onClick={() => requestDelete(shortenedUrl.alias)}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    {confirmingAlias === shortenedUrl.alias && (
                      <div className="url-list__confirmation">
                        <p className="govuk-body-s">
                          Delete <strong>{shortenedUrl.alias}</strong>?
                        </p>
                        <div className="url-list__action-buttons">
                          <button
                            className="govuk-button govuk-button--warning"
                            disabled={deletingAlias === shortenedUrl.alias}
                            onClick={() => void handleDelete(shortenedUrl.alias)}
                            type="button"
                          >
                            {deletingAlias === shortenedUrl.alias
                              ? 'Deleting...'
                              : 'Yes, delete'}
                          </button>
                          <button
                            className="govuk-button govuk-button--secondary"
                            disabled={deletingAlias === shortenedUrl.alias}
                            onClick={() => setConfirmingAlias(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {copyErrorAlias === shortenedUrl.alias && (
                      <p className="govuk-error-message">
                        <span className="govuk-visually-hidden">Error:</span> Unable to copy
                        the short URL
                      </p>
                    )}
                    {deleteError !== null && deleteErrorAlias === shortenedUrl.alias && (
                      <p className="govuk-error-message">
                        <span className="govuk-visually-hidden">Error:</span>{' '}
                        {deleteError.message}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default UrlList
