// frontend/src/components/PostForm.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'

export default function PostForm ({ onCreated }) {
  const [userid, setUserid] = useState('1')
  const [reviewid, setReviewid] = useState('1')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit (e) {
    e.preventDefault()
    setError('')

    const uid = Number(userid)
    const rid = Number(reviewid)
    const text = String(content).trim()

    // Basic client-side checks (backend will also validate)
    if (!Number.isFinite(uid) || uid <= 0) return setError('userid must be a positive number')
    if (!Number.isFinite(rid) || rid <= 0) return setError('reviewid must be a positive number')
    if (!text) return setError('content cannot be empty')

    try {
      setLoading(true)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: uid, reviewid: rid, content: text })
      })

      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const data = await res.json()
          msg = data?.error || data?.message || msg
        } catch {}
        throw new Error(msg)
      }

      // Clear only content; keep userid/reviewid for faster testing
      setContent('')
      onCreated()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div>
        <input
          type="number"
          min="1"
          value={userid}
          onChange={e => setUserid(e.target.value)}
          placeholder="userid (default 1)"
          required
        />
      </div>

      <div>
        <input
          type="number"
          min="1"
          value={reviewid}
          onChange={e => setReviewid(e.target.value)}
          placeholder="reviewid (default 1)"
          required
        />
      </div>

      <div>
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a post..."
          required
        />
      </div>

      <button className="cta" type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add post'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}

PostForm.propTypes = {
  onCreated: PropTypes.func.isRequired
}
