import { FaMinus, FaPlus } from 'react-icons/fa';
import styles from './QuantityStepper.module.css';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function QuantityStepper({ value, min = 1, max, onChange }: QuantityStepperProps) {
  return (
    <div className={styles.quantity}>
      <button
        type="button"
        className={styles.quantityButton}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <FaMinus />
      </button>
      <span className={styles.quantityValue}>{value}</span>
      <button
        type="button"
        className={styles.quantityButton}
        onClick={() => onChange(value + 1)}
        disabled={max !== undefined && value >= max}
        aria-label="Increase quantity"
      >
        <FaPlus />
      </button>
    </div>
  );
}
