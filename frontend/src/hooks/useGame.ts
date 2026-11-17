import { useEffect, useRef, useState } from "react";
import { ApiError, errorMessage } from "../api/client";
import { gamesApi } from "../api/endpoints";
import type { GameView } from "../api/types";
import { connectToGame } from "../lib/realtime";

interface GameState {
  game: GameView | null;
  error: string | null;
  notMember: boolean;
  /** Sunucu saati - cihaz saati (ms). Geri sayım için. */
  clockOffset: number;
}

const initial: GameState = { game: null, error: null, notMember: false, clockOffset: 0 };

/**
 * Oyunun bu oyuncuya özel görünümünü getirir ve SignalR "changed" sinyaliyle tazeler.
 * Aynı anda tek istek çalışır; bu sırada gelen sinyaller tek bir ek isteğe birleştirilir.
 */
export function useGame(code: string) {
  const [state, setState] = useState<GameState>(initial);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let active = true;
    let inFlight: Promise<void> | null = null;
    let queued = false;

    const load = async (): Promise<void> => {
      if (inFlight) {
        queued = true;
        return inFlight;
      }
      inFlight = (async () => {
        try {
          const view = await gamesApi.get(code);
          if (active) setState({ game: view, error: null, notMember: false, clockOffset: Date.parse(view.serverNow) - Date.now() });
        } catch (e) {
          if (active)
            setState(s => ({ ...s, error: errorMessage(e), notMember: e instanceof ApiError && e.status === 403 }));
        }
      })();
      await inFlight;
      inFlight = null;
      if (queued && active) {
        queued = false;
        await load();
      }
    };

    refreshRef.current = load;
    void load();
    const disconnect = connectToGame(code, () => void load());
    // Güvenlik ağı: canlı bağlantı sorun yaşarsa bile ekran 20 sn'den eski kalmasın
    const interval = setInterval(() => void load(), 20000);

    return () => {
      active = false;
      disconnect();
      clearInterval(interval);
    };
  }, [code]);

  const refresh = () => refreshRef.current();

  return { ...state, refresh };
}
