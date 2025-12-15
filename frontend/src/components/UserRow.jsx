import PropTypes from 'prop-types'

export default function UserRow ({ user, onDelete }) {
  return (
    <li>
      <strong>{user.username}</strong> — {user.email} ({user.fullName}){' '}
      <button onClick={() => onDelete(user._id)}>Delete</button>
    </li>
  )
}

UserRow.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired
}
