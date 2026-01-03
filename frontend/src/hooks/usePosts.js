// frontend/src/hooks/usePosts.js
import { useEffect, useState } from 'react'

export default function usePosts () {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Helper: try to read backend error message
  async function readErrorMessage (res) {
    try {
      const data = await res.json()
      return data?.error || data?.message || `HTTP ${res.status}`
    } catch {
      return `HTTP ${res.status}`
    }
  }

  async function loadPosts () {
    try {
      setError('')
      setLoading(true)

      const res = await fetch('/api/posts')
      if (!res.ok) {
        throw new Error(await readErrorMessage(res))
      }

      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // DELETE /api/posts/:id  (id is numeric)
  async function deletePost (id) {
    try {
      setError('')
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(await readErrorMessage(res))
      }

      // Remove from UI without refresh
      setPosts(prev => prev.filter(p => p.id !== id))
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  // PUT /api/posts/:id (backend updates only "content")
  async function updatePost (id, content) {
    const trimmed = String(content ?? '').trim()
    if (!trimmed) {
      setError('Content cannot be empty')
      return false
    }

    try {
      setError('')
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      })

      if (!res.ok) {
        throw new Error(await readErrorMessage(res))
      }

      const updated = await res.json()

      // Update UI immediately (no reload needed)
      setPosts(prev => prev.map(p => (p.id === id ? updated : p)))
      return true
    } catch (e) {
      setError(e.message)
      return false
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  return { posts, loading, error, reload: loadPosts, deletePost, updatePost }
}
