// frontend/src/pages/MovieDetail.jsx
import { useState } from 'react';
import ReviewForm from '../components/Review/ReviewForm';
import ReviewList from '../components/Review/ReviewList';

const MovieDetail = () => {
  const [refreshReviews, setRefreshReviews] = useState(false);

  const handleReviewSubmit = () => {
    setRefreshReviews(prev => !prev);
  };

  return (
    <div className="users-page panel">
      <h2>Movie Detail (ID: 100)</h2>
      <ReviewForm onSubmitSuccess={handleReviewSubmit} />
      <ReviewList />
    </div>
  );
};

export default MovieDetail;