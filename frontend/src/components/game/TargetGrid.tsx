import { useState } from "react";
import { Pressable, View } from "react-native";
import type { PlayerView } from "../../api/types";
import { cn } from "../../lib/utils";
import { Check } from "../icons";
import { Appear } from "../motion";
import { Avatar } from "../ui/avatar";
import { Text } from "../ui/text";

/**
 * Seçimi sunucu cevabını beklemeden hemen işaretler (iyimser güncelleme).
 * İstek bitince sunucudan gelen değer geçerli olur.
 */
export function useOptimisticPick(current: string | null, submit: (id: string | null) => Promise<unknown>) {
  const [pending, setPending] = useState<{ id: string | null } | null>(null);
  const pick = async (id: string | null) => {
    setPending({ id });
    try {
      await submit(id);
    } finally {
      setPending(null);
    }
  };
  return { selected: pending ? pending.id : current, pending: pending !== null, pick };
}

/** Oyuncu seçme ızgarası (gece hamlesi, oylama). */
export function TargetGrid({
  targets,
  players,
  selected,
  locked,
  disabled,
  accent,
  onPick,
}: {
  targets: string[];
  players: PlayerView[];
  selected: string | null;
  locked?: boolean;
  disabled?: boolean;
  accent: string;
  onPick: (id: string) => void;
}) {
  const byId = new Map(players.map(p => [p.id, p]));
  return (
    <View className="flex-row flex-wrap gap-2">
      {targets.map(id => {
        const p = byId.get(id);
        const isSelected = selected === id;
        return (
          <Pressable
            key={id}
            role="button"
            accessibilityState={{ selected: isSelected, disabled: locked || disabled }}
            disabled={locked || disabled}
            onPress={() => onPick(id)}
            className={cn(
              "min-w-[46%] flex-1 flex-row items-center gap-3 rounded-2xl border p-3 active:scale-[0.98] active:opacity-80",
              "web:transition-all web:hover:bg-accent",
              isSelected ? "bg-accent" : "border-border bg-background/40",
              locked && !isSelected && "opacity-40",
            )}
            style={isSelected ? { borderColor: accent, backgroundColor: `${accent}1f` } : undefined}
          >
            <Avatar name={p?.username ?? "?"} size="sm" />
            <Text className={cn("flex-1 text-[15px]", isSelected ? "font-bold" : "font-medium")} numberOfLines={1}>
              {p?.username ?? "?"}{p?.isMe ? " (sen)" : ""}
            </Text>
            {isSelected && (
              <Appear kind="zoom" duration={180}>
                <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: accent }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              </Appear>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
