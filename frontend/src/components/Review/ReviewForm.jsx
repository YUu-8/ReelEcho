import { useState } from 'react';
import axios from 'axios';

const ReviewForm = ({ onSubmitSuccess }) => {
  const [form, setForm] = useState({
  userid: Math.floor(Math.random() * 1000),
  content_type: "movie",
  content_id: 100,
  score: 5,
  comment: "",
  mood: "happy"
});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/reviews", form);
      setForm({ ...form, score: 5, comment: "" });
      onSubmitSuccess?.();
      setError(""); 
    } catch (err) {
      setError("Failed to submit review!");
      console.log("error：", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ margin: '20px 0' }}>
      <h3>Write a Review</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ margin: '10px 0' }}>
        <label>Score: </label>
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
      
      <div style={{ margin: '10px 0' }}>
        <label>Comment: </label>
        <textarea
          name="comment"
          value={form.comment}
          onChange={handleChange}
        />
      </div>

      <div style={{ margin: '10px 0' }}>
      <label>Mood: </label>
      <select
        name="mood"
        value={form.mood}
        onChange={handleChange}
      >
        <option value="happy">Happy 😊</option>
        <option value="excited">Excited 🎉</option>
        <option value="neutral">Neutral 😐</option>
        <option value="sad">Sad 😢</option>
        <option value="angry">Angry 😠</option>
      </select>
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Post Review"}
      </button>
    </form>
  );
};

export default ReviewForm;