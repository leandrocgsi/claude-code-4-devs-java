import { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children ? <div className={styles.action}>{children}</div> : null}
    </div>
  );
}
