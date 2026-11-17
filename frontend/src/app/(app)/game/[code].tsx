import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, RotateCcw } from "../../../components/icons";
import { useState } from "react";
import { View } from "react-native";
import { errorMessage } from "../../../api/client";
import { gamesApi } from "../../../api/endpoints";
import type { GameSettings, PlayerView } from "../../../api/types";
import { ActionPanel, EventLog, PhaseHeader, PlayerList, ReadyPanel, RoleCard, WinnerBanner } from "../../../components/game/GameParts";
import { LobbyPanel } from "../../../components/game/Lobby";
import { ErrorAlert, Loading, Screen } from "../../../components/layout";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Text } from "../../../components/ui/text";
import { useCountdown } from "../../../hooks/useCountdown";
import { useGame } from "../../../hooks/useGame";
import { confirm } from "../../../lib/platform";
import { colors, phaseInfo } from "../../../theme";

export default function GameScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();
  const { game, error: loadError, notMember, clockOffset, refresh } = useGame(code);
  const remaining = useCountdown(game?.phaseEndsAt ?? null, clockOffset, refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  /** Komutu çalıştırır; ekran SignalR sinyaliyle zaten tazelenir ama hemen de çekeriz. */
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (notMember) {
    return (
      <Screen>
        <Card className="mt-10">
          <CardHeader className="items-center">
            <Text className="text-5xl">🚪</Text>
            <CardTitle className="text-center">Bu odanın oyuncusu değilsin</CardTitle>
            <CardDescription className="text-center">Oda kodu: {code}</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button onPress={() => router.replace(`/join/${code}`)}><Text>Odaya katıl</Text></Button>
            <Button variant="outline" onPress={() => router.replace("/home")}><Text>Ana sayfa</Text></Button>
          </CardContent>
        </Card>
      </Screen>
    );
  }

  if (!game) {
    return loadError ? (
      <Screen>
        <ErrorAlert message={loadError} />
        <Button onPress={() => void refresh()}><Text>Tekrar dene</Text></Button>
        <Button variant="outline" onPress={() => router.replace("/home")}><Text>Ana sayfa</Text></Button>
      </Screen>
    ) : (
      <Loading />
    );
  }

  const phase = phaseInfo[game.phase];
  const inProgress = game.phase === "Night" || game.phase === "Day" || game.phase === "Voting";

  const kick = async (p: PlayerView) => {
    const lobby = game.phase === "Lobby";
    const ok = await confirm(
      lobby ? "Oyuncuyu çıkar" : "Oyuncuyu ele",
      lobby ? `${p.username} odadan çıkarılsın mı?` : `${p.username} oyundan elensin mi? Ölmüş sayılır ve herkese duyurulur.`,
      lobby ? "Çıkar" : "Ele",
    );
    if (ok) await run(() => gamesApi.kick(code, p.id));
  };

  const abort = async () => {
    if (await confirm("Oyunu sonlandır", "Oyun herkes için bitecek ve roller açıklanacak.", "Sonlandır"))
      await run(() => gamesApi.abort(code));
  };

  const leave = async () => {
    if (await confirm("Odadan ayrıl", "Odadan ayrılmak istediğine emin misin?", "Ayrıl")) {
      if (await run(() => gamesApi.leave(code))) router.replace("/home");
    }
  };

  return (
    <Screen glow={game.phase === "Lobby" || game.phase === "Ended" ? colors.primary : phase.color}>
      <View className="flex-row items-center justify-between">
        <Button variant="ghost" size="sm" onPress={goHome}>
          <ArrowLeft size={18} color={colors.foreground} />
          <Text>Geri</Text>
        </Button>
        {game.isOwner && inProgress && (
          <Button variant="destructive" size="sm" onPress={abort}>
            <Text>Oyunu sonlandır</Text>
          </Button>
        )}
      </View>

      <PhaseHeader game={game} remaining={inProgress ? remaining : null} />
      <ErrorAlert message={error ?? (loadError && game ? `Bağlantı sorunu: ${loadError}` : null)} />

      {game.phase === "Lobby" && (
        <LobbyPanel
          game={game}
          busy={busy}
          onStart={() => void run(() => gamesApi.start(code))}
          onLeave={leave}
          onSaveSettings={(s: GameSettings) => run(() => gamesApi.updateSettings(code, s))}
        />
      )}

      {game.phase === "Ended" && (
        <>
          <WinnerBanner game={game} />
          {game.isOwner ? (
            <Button size="lg" onPress={() => void run(() => gamesApi.rematch(code))} loading={busy}>
              <RotateCcw size={18} color="#fff" />
              <Text>Aynı oyuncularla tekrar oyna</Text>
            </Button>
          ) : (
            <Text variant="muted" className="text-center">Yönetici tekrar oyun başlatabilir.</Text>
          )}
        </>
      )}

      {inProgress && (
        <>
          <RoleCard role={game.myRole} alive={game.myAlive} secretInfo={game.secretInfo} />
          {game.action && (
            <ActionPanel action={game.action} players={game.players} busy={busy} accent={phase.color}
              onSubmit={targetId => void run(() => gamesApi.action(code, targetId))} />
          )}
          {game.phase === "Night" && !game.action && game.myAlive && (
            <Card className="items-center">
              <CardHeader className="items-center">
                <Text className="text-4xl">😴</Text>
                <CardTitle>Bu gece yapacağın bir şey yok</CardTitle>
                <CardDescription className="text-center">Gözlerini kapat ve bekle. Sabah olunca uyanırsın… umarız.</CardDescription>
              </CardHeader>
            </Card>
          )}
          {game.ready && game.myAlive && (
            <ReadyPanel ready={game.ready} busy={busy} onToggle={() => void run(() => gamesApi.ready(code))} />
          )}
        </>
      )}

      <PlayerList game={game} onKick={game.isOwner && game.phase !== "Ended" ? kick : undefined} />
      <EventLog events={game.events} />
    </Screen>
  );
}
