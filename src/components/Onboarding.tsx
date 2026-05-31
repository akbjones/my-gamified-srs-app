import React, { useState, useRef, useCallback, useEffect } from 'react';

const SLIDES = [
  {
    title: 'Welcome to LangLab',
    description: 'Learn 11 languages through immersion. Real sentences, real context.',
  },
  {
    title: 'Spaced Repetition',
    description: 'Flashcards appear at the right time to help you remember. The more you practice, the smarter your schedule gets.',
  },
  {
    title: 'Tap Any Word',
    description: 'Tap any word in a sentence to see its definition, pronunciation, and grammar — instant context when you need it.',
  },
  {
    title: 'Rate Your Knowledge',
    description: 'For every card, rate how well you knew it: Again, Hard, Good, or Easy. This personalizes your review schedule.',
  },
  {
    title: 'Choose Your Focus',
    description: 'Focus your vocabulary on what matters to you — travel, work, or family. Or study general vocabulary across all topics.',
  },
  {
    title: 'Ready to Start?',
    description: 'Pick your language and begin your journey. You can switch languages anytime!',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const deltaXRef = useRef(0);
  const isDragging = useRef(false);

  const isLast = current === SLIDES.length - 1;

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    setCurrent(clamped);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(current + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
      else if (e.key === 'Enter' && isLast) onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, isLast, goTo, onComplete]);

  // Touch/swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    deltaXRef.current = 0;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    deltaXRef.current = e.touches[0].clientX - startXRef.current;
    if (trackRef.current) {
      const slideWidth = 100 / SLIDES.length;
      const offset = -(current * slideWidth) + (deltaXRef.current / window.innerWidth) * slideWidth;
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(${offset}%)`;
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    const threshold = 50;
    if (deltaXRef.current < -threshold) goTo(current + 1);
    else if (deltaXRef.current > threshold) goTo(current - 1);
    // Snap back
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.3s ease';
      trackRef.current.style.transform = `translateX(-${current * (100 / SLIDES.length)}%)`;
    }
  };

  // Sync transform on slide change
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.3s ease';
      trackRef.current.style.transform = `translateX(-${current * (100 / SLIDES.length)}%)`;
    }
  }, [current]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-primary)]">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onComplete}
          className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-3 py-1"
        >
          Skip
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div
          ref={trackRef}
          className="flex h-full"
          style={{ width: `${SLIDES.length * 100}%`, transform: `translateX(-${current * (100 / SLIDES.length)}%)`, transition: 'transform 0.3s ease' }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-8 text-center"
              style={{ width: `${100 / SLIDES.length}%` }}
            >
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-3">{slide.title}</h2>
              <p className="text-base text-[var(--text-muted)] max-w-xs leading-relaxed">{slide.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-5 pb-12 px-6">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-[var(--accent)]'
                  : 'w-2.5 h-2.5 bg-[var(--text-muted)]/30 hover:bg-[var(--text-muted)]/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          {current > 0 && (
            <button
              onClick={() => goTo(current - 1)}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? onComplete : () => goTo(current + 1)}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-[var(--accent)] hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent)]/25 active:scale-[0.98]"
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
