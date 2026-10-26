import { ReactNode } from 'react';
import styles from './InlineAlert.module.css';

export type InlineAlertTone = 'error' | 'success' | 'info';

interface InlineAlertProps {
  tone?: InlineAlertTone;
  children: ReactNode;
}

export default function InlineAlert({ tone = 'error', children }: InlineAlertProps) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
