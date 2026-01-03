// frontend/src/components/PostRow.jsx
import { useState } from 'react'
import PropTypes from 'prop-types'

export default function PostRow ({ post, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(post.content ?? '')

  async function handleSave () {
    // Call parent hook; it returns true/false
    const ok = await onUpdate(post.id, draft)
    if (ok) setIsEditing(false)
  }

  function handleCancel () {
    setDraft(post.content ?? '')
    setIsEditing(false)
  }

  return (
    <li>
      <strong>#{post.id}</strong> — user {post.userid}, review {post.reviewid}{' '}
      {!isEditing ? (
        <>
          : {post.content}{' '}
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </>
      ) : (
        <>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Edit content"
          />
          <button onClick={handleSave}>Save</button>
          <button onClick={handleCancel}>Cancel</button>
        </>
      )}
      <button onClick={() => onDelete(post.id)}>Delete</button>
    </li>
  )
}

PostRow.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number.isRequired,
    userid: PropTypes.number.isRequired,
    reviewid: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}
