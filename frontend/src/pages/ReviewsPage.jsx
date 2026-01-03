import { useState } from 'react';
import ReviewForm from '../components/Review/ReviewForm';
import ReviewList from '../components/Review/ReviewList';

const ReviewsPage = () => {
  const [refresh, setRefresh] = useState(false);

  const handleSubmit = () => {
    setRefresh(!refresh); // 触发列表重新加载
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Reviews</h1>
      <ReviewForm onSubmitSuccess={handleSubmit} />
      <ReviewList />
    </div>
  );
};

export default ReviewsPage;