import styles from './Spinner.module.css';

interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label = 'Loading' }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
