"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setIsActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { seconds, minutes: minutes, display, isActive, start, isExpired: seconds <= 0 && !isActive };
}
