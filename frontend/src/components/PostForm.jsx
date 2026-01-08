// frontend/src/components/PostForm.jsx
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function PostForm ({ onCreated }) {
  const [userid, setUserid] = useState('')
  const [users, setUsers] = useState([])
  const [reviewid, setReviewid] = useState('')
  const [reviews, setReviews] = useState([])
  const [showCache, setShowCache] = useState({})
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        setUsers(data);
        if (data.length > 0) {
          setUserid(data[0]._id);
        }
      } catch (err) {
        console.log('Failed to load users:', err.message);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        const data = await res.json();
        setReviews(data);
        if (data.length > 0) {
          setReviewid(String(data[0].reviewid));
        }
      } catch (err) {
        console.log('Failed to load reviews:', err.message);
      }
    };

    fetchUsers();
    fetchReviews();
  }, [])

  useEffect(() => {
    const loadShows = async () => {
      const missingIds = reviews
        .map(r => r.content_id)
        .filter(id => id != null && showCache[id] === undefined);
      if (missingIds.length === 0) return;

      try {
        const results = await Promise.all(
          missingIds.map(id =>
            fetch(`/api/shows/${encodeURIComponent(id)}`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          )
        );

        const next = { ...showCache };
        missingIds.forEach((id, idx) => {
          if (results[idx]) next[id] = results[idx];
        });
        setShowCache(next);
      } catch (err) {
        console.log('Failed to load show details:', err.message);
      }
    };

    if (reviews.length) loadShows();
  }, [reviews])

  const selectedReview = reviews.find(rv => String(rv.reviewid) === String(reviewid));
  const getUserName = (id) => {
    const u = users.find(user => user._id === id || String(user._id) === String(id));
    return u ? u.username : `User ${id}`;
  };

  async function handleSubmit (e) {
    e.preventDefault()
    setError('')

    const rid = Number(reviewid)
    const text = String(content).trim()

    // Basic client-side checks (backend will also validate)
    if (!userid) return setError('Please select a user')
    if (!Number.isFinite(rid) || rid <= 0) return setError('Please select a review')
    if (!text) return setError('content cannot be empty')

    try {
      setLoading(true)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, reviewid: rid, content: text })
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
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Create your post</h3>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>User</label>
        <select
          value={userid}
          onChange={e => setUserid(e.target.value)}
          required
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 12px',
            color: '#e5e7eb',
            width: '100%',
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          {users.length === 0 && <option value="" style={{ background: '#1e293b', color: '#e5e7eb' }}>Loading users...</option>}
          {users.map(user => (
            <option key={user._id} value={user._id} style={{ background: '#1e293b', color: '#e5e7eb' }}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Review</label>
        <select
          value={reviewid}
          onChange={e => setReviewid(e.target.value)}
          required
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '10px 12px',
            color: '#e5e7eb',
            width: '100%',
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          {reviews.length === 0 && <option value="" style={{ background: '#1e293b', color: '#e5e7eb' }}>Loading reviews...</option>}
          {reviews.map(rv => {
            const title = (showCache[rv.content_id]?.name) || rv.movie_title || `Title #${rv.content_id}`;
            const userLabel = getUserName(rv.userid);
            const snippet = rv.comment?.slice(0, 30) || 'No comment';
            return (
              <option key={rv.reviewid} value={rv.reviewid} style={{ background: '#1e293b', color: '#e5e7eb' }}>
                {userLabel} - {title}: {rv.score}/10, "{snippet}"
              </option>
            );
          })}
        </select>
        {reviewid && reviews.length > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ color: '#9ca3af', fontSize: '0.9em', marginBottom: 6 }}>Selected review</div>
            {(() => {
              const r = reviews.find(rv => String(rv.reviewid) === String(reviewid));
              if (!r) return <div style={{ color: '#ff6b6b' }}>Review not found</div>;
              const title = (showCache[r.content_id]?.name) || r.movie_title || `Title #${r.content_id}`;
              return (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{title}</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.9em' }}>User: {getUserName(r.userid)}</div>
                  <div style={{ color: '#38bdf8', fontWeight: 600 }}>Score: {r.score}/10 | Mood: {r.mood} {r.emoji}</div>
                  <div style={{ color: '#e5e7eb', lineHeight: 1.5 }}>{r.comment || 'No comment provided.'}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a post..."
          rows={4}
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
