// frontend/src/pages/PostsPage.jsx
import { useState } from 'react'
import usePosts from '../hooks/usePosts.js'
import PostForm from '../components/PostForm.jsx'
import PostRow from '../components/PostRow.jsx'

export default function PostsPage () {
  const { posts, loading, error, reload, deletePost, updatePost } = usePosts()
  const [sortMode, setSortMode] = useState('newest')

  if (loading) return <p>Loading posts...</p>

  // Sort posts based on selected mode
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.post_date);
    const dateB = new Date(b.post_date);
    
    switch(sortMode) {
      case 'newest':
        return dateB - dateA; // Latest first
      case 'oldest':
        return dateA - dateB; // Oldest first
      default:
        return dateB - dateA;
    }
  })

  return (
    <div className="users-page panel">
      <h2>Posts</h2>

      <PostForm onCreated={reload} />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <button className="cta secondary" onClick={reload}>Refresh</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#9ca3af', fontSize: '0.9em' }}>Sort by:</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#e5e7eb',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="newest" style={{ background: '#1e293b', color: '#e5e7eb' }}>Latest First</option>
            <option value="oldest" style={{ background: '#1e293b', color: '#e5e7eb' }}>Oldest First</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {sortedPosts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {sortedPosts.map(post => (
            <PostRow
              key={post.id}
              post={post}
              onDelete={deletePost}
              onUpdate={updatePost}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
