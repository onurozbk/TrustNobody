import { LinearGradient } from "expo-linear-gradient";
import { Check, Crown, EyeOff, Hand, Skull } from "../icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Appear, DrainBar } from "../motion";
import type { ActionView, EventView, GameView, PlayerView, ReadyView, Role } from "../../api/types";
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

// ───────────── Rol kartı: varsayılan gizli, dokununca 5 sn görünür ─────────────

const REVEAL_MS = 5000;

export function RoleCard({ role, alive, secretInfo }: { role: Role; alive: boolean; secretInfo: string[] }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const info = roleInfo[role];

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const reveal = () => {
    setVisible(true);
    setRevealCount(c => c + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), REVEAL_MS);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };


  return (
    <Pressable
      role="button"
      accessibilityLabel={visible ? `Rolün: ${info.name}` : "Rolünü görmek için dokun"}
      onPress={visible ? hide : reveal}
      className="active:scale-[0.99]"
    >
      {visible ? (
        <Appear kind="zoom" duration={250}>
        <View className="overflow-hidden rounded-3xl border-2" style={{ borderColor: info.color }}>
          <LinearGradient colors={[`${info.color}33`, `${info.color}08`]} style={{ padding: 24, alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 60, lineHeight: 72 }}>{info.emoji}</Text>
            <Text variant="overline">Rolün</Text>
            <Text className="text-3xl font-extrabold" style={{ color: info.color }}>{info.name}</Text>
            <Text variant="muted" className="max-w-[300px] text-center">{info.description}</Text>
            {secretInfo.map(s => (
              <View key={s} className="bg-primary/15 border-primary/30 mt-1 rounded-xl border px-3 py-2">
                <Text className="text-primary text-center text-sm font-bold">{s}</Text>
              </View>
            ))}
            {!alive && (
              <Badge variant="destructive" className="mt-1">
                <Skull size={12} color={colors.destructive} />
                <Text>Öldün, artık sadece izleyebilirsin</Text>
              </Badge>
            )}
          </LinearGradient>
          <View className="h-1 bg-white/5">
            <DrainBar runKey={revealCount} duration={REVEAL_MS} color={info.color} />
          </View>
        </View>
        </Appear>
      ) : (
        <View className="border-border bg-card min-h-[140px] items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed p-6">
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(232,42,74,0.08)", "transparent", "rgba(154,133,249,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="bg-secondary h-14 w-14 items-center justify-center rounded-2xl">
            <EyeOff size={24} color={colors.mutedForeground} />
          </View>
          <View className="items-center gap-1">
            <Text className="font-semibold">Rolünü görmek için dokun</Text>
            <Text variant="muted" className="text-xs">5 saniye görünür. Ekranını kimse görmesin 🤫</Text>
          </View>
          {!alive && (
            <Badge variant="destructive">
              <Skull size={12} color={colors.destructive} />
              <Text>Öldün</Text>
            </Badge>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ───────────── Hamle paneli: gece aksiyonu ya da oy ─────────────

export function ActionPanel({
  action,
  players,
  busy,
  accent,
  onSubmit,
}: {
  action: ActionView;
  players: PlayerView[];
  busy: boolean;
  accent: string;
  onSubmit: (targetId: string | null) => void;
}) {
  const byId = new Map(players.map(p => [p.id, p]));
  const current = action.currentTargetId;
  const disabled = action.locked || busy;

  return (
    <Appear kind="up" duration={350}>
      <Card style={{ borderColor: `${accent}66` }}>
        <CardHeader>
          <CardTitle>{action.prompt}</CardTitle>
          {action.hasActed && !action.locked && (
            <CardDescription>
              Seçimin: <Text className="text-foreground text-sm font-semibold">{current ? byId.get(current)?.username : "Pas"}</Text>. Süre bitene kadar değiştirebilirsin.
            </CardDescription>
          )}
          {action.locked && <CardDescription>Seçimini yaptın. Sonucu olaylar bölümünde görebilirsin.</CardDescription>}
        </CardHeader>
        <CardContent className="gap-3">
          <View className="flex-row flex-wrap gap-2">
            {action.targets.map(id => {
              const p = byId.get(id);
              const selected = current === id;
              return (
                <Pressable
                  key={id}
                  role="button"
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => onSubmit(id)}
                  className={cn(
                    "min-w-[46%] flex-1 flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80",
                    "web:transition-colors web:hover:bg-accent",
                    selected ? "bg-accent" : "border-border bg-background/40",
                    action.locked && !selected && "opacity-40",
                  )}
                  style={selected ? { borderColor: accent } : undefined}
                >
                  <Avatar name={p?.username ?? "?"} size="sm" />
                  <Text className={cn("flex-1 text-[15px]", selected ? "font-bold" : "font-medium")} numberOfLines={1}>
                    {p?.username ?? "?"}{p?.isMe ? " (sen)" : ""}
                  </Text>
                  {selected && (
                    <Appear kind="zoom" duration={200}>
                      <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    </Appear>
                  )}
                </Pressable>
              );
            })}
          </View>
          {action.canSkip && (
            <Button variant="outline" disabled={busy} onPress={() => onSubmit(null)}>
              {action.hasActed && current === null && <Check size={16} color={colors.foreground} />}
              <Text>{action.hasActed && current === null ? "Pas geçtin" : "Pas geç"}</Text>
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

export function EventLog({ events }: { events: EventView[] }) {
  if (events.length === 0) return null;
  const list = [...events].reverse();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Olaylar</CardTitle>
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
                    <Text>Sadece sen görüyorsun</Text>
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
