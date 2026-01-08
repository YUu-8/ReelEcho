import { useState, useEffect } from 'react';
import axios from 'axios';

const ReviewForm = ({ onSubmitSuccess }) => {
  const [form, setForm] = useState({
  userid: '',
  content_type: "movie",
  movie_title: "",
  content_id: '',
  score: '',
  comment: "",
  mood: "neutral",
  emoji: "😐"
});
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchErr, setSearchErr] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
        setUsersError("");
        if (res.data.length > 0) {
          setForm(prev => ({ ...prev, userid: res.data[0]._id }));
        }
      } catch (err) {
        console.log('Failed to load users:', err.message);
        setUsersError("Failed to load users. Please refresh.");
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function searchShows() {
    setSearchErr("");
    setSearching(true);
    try {
      const q = searchQuery.trim();
      if (!q) {
        setSearchResults([]);
        setSearchErr("Type a title to search.");
        return;
      }
      const res = await axios.get(`/api/shows?query=${encodeURIComponent(q)}`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setSearchResults(arr);
      if (arr.length === 0) setSearchErr("No results.");
    } catch (err) {
      setSearchResults([]);
      setSearchErr(err.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  const selectShow = (show) => {
    setForm((prev) => ({
      ...prev,
      movie_title: show?.name || "",
      content_id: show?.id ?? ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.content_id || !form.movie_title) {
        setError("Please select a title from search results.");
        setLoading(false);
        return;
      }

      if (form.score === '' || form.score === null || form.score === undefined) {
        setError("Please enter a score between 0 and 10.");
        setLoading(false);
        return;
      }

      const submitData = {
        userid: form.userid,
        content_type: form.content_type,
        content_id: form.content_id,
        movie_title: form.movie_title,
        score: Number(form.score),
        comment: form.comment,
        mood: form.mood,
        emoji: form.emoji
      };
      
      await axios.post("/api/reviews", submitData);
      setForm({ userid: form.userid, content_type: "movie", movie_title: "", content_id: "", score: '', comment: "", mood: "neutral", emoji: "😐" });
      setSearchQuery("");
      setSearchResults([]);
      onSubmitSuccess?.();
      setError(""); 
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to submit review!");
      console.log("error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Write a Review</h3>
      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>User</label>
        <select
          name="userid"
          value={form.userid}
          onChange={handleChange}
          required
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
          {users.length === 0 && !usersError && <option value="" style={{ background: '#1e293b', color: '#e5e7eb' }}>Loading users...</option>}
          {usersError && <option value="" style={{ background: '#1e293b', color: '#e5e7eb' }}>{usersError}</option>}
          {users.map(user => (
            <option key={user._id} value={user._id} style={{ background: '#1e293b', color: '#e5e7eb' }}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
        {usersError && <div style={{ color: '#ff6b6b', marginTop: 6 }}>{usersError}</div>}
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Content Type</label>
        <select
          name="content_type"
          value={form.content_type}
          onChange={handleChange}
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
          <option value="movie" style={{ background: '#1e293b', color: '#e5e7eb' }}>Movie</option>
          <option value="tv" style={{ background: '#1e293b', color: '#e5e7eb' }}>TV Show</option>
        </select>
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Search title</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a movie or show title..."
            style={{ flex: 1 }}
          />
          <button className="cta secondary" type="button" onClick={searchShows} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchErr ? <div style={{ color: 'crimson', marginTop: 6 }}>Search: {searchErr}</div> : null}
        {form.movie_title && (
          <div style={{ marginTop: 8, color: '#9ca3af' }}>
            Selected: <strong style={{ color: '#e5e7eb' }}>{form.movie_title}</strong>
          </div>
        )}
        {searchResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 10 }}>
            {searchResults
              .filter(s => {
                // Filter by content type
                if (form.content_type === 'movie') {
                  return s.type === 'Movie';
                } else if (form.content_type === 'tv') {
                  return s.type === 'TV Show';
                }
                return true;
              })
              .slice(0, 10)
              .map((s) => {
              const full = String(s.summary || '').replace(/<[^>]*>/g, '').trim();
              const short = full.slice(0, 160);
              return (
                <li
                  key={s.id}
                  style={{
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: 10,
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <img
                    src={s.image || 'https://via.placeholder.com/70x105?text=No+Img'}
                    alt=""
                    style={{ width: 70, height: 105, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 950 }}>
                      {s.name}{" "}
                      <span style={{ opacity: 0.6, fontWeight: 600, fontSize: 13 }}>
                        {s.type ? `[${s.type}]` : ""}
                      </span>
                    </div>

                    {full ? (
                      <div style={{ opacity: 0.9, fontSize: 12, marginTop: 6, lineHeight: 1.35 }}>
                        {short + (full.length > 160 ? "..." : "")}
                      </div>
                    ) : null}
                  </div>

                  <button className="cta secondary" type="button" onClick={() => selectShow(s)} style={{ flexShrink: 0 }}>
                    Select
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Score (0-10)</label>
        <input
          type="number"
          name="score"
          min="0"
          max="10"
          value={form.score}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Comment</label>
        <textarea
          name="comment"
          value={form.comment}
          onChange={handleChange}
          placeholder="Share your thoughts about this review..."
          rows="3"
        />
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Emoji</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px' }}>
          {['😀', '😊', '😍', '🤩', '😎', '😢', '😭', '😡', '🤔', '😴', '🤗', '😱', '🥳', '🤯', '😐', '🙄', '😌', '🤑'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm({ ...form, emoji })}
              style={{
                fontSize: '24px',
                padding: '8px 12px',
                border: form.emoji === emoji ? '2px solid #38bdf8' : '2px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                background: form.emoji === emoji ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: '#9ca3af' }}>Mood</label>
        <select
          name="mood"
          value={form.mood}
          onChange={handleChange}
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
      
      <button className="cta" type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Post Review"}
      </button>
    </form>
  );
};

export default ReviewForm;