import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, EyeOff, Hand, Skull } from "../icons";
import { View } from "react-native";
import { Appear } from "../motion";
import type { ActionView, EventView, GameView, PlayerView, ReadyView } from "../../api/types";
import { TargetGrid, useOptimisticPick } from "./TargetGrid";
import { formatClock } from "../../hooks/useCountdown";
import { cn } from "../../lib/utils";
import { colors, phaseInfo, roleInfo } from "../../theme";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";

// ───────────── Üst bilgi: aşama, tur, geri sayım ─────────────

function phaseTotal(game: GameView): number | null {
  const s = game.settings;
  return game.phase === "Night" ? s.nightSeconds : game.phase === "Day" ? s.discussionSeconds : game.phase === "Voting" ? s.votingSeconds : null;
}

export function PhaseHeader({ game, remaining }: { game: GameView; remaining: number | null }) {
  const phase = phaseInfo[game.phase];
  const Icon = phase.icon;
  const total = phaseTotal(game);
  const urgent = remaining !== null && remaining <= 10;

  return (
    <Appear key={game.phase} duration={500}>
      <View className="overflow-hidden rounded-3xl border" style={{ borderColor: `${phase.color}55` }}>
        <LinearGradient
          colors={[`${phase.color}38`, `${phase.color}0a`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, gap: 16 }}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${phase.color}2e` }}>
                <Icon size={24} color={phase.color} />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-extrabold" style={{ color: phase.color }}>{phase.label}</Text>
                <Text variant="muted" className="text-xs">
                  {game.round > 0 && game.phase !== "Ended" ? `${game.round}. tur · ` : ""}Oda {game.code}
                </Text>
              </View>
            </View>
            {remaining !== null && (
              <Text
                accessibilityLabel={`Kalan süre ${remaining} saniye`}
                className={cn("text-4xl font-extrabold", urgent ? "text-destructive" : "text-foreground")}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatClock(remaining)}
              </Text>
            )}
          </View>
          {remaining !== null && total ? (
            <Progress value={(remaining / total) * 100} className="h-1.5 bg-white/10" color={urgent ? colors.destructive : phase.color} />
          ) : null}
          {game.phase !== "Lobby" && game.phase !== "Ended" && (
            <Text className="text-foreground/80 text-sm leading-5">{phase.hint}</Text>
          )}
        </LinearGradient>
      </View>
    </Appear>
  );
}

// ───────────── Son olay: herkese açık en yeni olay, büyük ve okunur ─────────────

export function Spotlight({ game }: { game: GameView }) {
  const latest = [...game.events].reverse().find(e => !e.isPrivate);
  if (!latest) return null;
  const phase = phaseInfo[latest.phase];
  return (
    <Appear key={latest.id} kind="up" duration={350}>
      <View className="bg-card flex-row items-start gap-3 rounded-2xl border p-4" style={{ borderColor: `${phase.color}40` }}>
        <View className="mt-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phase.color }} />
        <View className="flex-1 gap-0.5">
          <Text variant="overline" className="text-[10px]">Son olay</Text>
          <Text className="text-base font-semibold leading-6">{latest.message}</Text>
        </View>
      </View>
    </Appear>
  );
}

// ───────────── Oylama paneli (herkese açık; oylar yüz yüze tartışılır) ─────────────

export function VotePanel({
  action,
  players,
  onSubmit,
}: {
  action: ActionView;
  players: PlayerView[];
  onSubmit: (targetId: string | null) => Promise<unknown>;
}) {
  const { selected, pending, pick } = useOptimisticPick(action.currentTargetId, onSubmit);
  const byId = new Map(players.map(p => [p.id, p]));
  const voted = action.hasActed || pending;

  return (
    <Appear kind="up" duration={350}>
      <Card style={{ borderColor: `${colors.vote}66` }}>
        <CardHeader>
          <CardTitle>{action.prompt}</CardTitle>
          <CardDescription>
            {voted
              ? <>Oyun: <Text className="text-foreground text-sm font-semibold">{selected ? byId.get(selected)?.username : "Pas"}</Text>. Süre bitene kadar değiştirebilirsin.</>
              : "En çok oy alan asılır. Eşitlikte kimse asılmaz."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <TargetGrid
            targets={action.targets}
            players={players}
            selected={selected}
            locked={action.locked}
            disabled={pending}
            accent={colors.vote}
            onPick={id => void pick(id)}
          />
          {action.canSkip && (
            <Button variant="outline" disabled={pending} onPress={() => void pick(null)}>
              {action.hasActed && selected === null && <Check size={16} color={colors.foreground} />}
              <Text>{action.hasActed && selected === null ? "Pas geçtin" : "Pas geç"}</Text>
            </Button>
          )}
        </CardContent>
      </Card>
    </Appear>
  );
}

export function ReadyPanel({ ready, busy, onToggle }: { ready: ReadyView; busy: boolean; onToggle: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tartışma bitti mi?</CardTitle>
        <CardDescription>Hayattakilerin yarısından fazlası hazır olunca oylama hemen başlar.</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="gap-2">
          <View className="flex-row justify-between">
            <Text variant="muted" className="text-xs">Hazır olanlar</Text>
            <Text className="text-xs font-bold">{ready.count}/{ready.needed}</Text>
          </View>
          <Progress value={(ready.count / Math.max(1, ready.needed)) * 100} color={colors.day} />
        </View>
        <Button variant={ready.iAmReady ? "outline" : "default"} loading={busy} onPress={onToggle}>
          <Hand size={18} color={ready.iAmReady ? colors.foreground : "#fff"} />
          <Text>{ready.iAmReady ? "Hazırım (geri al)" : "Oylamaya hazırım"}</Text>
        </Button>
      </CardContent>
    </Card>
  );
}

// ───────────── Oyuncu listesi ─────────────

export function PlayerList({ game, onKick }: { game: GameView; onKick?: (p: PlayerView) => void }) {
  const alive = game.players.filter(p => p.isAlive).length;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Oyuncular</CardTitle>
        <Badge variant="secondary">
          <Text>{game.phase === "Lobby" ? `${game.players.length}/${game.settings.maxPlayers}` : `${alive} hayatta`}</Text>
        </Badge>
      </CardHeader>
      <CardContent className="gap-1">
        {game.players.map(p => {
          // Sunucu kendi rolünü (vampirlere diğer vampirleri de) gönderir, ama oyun sürerken bunu listede
          // açık göstermek gizli rol kartını anlamsız kılar: masadaki biri ekrana bakınca görür.
          // Oyun sırasında yalnızca ölenlerin rolü (zaten herkese duyuruldu), oyun bitince hepsi gösterilir.
          const publicRole = game.phase === "Ended" || !p.isAlive;
          const role = p.role && publicRole ? roleInfo[p.role] : null;
          return (
            <View key={p.id} className={cn("min-h-[56px] flex-row items-center gap-3 rounded-xl px-2 py-1.5", p.isMe && "bg-accent/60")}>
              <View>
                <Avatar name={p.username} dimmed={!p.isAlive} />
                {p.isOwner && (
                  <View className="bg-day absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-card">
                    <Crown size={10} color="#3b2a05" strokeWidth={3} />
                  </View>
                )}
              </View>
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-1.5">
                  {!p.isAlive && <Skull size={14} color={colors.mutedForeground} />}
                  <Text
                    numberOfLines={1}
                    className={cn("shrink text-[15px]", p.isMe ? "font-bold" : "font-medium", !p.isAlive && "text-muted-foreground line-through")}
                  >
                    {p.username}
                  </Text>
                  {p.isMe && <Text variant="muted" className="text-xs">(sen)</Text>}
                </View>
                {!p.isAlive && p.deathCause && <Text variant="muted" className="text-xs">{p.deathCause}</Text>}
              </View>
              <View className="flex-row flex-wrap items-center justify-end gap-1.5">
                {role && <Badge variant={role.badge}><Text>{role.emoji} {role.name}</Text></Badge>}
                {p.hasVoted && <Badge variant="vote"><Text>Oy verdi</Text></Badge>}
                {p.isReady && <Badge variant="day"><Text>Hazır</Text></Badge>}
                {onKick && !p.isOwner && (game.phase === "Lobby" || p.isAlive) && (
                  <Button variant="destructive" size="sm" onPress={() => onKick(p)}>
                    <Text>{game.phase === "Lobby" ? "Çıkar" : "Ele"}</Text>
                  </Button>
                )}
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ───────────── Olay günlüğü (en yeni üstte, zaman çizelgesi) ─────────────

/**
 * Oyun sürerken gizli olaylar (kahin sonucu vb.) burada GÖSTERİLMEZ, sadece gizli kartta durur.
 * Oyun bitince sunucu herkese tüm olayları açar; o zaman "gizli" etiketiyle listelenir.
 */
export function EventLog({ events, ended, skipLatest }: { events: EventView[]; ended: boolean; skipLatest?: boolean }) {
  let list = [...events].filter(e => ended || !e.isPrivate).reverse();
  if (skipLatest) list = list.slice(1);
  if (list.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{skipLatest ? "Önceki olaylar" : "Olaylar"}</CardTitle>
      </CardHeader>
      <CardContent>
        {list.map((e, i) => {
          const phase = phaseInfo[e.phase];
          const last = i === list.length - 1;
          return (
            <View key={e.id} className="flex-row gap-3">
              <View className="items-center">
                <View
                  className="mt-1.5 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: e.isPrivate ? colors.night : i === 0 ? phase.color : colors.border }}
                />
                {!last && <View className="bg-border w-px flex-1" />}
              </View>
              <View className={cn("flex-1 gap-1", !last && "pb-4")}>
                {e.isPrivate && (
                  <Badge variant="night" className="self-start">
                    <EyeOff size={11} color={colors.night} />
                    <Text>Gizli bilgi</Text>
                  </Badge>
                )}
                <Text className={cn("text-sm leading-5", i === 0 ? "font-semibold" : "text-muted-foreground")}>{e.message}</Text>
              </View>
            </View>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ───────────── Oyun sonu ─────────────

export function WinnerBanner({ game }: { game: GameView }) {
  if (game.winner === "None") {
    return (
      <Card className="items-center">
        <CardHeader className="items-center">
          <Text className="text-5xl">🏁</Text>
          <CardTitle>Oyun sonlandırıldı</CardTitle>
          <CardDescription>Herkesin rolü aşağıda açıldı.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const vampires = game.winner === "Vampires";
  const myTeamWon = vampires === (game.myRole === "Vampire");
  const color = vampires ? colors.primary : colors.success;
  return (
    <Appear kind="zoom">
      <View className="overflow-hidden rounded-3xl border-2" style={{ borderColor: color }}>
        <LinearGradient colors={[`${color}40`, `${color}08`]} style={{ padding: 28, alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 64, lineHeight: 76 }}>{vampires ? "🩸" : "🎉"}</Text>
          <Text className="text-center text-3xl font-extrabold" style={{ color }}>
            {vampires ? "Vampirler kazandı!" : "Köylüler kazandı!"}
          </Text>
          <Badge variant={myTeamWon ? "success" : "secondary"} className="mt-1 px-3 py-1">
            <Text className="text-sm">{myTeamWon ? "🏆 Takımın kazandı" : "Bu sefer olmadı"}</Text>
          </Badge>
        </LinearGradient>
      </View>
    </Appear>
  );
}
