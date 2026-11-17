import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr";
import { getAuthToken } from "../api/client";
import { API_URL } from "./config";

/**
 * Oyun odasının canlı kanalı. Sunucu yalnızca "changed" sinyali yollar; istemci görünümünü yeniden çeker.
 * Bağlantı koparsa otomatik yeniden bağlanır ve gruba tekrar katılır.
 */
export function connectToGame(code: string, onChanged: () => void): () => void {
  let stopped = false;
  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl(`${API_URL}/hubs/game`, { accessTokenFactory: () => getAuthToken() ?? "" })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000, 15000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("changed", onChanged);
  connection.onreconnected(async () => {
    await connection.invoke("JoinGame", code).catch(() => undefined);
    onChanged(); // kopukken kaçan değişiklikleri al
  });

  (async function start(attempt = 0) {
    try {
      await connection.start();
      if (stopped) return void connection.stop();
      await connection.invoke("JoinGame", code);
    } catch {
      if (!stopped) setTimeout(() => start(attempt + 1), Math.min(30000, 1000 * 2 ** attempt));
    }
  })();

  return () => {
    stopped = true;
    void connection.stop();
  };
}
