import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { GameView } from "../../api/types";
import { cn } from "../../lib/utils";
import { colors, roleInfo } from "../../theme";
import { Check, EyeOff, Moon, Skull } from "../icons";
import { Appear, DrainBar } from "../motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { TargetGrid, useOptimisticPick } from "./TargetGrid";

/** Kart açık kalırken her dokunuşta süre baştan başlar. */
const OPEN_MS = 10000;

/**
 * Gizli kart: rol, gizli notlar (vampir arkadaşları, kahin sonuçları) ve gece hamlesi burada.
 *
 * Kural: kart kapalıyken ekran herkeste birebir aynıdır. Yandaki biri ekrana baksa rolü,
 * gece rolü olup olmadığını ya da kimi seçtiğini anlayamaz. Bu yüzden gece köylüler de kartı açıp
 * bir isim seçer ("şüphelendiğin kişi", oyunu etkilemez); dışarıdan herkes aynı şeyi yapıyor görünür.
 * Aşama değişince kart kapanır (üst bileşen key ile yeniden oluşturur).
 */
export function SecretCard({ game, onAct }: { game: GameView; onAct: (targetId: string | null) => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const info = roleInfo[game.myRole];
  const night = game.phase === "Night";

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const keepOpen = () => {
    setBump(b => b + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), OPEN_MS);
  };
  const show = () => {
    setOpen(true);
    keepOpen();
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };

  if (!open) {
    return (
      <Pressable role="button" accessibilityLabel="Gizli kartını aç" onPress={show} className="active:scale-[0.99] web:transition-transform">
        <View
          className={cn(
            "bg-card min-h-[150px] items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed p-6",
            night && game.myAlive ? "border-night/60" : "border-border",
          )}
        >
          <LinearGradient
            pointerEvents="none"
            colors={night ? ["rgba(154,133,249,0.16)", "transparent"] : ["rgba(232,42,74,0.08)", "transparent", "rgba(154,133,249,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className={cn("h-14 w-14 items-center justify-center rounded-2xl", night && game.myAlive ? "bg-night/20" : "bg-secondary")}>
            {night && game.myAlive ? <Moon size={24} color={colors.night} /> : <EyeOff size={24} color={colors.mutedForeground} />}
          </View>
          <View className="items-center gap-1">
            <Text className="text-center text-base font-bold">
              {night && game.myAlive ? "Kartını aç, gece seçimini yap" : "Gizli kartın"}
            </Text>
            <Text variant="muted" className="text-center text-xs">
              Rolün ve gizli notların burada. Açınca 10 sn görünür, ekranını kimse görmesin 🤫
            </Text>
          </View>
          {!game.myAlive && (
            <Badge variant="destructive">
              <Skull size={12} color={colors.destructive} />
              <Text>Öldün, izliyorsun</Text>
            </Badge>
          )}
        </View>
      </Pressable>
    );
  }

  const notes = [...game.events].filter(e => e.isPrivate).reverse();

  return (
    <Appear kind="zoom" duration={220}>
      {/* İçerideki her dokunuş süreyi uzatır */}
      <View
        onStartShouldSetResponderCapture={() => {
          keepOpen();
          return false;
        }}
        className="overflow-hidden rounded-3xl border-2"
        style={{ borderColor: info.color }}
      >
        <LinearGradient colors={[`${info.color}2e`, `${info.color}06`]} style={{ padding: 20, gap: 16 }}>
          {/* Rol */}
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${info.color}26` }}>
              <Text style={{ fontSize: 38, lineHeight: 46 }}>{info.emoji}</Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="overline">Rolün</Text>
              <Text className="text-2xl font-extrabold" style={{ color: info.color }}>{info.name}</Text>
              <Text variant="muted" className="text-xs leading-4">{info.description}</Text>
            </View>
          </View>

          {game.secretInfo.map(s => (
            <View key={s} className="bg-primary/15 border-primary/30 rounded-xl border px-3 py-2">
              <Text className="text-primary text-sm font-bold">{s}</Text>
            </View>
          ))}

          {night && game.myAlive && <NightMove game={game} onAct={onAct} />}

          {!game.myAlive && (
            <Badge variant="destructive" className="self-start">
              <Skull size={12} color={colors.destructive} />
              <Text>Öldün, artık sadece izleyebilirsin</Text>
            </Badge>
          )}

          {notes.length > 0 && (
            <View className="gap-2">
              <Text variant="overline">Gizli notların</Text>
              {notes.map(n => (
                <View key={n.id} className="bg-night/10 border-night/25 rounded-xl border px-3 py-2">
                  <Text className="text-sm leading-5">{n.message}</Text>
                  <Text variant="muted" className="text-[11px]">{n.round}. tur</Text>
                </View>
              ))}
            </View>
          )}

          <Button variant="outline" size="sm" className="self-center" onPress={hide}>
            <EyeOff size={14} color={colors.foreground} />
            <Text>Kartı kapat</Text>
          </Button>
        </LinearGradient>
        <View className="h-1 bg-white/5">
          <DrainBar runKey={bump} duration={OPEN_MS} color={info.color} />
        </View>
      </View>
    </Appear>
  );
}

/** Gecenin hamlesi: rolü olanlar için gerçek seçim, köylüler için oyunu etkilemeyen "şüphe" seçimi. */
function NightMove({ game, onAct }: { game: GameView; onAct: (targetId: string | null) => Promise<unknown> }) {
  const action = game.action && game.action.type !== "Vote" ? game.action : null;
  const real = useOptimisticPick(action?.currentTargetId ?? null, onAct);
  const [suspect, setSuspect] = useState<string | null>(null);
  const byId = new Map(game.players.map(p => [p.id, p]));

  if (!action) {
    const others = game.players.filter(p => p.isAlive && !p.isMe).map(p => p.id);
    return (
      <View className="gap-3">
        <View className="gap-1">
          <Text className="text-base font-bold">Bu gece kimden şüpheleniyorsun?</Text>
          <Text variant="muted" className="text-xs leading-4">
            Gece özel bir görevin yok. Bu seçim oyunu etkilemez, sadece sana not olur; herkes bir şey seçtiği için kimse rolünü anlamaz.
          </Text>
        </View>
        <TargetGrid targets={others} players={game.players} selected={suspect} accent={colors.night} onPick={setSuspect} />
      </View>
    );
  }

  const chosen = real.selected;
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-base font-bold">{action.prompt}</Text>
        {action.locked ? (
          <Text variant="muted" className="text-xs">Seçimini yaptın. Sonuç aşağıda gizli notlarına düşer.</Text>
        ) : action.hasActed || real.pending ? (
          <Text variant="muted" className="text-xs">
            Seçimin: <Text className="text-foreground text-xs font-bold">{chosen ? byId.get(chosen)?.username : "Pas"}</Text>. Süre bitene kadar değiştirebilirsin.
          </Text>
        ) : null}
      </View>
      <TargetGrid
        targets={action.targets}
        players={game.players}
        selected={chosen}
        locked={action.locked}
        disabled={real.pending}
        accent={colors.night}
        onPick={id => void real.pick(id)}
      />
      {action.canSkip && !action.locked && (
        <Button variant="outline" size="sm" disabled={real.pending} onPress={() => void real.pick(null)}>
          {action.hasActed && chosen === null && <Check size={14} color={colors.foreground} />}
          <Text>{action.hasActed && chosen === null ? "Pas geçtin" : "Pas geç"}</Text>
        </Button>
      )}
    </View>
  );
}
