import { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  square?: boolean;
}

export default function Button({ variant = 'primary', square = false, className, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], square ? styles.square : null, className].filter(Boolean).join(' ');
  return <button className={classes} {...rest} />;
}
