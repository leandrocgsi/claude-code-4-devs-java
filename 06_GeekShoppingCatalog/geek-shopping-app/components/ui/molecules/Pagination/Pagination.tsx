import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  windowSize?: number;
}

function getPageWindow(current: number, total: number, windowSize: number): number[] {
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, current - half);
  const end = Math.min(total, start + windowSize);
  start = Math.max(0, end - windowSize);
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export default function Pagination({ page, totalPages, onPageChange, windowSize = 5 }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.pageLink}
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        Previous
      </button>
      {getPageWindow(page, totalPages, windowSize).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          className={pageNumber === page ? styles.pageLinkActive : styles.pageLink}
          onClick={() => onPageChange(pageNumber)}
          aria-current={pageNumber === page ? 'page' : undefined}
        >
          {pageNumber + 1}
        </button>
      ))}
      <button
        type="button"
        className={styles.pageLink}
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
