import { useState } from 'react'
import PropTypes from 'prop-types'

export default function UserForm ({ onCreated }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit (e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, fullName, bio })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setUsername('')
      setEmail('')
      setPassword('')
      setFullName('')
      setBio('')
      onCreated()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
      </div>
      <div>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
      </div>
      <div>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Full name"
          required
        />
      </div>
      <div>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Bio (optional)"
          rows="3"
        />
      </div>
      <button className="cta" type="submit">Add user</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}

UserForm.propTypes = {
  onCreated: PropTypes.func.isRequired
}
