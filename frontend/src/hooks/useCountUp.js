import { useEffect, useRef, useState } from 'react';

export default function useCountUp(target, duration = 650) {
  const [value, setValue] = useState(0);
  const targetRef = useRef(target);

  useEffect(() => {
    targetRef.current = Number.isFinite(target) ? target : 0;
  }, [target]);

  useEffect(() => {
    const endValue = Number.isFinite(targetRef.current) ? targetRef.current : 0;
    if (endValue <= 0) {
      setValue(0);
      return undefined;
    }

    const start = performance.now();
    let frame = null;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out curve so numbers settle naturally near the end.
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(endValue * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target, duration]);

  return value;
}
