import { useState } from 'react'
import ShortenForm from './components/ShortenForm'
import UrlList from './components/UrlList'

function App() {
  const [urlListRefreshKey, setUrlListRefreshKey] = useState(0)

  return (
    <>
      <header className="govuk-header" role="banner">
        <div className="govuk-width-container govuk-header__container">
          <div className="govuk-header__logo">
            <a className="govuk-header__link govuk-header__link--homepage" href="/">
              <span className="govuk-header__logotype-text">Shorter</span>
            </a>
          </div>
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
