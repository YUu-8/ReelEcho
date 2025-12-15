import { useEffect, useState } from 'react'

export default function useUsers () {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadUsers () {
    try {
      setError('')
      setLoading(true)
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setUsers(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser (id) {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u._id !== id))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return { users, loading, error, reload: loadUsers, deleteUser }
}
