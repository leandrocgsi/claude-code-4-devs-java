import { TextareaHTMLAttributes, forwardRef } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, id, className, ...rest },
  ref,
) {
  return (
    <div className={styles.field}>
      {label ? (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea ref={ref} id={id} className={[styles.textarea, className].filter(Boolean).join(' ')} {...rest} />
    </div>
  );
});

export default Textarea;
