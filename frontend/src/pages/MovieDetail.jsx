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
    <div className="container mx-auto p-4">
      <h1>Movie Detail (ID: 100)</h1>
      <ReviewForm onSubmitSuccess={handleReviewSubmit} />
      <ReviewList refreshTrigger={refreshReviews} />
    </div>
  );
};

export default MovieDetail;