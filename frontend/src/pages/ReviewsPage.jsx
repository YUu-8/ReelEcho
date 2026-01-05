import { useState } from 'react';
import ReviewForm from '../components/Review/ReviewForm';
import ReviewList from '../components/Review/ReviewList';

const ReviewsPage = () => {
  const [refresh, setRefresh] = useState(false);

  const handleSubmit = () => {
    setRefresh(!refresh);
  };

  return (
    <div className="users-page panel">
      <h2>Reviews</h2>
      <ReviewForm onSubmitSuccess={handleSubmit} />
      <ReviewList key={refresh} />
    </div>
  );
};

export default ReviewsPage;