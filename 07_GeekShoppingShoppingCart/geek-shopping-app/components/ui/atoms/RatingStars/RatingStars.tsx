import { FaStar, FaStarHalfAlt } from 'react-icons/fa';
import styles from './RatingStars.module.css';

interface RatingStarsProps {
  rating?: number | null;
  reviewCount?: number;
}

export default function RatingStars({ rating, reviewCount }: RatingStarsProps) {
  if (rating === null || rating === undefined) return null;

  return (
    <div className={styles.rating} aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index + 1 <= Math.floor(rating);
        const half = !filled && index < rating;
        if (filled) return <FaStar key={index} />;
        if (half) return <FaStarHalfAlt key={index} />;
        return <FaStar key={index} className={styles.starEmpty} />;
      })}
      {reviewCount ? <span className={styles.reviewCount}>({reviewCount})</span> : null}
    </div>
  );
}
