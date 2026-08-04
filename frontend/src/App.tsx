import './App.css'

function App() {
  return (
    <main className="page">
      <header className="header">
        <a className="brand" href="/">
          Shorter
        </a>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Simple link management</p>
        <h1 id="page-title">Make every link easier to share.</h1>
        <p className="intro">
          Create memorable short links, keep track of them, and remove them
          whenever you need.
        </p>
      </section>

      <section className="workspace" aria-label="URL shortener workspace">
        <p>URL shortening controls will appear here.</p>
      </section>
    </main>
  )
}

export default App
