import { useEffect, useState } from "react";

/**
 * Aşama bitişine kalan saniye (sunucu saatine göre düzeltilmiş).
 * Süre dolunca onExpire, sunucunun geçişi yapabilmesi için kısa bir gecikmeyle çağrılır.
 */
export function useCountdown(endsAt: string | null, clockOffset: number, onExpire?: () => void): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [endsAt]);

  const remaining = endsAt ? Math.max(0, Math.ceil((Date.parse(endsAt) - (now + clockOffset)) / 1000)) : null;
  const expired = remaining === 0;

  useEffect(() => {
    if (!expired) return;
    const id = setTimeout(() => onExpire?.(), 1500);
    return () => clearTimeout(id);
  }, [expired, endsAt, onExpire]);

  return remaining;
}

export function formatClock(seconds: number | null): string {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
