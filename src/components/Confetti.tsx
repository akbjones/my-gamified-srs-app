import React, { useMemo } from 'react';

const COLORS = ['#FFD700', '#7C3AED', '#10B981', '#EC4899', '#F59E0B', '#3B82F6'];
const PARTICLE_COUNT = 30;

const Confetti: React.FC = () => {
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.5 + Math.random() * 1,
      size: 4 + Math.random() * 6,
      startX: (Math.random() - 0.5) * 200,
    })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `translateX(${p.startX}px)`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
