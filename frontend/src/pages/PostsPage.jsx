// frontend/src/pages/PostsPage.jsx
import usePosts from '../hooks/usePosts.js'
import PostForm from '../components/PostForm.jsx'
import PostRow from '../components/PostRow.jsx'

export default function PostsPage () {
  const { posts, loading, error, reload, deletePost, updatePost } = usePosts()

  if (loading) return <p>Loading posts...</p>

  return (
    <div className="posts-page panel">
      <h2>Posts</h2>

      <PostForm onCreated={reload} />

      <button className="cta secondary" onClick={reload}>Refresh</button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map(post => (
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
