import { useEffect, useState } from 'react'
import {
  deleteUrl,
  listUrls,
  UrlShortenerApiError,
} from '../services/urlShortenerApi'
import type { ShortenedUrl } from '../types/api'

interface UrlListProps {
  refreshKey: number
}

function UrlList({ refreshKey }: UrlListProps) {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [error, setError] = useState<UrlShortenerApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingAlias, setDeletingAlias] = useState<string | null>(null)
  const [deleteErrorAlias, setDeleteErrorAlias] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<UrlShortenerApiError | null>(null)

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
          setError(toApiError(caughtError))
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
    } catch (caughtError) {
      setDeleteError(toApiError(caughtError))
      setDeleteErrorAlias(alias)
    } finally {
      setDeletingAlias(null)
    }
  }

  return (
    <section aria-labelledby="urls-heading">
      <h2 className="govuk-heading-l" id="urls-heading">
        Your short URLs
      </h2>

      {isLoading && <p className="govuk-body">Loading your short URLs...</p>}

      {!isLoading && error !== null && (
        <div className="govuk-error-summary" role="alert">
          <h3 className="govuk-error-summary__title">Unable to load short URLs</h3>
          <div className="govuk-error-summary__body">
            <p>{error.message}</p>
          </div>
        </div>
      )}

      {!isLoading && error === null && urls.length === 0 && (
        <p className="govuk-body">You have not created any short URLs yet.</p>
      )}

      {!isLoading && error === null && urls.length > 0 && (
        <table className="govuk-table">
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
                <td className="govuk-table__cell">
                  <a className="govuk-link" href={shortenedUrl.fullUrl}>
                    {shortenedUrl.fullUrl}
                  </a>
                </td>
                <td className="govuk-table__cell">
                  <a className="govuk-link" href={shortenedUrl.shortUrl}>
                    {shortenedUrl.shortUrl}
                  </a>
                </td>
                <td className="govuk-table__cell">
                  <button
                    aria-label={`Delete ${shortenedUrl.alias}`}
                    className="govuk-button govuk-button--secondary"
                    disabled={deletingAlias === shortenedUrl.alias}
                    onClick={() => void handleDelete(shortenedUrl.alias)}
                    type="button"
                  >
                    {deletingAlias === shortenedUrl.alias ? 'Deleting...' : 'Delete'}
                  </button>
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
      )}
    </section>
  )
}

function toApiError(error: unknown): UrlShortenerApiError {
  if (error instanceof UrlShortenerApiError) {
    return error
  }

  return new UrlShortenerApiError({
    code: 'REQUEST_FAILED',
    message: 'The request could not be completed',
  })
}

export default UrlList
