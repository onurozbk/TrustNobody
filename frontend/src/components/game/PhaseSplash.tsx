import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";
import type { GameView } from "../../api/types";
import { colors, phaseInfo } from "../../theme";
import { Appear } from "../motion";
import { Text } from "../ui/text";

/** Aşama değişince birkaç saniye görünen tam ekran geçiş. Dokununca kapanır. */
export function PhaseSplash({ game, onClose }: { game: GameView; onClose: () => void }) {
  const phase = phaseInfo[game.phase];
  const Icon = phase.icon;
  const latest = [...game.events].reverse().find(e => !e.isPrivate);

  let title: string = phase.label;
  let subtitle = phase.hint;
  if (game.phase === "Night") title = `${game.round}. gece`;
  if (game.phase === "Day") subtitle = latest?.message ?? phase.hint;
  if (game.phase === "Voting") subtitle = "Kimin asılacağına karar verin. Pas da geçebilirsiniz.";
  if (game.phase === "Ended") {
    title = game.winner === "Vampires" ? "Vampirler kazandı" : game.winner === "Villagers" ? "Köylüler kazandı" : "Oyun bitti";
    subtitle = "Herkesin rolü açıldı.";
  }
  const color = game.phase === "Ended" ? (game.winner === "Vampires" ? colors.primary : colors.success) : phase.color;

  return (
    <Pressable
      onPress={onClose}
      accessibilityLabel="Geçişi kapat"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
    >
      <Appear duration={300} style={{ flex: 1 }}>
        <View className="bg-background flex-1 items-center justify-center px-8">
          <LinearGradient
            pointerEvents="none"
            colors={[`${color}40`, `${color}10`, colors.background]}
            locations={[0, 0.5, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Appear kind="zoom" duration={500} delay={80}>
            <View className="items-center gap-5">
              <View className="h-28 w-28 items-center justify-center rounded-full border-2" style={{ backgroundColor: `${color}26`, borderColor: `${color}80` }}>
                <Icon size={52} color={color} />
              </View>
              <Text className="text-center text-5xl font-extrabold" style={{ color, lineHeight: 56 }}>{title}</Text>
            </View>
          </Appear>
          <Appear kind="up" duration={500} delay={350}>
            <Text className="text-foreground/90 mt-4 max-w-[340px] text-center text-lg leading-7">{subtitle}</Text>
          </Appear>
          <Appear duration={400} delay={900}>
            <Text variant="muted" className="mt-10 text-xs">Devam etmek için dokun</Text>
          </Appear>
        </View>
      </Appear>
    </Pressable>
  );
}
