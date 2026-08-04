import { useState } from 'react'
import ShortenForm from './components/ShortenForm'
import UrlList from './components/UrlList'

function App() {
  const [urlListRefreshKey, setUrlListRefreshKey] = useState(0)

  return (
    <>
      <a className="govuk-skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="govuk-header" role="banner">
        <div className="app-header__container govuk-width-container govuk-header__container">
          <div className="app-header__brand govuk-header__logo">
            <a className="govuk-header__link govuk-header__link--homepage" href="/">
              <span className="govuk-header__logotype-text">Shorter</span>
            </a>
            <span className="app-header__service-name">URL shortener</span>
          </div>
          <nav aria-label="Primary navigation">
            <ul className="app-header__navigation govuk-list">
              <li>
                <a className="govuk-header__link" href="#shorten-form">
                  Create URL
                </a>
              </li>
              <li>
                <a className="govuk-header__link" href="#urls-list">
                  Manage links
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="govuk-width-container">
        <main className="govuk-main-wrapper" id="main-content">
          <h1 className="govuk-heading-xl">URL shortener</h1>
          <p className="govuk-body-l">
            Create memorable short links, keep track of them, and remove them
            whenever you need.
          </p>

          <ShortenForm
            onShortened={() => setUrlListRefreshKey((currentKey) => currentKey + 1)}
          />
          <UrlList refreshKey={urlListRefreshKey} />
        </main>
      </div>
    </>
  )
}

export default App
