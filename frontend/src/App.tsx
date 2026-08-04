function App() {
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

          <section className="govuk-inset-text" aria-label="URL shortener workspace">
            URL shortening controls will appear here.
          </section>
        </main>
      </div>
    </>
  )
}

export default App
