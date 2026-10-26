import { ElementType, ReactNode } from 'react';
import styles from './SectionTitle.module.css';

interface SectionTitleProps {
  as?: ElementType;
  size?: 'lg' | 'sm';
  children: ReactNode;
  className?: string;
}

export default function SectionTitle({ as: Tag = 'h2', size = 'lg', children, className }: SectionTitleProps) {
  const classes = [styles.title, size === 'sm' ? styles.sm : styles.lg, className].filter(Boolean).join(' ');
  return (
    <Tag className={classes}>
      <span className={styles.text}>{children}</span>
    </Tag>
  );
}
