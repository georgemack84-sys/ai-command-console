'use client';

let lockCount = 0;
let previousOverflow = '';

export function acquireScrollLock() {
  if (lockCount++ === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  return () => {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) document.body.style.overflow = previousOverflow;
  };
}
