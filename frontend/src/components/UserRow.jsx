import PropTypes from 'prop-types'

export default function UserRow ({ user, onDelete }) {
  return (
    <li>
      <div>
        <strong>{user.username}</strong> - {user.email} ({user.fullName})
        {user.bio && <p style={{ margin: '4px 0 0', fontSize: '0.9em', color: '#aaa' }}>{user.bio}</p>}
      </div>
      <button onClick={() => onDelete(user._id)}>Delete</button>
    </li>
  )
}

UserRow.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
    bio: PropTypes.string
  }).isRequired,
  onDelete: PropTypes.func.isRequired
}
