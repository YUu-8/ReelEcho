import { useEffect, useState } from 'react';
import axios from 'axios';

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/reviews");
        setReviews(res.data);
      } catch (err) {
        setError("Failed to load reviews!");
        console.log("error：", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []); 

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (reviews.length === 0) return <p>No reviews yet.</p>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Reviews</h3>
      {reviews.map((r, i) => (
        <div key={i} style={{ border: '1px solid #ddd', padding: '10px', margin: '10px 0' }}>
          <p>Score: {r.score}/10 | Mood: {r.mood}</p>
          <p>{r.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;