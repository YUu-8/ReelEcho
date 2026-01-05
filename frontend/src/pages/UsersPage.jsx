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
      <div style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '8px', padding: '12px', marginTop: '24px', marginBottom: '16px', fontSize: '0.9em', color: '#ffc107' }}>
        ⚠️ <strong>Showcase Mode:</strong> For simplicity, login and admin roles are not implemented. Any user can be selected across all pages and deletion is allowed only for demo purposes. In production, user selection and deletion would be locked behind proper authentication and administrator controls.
      </div>
      <ul>
        {users.map(user => (
          <UserRow key={user._id} user={user} onDelete={deleteUser} />
        ))}
      </ul>
    </div>
  )
}
