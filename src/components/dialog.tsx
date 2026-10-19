'use client';

import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from 'react';

import { useScrollLock } from '@/lib/use-scroll-lock';

/**
 * Single dialog primitive for the app.
 * - variant "sheet": right-hand drawer (full width on phones), used by the source drawer.
 * - variant "modal": centred panel, bottom sheet on phones, used by admin forms.
 * Handles overlay click, Escape, page scroll lock and focus restore.
 */
export function Dialog({
  open,
  onClose,
  variant = 'modal',
  labelledBy,
  initialFocusRef,
  className = '',
  overlayLabel = 'Close dialog',
  children,
}: {
  open: boolean;
  onClose: () => void;
  variant?: 'sheet' | 'modal';
  labelledBy?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  overlayLabel?: string;
  children: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => onCloseRef.current(), []);
  useScrollLock(open, close);

  useEffect(() => {
    if (!open) return;
    const lastFocused = document.activeElement as HTMLElement | null;
    initialFocusRef?.current?.focus();
    return () => lastFocused?.focus?.();
  }, [open, initialFocusRef]);

  if (!open) return null;

  const sheet = variant === 'sheet';
  return (
    <div className={`fixed inset-0 z-50 flex ${sheet ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-4'}`}>
      <button
        type="button"
        aria-label={overlayLabel}
        tabIndex={-1}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 overflow-y-auto overscroll-contain bg-background shadow-2xl ${
          sheet
            ? 'flex h-full w-full max-w-md flex-col border-l border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6'
            : 'max-h-[90svh] w-full max-w-2xl rounded-t-3xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl sm:p-6'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
