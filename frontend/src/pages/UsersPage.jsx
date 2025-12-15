import useUsers from '../hooks/useUsers.js'
import UserRow from '../components/UserRow.jsx'
import UserForm from '../components/UserForm.jsx'

export default function UsersPage () {
  const { users, loading, error, reload, deleteUser } = useUsers()

  if (loading) return <p>Loading users...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div className="users-page panel">
      <h2>Users</h2>
      <UserForm onCreated={reload} />
      <button className="cta secondary" onClick={reload}>Refresh</button>
      <ul>
        {users.map(user => (
          <UserRow key={user._id} user={user} onDelete={deleteUser} />
        ))}
      </ul>
    </div>
  )
}
