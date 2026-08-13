import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function InfoTooltip({ text, placement = 'top', className = '' }) {
  const [show, setShow] = useState(false);
  const iconRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setShow(true);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShow(false), 60);
  }, []);

  if (!text) return null;

  const rect = iconRef.current?.getBoundingClientRect();

  const getStyle = () => {
    if (!rect) return { display: 'none' };
    const gap = 6;
    if (placement === 'bottom') {
      return { position: 'fixed', top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
    }
    if (placement === 'left') {
      return { position: 'fixed', top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + gap, transform: 'translateY(-50%)' };
    }
    if (placement === 'right') {
      return { position: 'fixed', top: rect.top + rect.height / 2, left: rect.right + gap, transform: 'translateY(-50%)' };
    }
    // top
    return { position: 'fixed', bottom: window.innerHeight - rect.top + gap, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
  };

  const popup = show ? createPortal(
    <span
      className={`info-tooltip-popup info-tooltip-${placement}`}
      style={getStyle()}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {text}
    </span>,
    document.body
  ) : null;

  return (
    <span
      className={`info-tooltip-wrap ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={iconRef}
    >
      <span className="info-tooltip-icon">i</span>
      {popup}
    </span>
  );
}
