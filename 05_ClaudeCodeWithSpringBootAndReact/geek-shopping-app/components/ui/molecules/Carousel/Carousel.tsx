'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './Carousel.module.css';

export interface CarouselSlide {
  id: string | number;
  content: ReactNode;
}

interface CarouselProps {
  slides: CarouselSlide[];
  intervalMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
}

export default function Carousel({ slides, intervalMs = 6000, showArrows = true, showDots = true }: CarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  const goTo = (nextIndex: number) => {
    setIndex(((nextIndex % slides.length) + slides.length) % slides.length);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.track}>
        {slides.map((slide, slideIndex) => (
          <div key={slide.id} className={styles.slide} style={{ opacity: slideIndex === index ? 1 : 0 }}>
            {slide.content}
          </div>
        ))}
      </div>

      {showArrows && slides.length > 1 ? (
        <>
          <button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => goTo(index - 1)} aria-label="Previous slide">
            <FaChevronLeft />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => goTo(index + 1)} aria-label="Next slide">
            <FaChevronRight />
          </button>
        </>
      ) : null}

      {showDots && slides.length > 1 ? (
        <div className={styles.dots}>
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className={slideIndex === index ? styles.dotActive : styles.dot}
              onClick={() => goTo(slideIndex)}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
