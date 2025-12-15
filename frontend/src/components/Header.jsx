export default function Header() {
  return (
    <section className="hero">
      <p className="eyebrow">MERN learning lab</p>
      <h1>Build, break, and learn safely</h1>
      <p className="lede">
        ReelEcho is a compact MERN sandbox: Express + Mongoose backend, Vite + React frontend,
        Vitest + Supertest for confidence, and a proxy to wire it all together. Tinker with
        routes, models, and UI without fear.
      </p>
      <div className="pills">
        <span className="pill">Express</span>
        <span className="pill">Mongoose</span>
        <span className="pill">Vite</span>
        <span className="pill">React</span>
        <span className="pill">Vitest</span>
        <span className="pill">Supertest</span>
      </div>
    </section>
  )
}
