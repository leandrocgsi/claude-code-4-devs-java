'use client';

import { useEffect, useState } from 'react';
import { FaAngleDoubleUp } from 'react-icons/fa';
import styles from './BackToTop.module.css';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 100);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={styles.button}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <FaAngleDoubleUp />
    </button>
  );
}
