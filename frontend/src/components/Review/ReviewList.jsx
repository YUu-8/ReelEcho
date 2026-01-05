import { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCache, setShowCache] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchReviews = async () => {
    try {
      const res = await axios.get("/api/reviews");
      setReviews(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load reviews!");
      console.log("error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/users");
        setUsers(res.data);
      } catch (err) {
        console.log("Failed to load users:", err.message);
      }
    };
    fetchReviews();
    fetchUsers();
  }, []); 

  // Fetch show details for each review and cache them
  useEffect(() => {
    const loadShows = async () => {
      const missingIds = reviews
        .map(r => r.content_id)
        .filter(id => id != null && showCache[id] === undefined);
      if (missingIds.length === 0) return;

      try {
        const results = await Promise.all(
          missingIds.map(id =>
            axios
              .get(`/api/shows/${encodeURIComponent(id)}`)
              .then(res => ({ id, data: res.data }))
              .catch(() => ({ id, data: null }))
          )
        );

        const next = { ...showCache };
        results.forEach(({ id, data }) => {
          next[id] = data;
        });
        setShowCache(next);
      } catch (err) {
        console.log("Failed to load show details:", err.message);
      }
    };

    if (reviews.length) loadShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  const handleEdit = (review) => {
    setEditingId(review.reviewid);
    setEditForm({
      score: review.score,
      comment: review.comment,
      mood: review.mood,
      emoji: review.emoji
    });
  };

  const handleUpdate = async (reviewid) => {
    try {
      await axios.put(`/api/reviews/${reviewid}`, editForm);
      setEditingId(null);
      fetchReviews();
    } catch (err) {
      setError("Failed to update review!");
      console.log("error:", err.message);
    }
  };

  const handleDelete = async (reviewid) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      await axios.delete(`/api/reviews/${reviewid}`);
      fetchReviews();
    } catch (err) {
      setError("Failed to delete review!");
      console.log("error:", err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getUserName = (userid) => {
    const user = users.find(u => u._id === userid);
    return user ? user.username : `User ${userid}`;
  };

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p style={{ color: '#ff6b6b' }}>{error}</p>;
  if (reviews.length === 0) return <p>No reviews yet.</p>;

  return (
    <div style={{ marginTop: '24px' }}>
      <h3>Reviews</h3>
      {reviews.map((r) => (
        <div key={r.reviewid} style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px', margin: '12px 0', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', gap: 12 }}>
          {/* text column */}
          <div style={{ flex: 1 }}>
          {editingId === r.reviewid ? (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={editForm.score}
                  onChange={(e) => setEditForm({ ...editForm, score: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Comment</label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  rows={3}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Emoji</label>
                <input
                  type="text"
                  value={editForm.emoji}
                  onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                  maxLength="2"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Mood</label>
                <select
                  value={editForm.mood}
                  onChange={(e) => setEditForm({ ...editForm, mood: e.target.value })}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#e5e7eb',
                    width: '100%',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  <option value="happy" style={{ background: '#1e293b', color: '#e5e7eb' }}>Happy 😊</option>
                  <option value="excited" style={{ background: '#1e293b', color: '#e5e7eb' }}>Excited 🎉</option>
                  <option value="neutral" style={{ background: '#1e293b', color: '#e5e7eb' }}>Neutral 😐</option>
                  <option value="sad" style={{ background: '#1e293b', color: '#e5e7eb' }}>Sad 😢</option>
                  <option value="angry" style={{ background: '#1e293b', color: '#e5e7eb' }}>Angry 😠</option>
                </select>
              </div>
              <button className="cta" onClick={() => handleUpdate(r.reviewid)}>Save</button>
              <button className="cta secondary" onClick={handleCancel} style={{ marginLeft: '8px' }}>Cancel</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '8px', fontSize: '0.95em', color: '#e5e7eb', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span><strong>User:</strong> {getUserName(r.userid)}</span>
                <span>| <strong>Title:</strong> { (showCache[r.content_id]?.name) || r.movie_title || `ID ${r.content_id}` }</span>
              </div>
              <p style={{ margin: '0 0 8px', color: '#38bdf8', fontWeight: '600' }}>Score: {r.score}/10 | Mood: {r.mood.charAt(0).toUpperCase() + r.mood.slice(1)} {r.emoji}</p>
              <p style={{ margin: '0 0 12px', color: '#e5e7eb', lineHeight: '1.6' }}>{r.comment}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="cta secondary" onClick={() => handleEdit(r)}>Edit</button>
                <button className="cta secondary" onClick={() => handleDelete(r.reviewid)}>Delete</button>
              </div>
            </>
          )}
          </div>

          {/* poster column */}
          {editingId !== r.reviewid && (
            <div style={{ width: 110, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <img
                src={showCache[r.content_id]?.image || 'https://via.placeholder.com/90x135?text=No+Image'}
                alt={showCache[r.content_id]?.name || r.movie_title || 'Poster'}
                style={{ width: 90, height: 135, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;