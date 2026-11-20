import { useState, useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabled: boolean) {
  const [isSupported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Ignora errori in fase di rilascio
      }
      sentinelRef.current = null;
    }
    setIsActive(false);
  }, []);

  const acquire = useCallback(async () => {
    if (!isSupported || !enabled) return;
    if (document.visibilityState !== 'visible') return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) {
          sentinelRef.current = null;
          setIsActive(false);
        }
      });
    } catch {
      setIsActive(false);
    }
  }, [isSupported, enabled]);

  useEffect(() => {
    if (!enabled) {
      void release();
      return;
    }
    void acquire();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      void release();
    };
  }, [enabled, acquire, release]);

  return { isSupported, isActive };
}
