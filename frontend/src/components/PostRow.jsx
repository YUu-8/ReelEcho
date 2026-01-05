// frontend/src/components/PostRow.jsx
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function PostRow ({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(post.content ?? '')
  const [review, setReview] = useState(null)
  const [postAuthor, setPostAuthor] = useState(null)
  const [reviewAuthor, setReviewAuthor] = useState(null)
  const [showCache, setShowCache] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users first to match by ID
        const allUsersRes = await fetch('/api/users')
        const allUsers = allUsersRes.ok ? await allUsersRes.json() : []

        // Find post author from all users
        const postUser = allUsers.find(u => String(u._id) === String(post.userid))
        if (postUser) {
          setPostAuthor(postUser)
        }

        // Fetch review
        const revRes = await fetch(`/api/reviews/${post.reviewid}`)
        if (revRes.ok) {
          const revData = await revRes.json()
          setReview(revData)
          
          // Fetch show details if needed
          if (revData.content_id && !showCache[revData.content_id]) {
            const showRes = await fetch(`/api/shows/${encodeURIComponent(revData.content_id)}`)
            if (showRes.ok) {
              const showData = await showRes.json()
              setShowCache(prev => ({ ...prev, [revData.content_id]: showData }))
            }
          }

          // Find review author from all users
          const reviewUser = allUsers.find(u => String(u._id) === String(revData.userid))
          if (reviewUser) {
            setReviewAuthor(reviewUser)
          }
        }
      } catch (err) {
        console.log('Failed to load post details:', err.message)
      }
    }

    fetchData()
  }, [post.reviewid, post.userid])

  async function handleSave () {
    // Call parent hook; it returns true/false
    const ok = await onUpdate(post.id, draft)
    if (ok) setIsEditing(false)
  }

  function handleCancel () {
    setDraft(post.content ?? '')
    setIsEditing(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  const postDate = formatDate(post.post_date);
  // Show the actual post author, or Unknown if post.userid is null
  const postUsername = postAuthor ? postAuthor.username : 'Unknown User';
  const reviewUsername = reviewAuthor ? reviewAuthor.username : (review ? `User ${review.userid}` : 'Unknown');
  const showTitle = review && showCache[review.content_id] 
    ? showCache[review.content_id].name 
    : (review ? review.movie_title : 'Unknown');

  return (
    <li style={{ marginBottom: '16px', padding: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)' }}>
      <div style={{ marginBottom: '12px', fontSize: '0.9em', color: '#9ca3af' }}>
        <strong>{postUsername}</strong> - {postDate}
      </div>

      {review && (
        <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.85em', color: '#93c5fd', marginBottom: '6px' }}>Review by {reviewUsername} - {showTitle}</div>
          <div style={{ color: '#e5e7eb', fontSize: '0.95em', marginBottom: '4px' }}>Score: <strong>{review.score}/10</strong> | Mood: <strong>{review.mood}</strong> {review.emoji}</div>
          <div style={{ color: '#d1d5db', fontSize: '0.9em' }}>{review.comment}</div>
        </div>
      )}

      {!isEditing ? (
        <>
          <div style={{ marginBottom: '8px', color: '#e5e7eb' }}>{post.content}</div>
          <button className="cta secondary" onClick={() => setIsEditing(true)}>Edit</button>
        </>
      ) : (
        <>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Edit content"
            rows={4}
            style={{ width: '100%', marginBottom: '8px' }}
          />
          <button className="cta" onClick={handleSave}>Save</button>
          <button className="cta secondary" onClick={handleCancel}>Cancel</button>
        </>
      )}
      <button className="cta secondary" onClick={() => onDelete(post.id)} style={{ marginLeft: '8px' }}>Delete</button>
    </li>
  )
}

PostRow.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number.isRequired,
    userid: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    reviewid: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    post_date: PropTypes.string
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}
