'use client';

import { useEffect } from 'react';

/**
 * Locks page scroll while `active` is true and calls `onEscape` when Escape is pressed.
 * Shared by the mobile menu, the source drawer and the admin modal.
 */
export function useScrollLock(active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [active, onEscape]);
}
