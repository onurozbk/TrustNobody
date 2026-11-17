import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Text } from "./ui/text";

const FEATURES = ["🎭 Anlatıcı yok", "👥 4-30 oyuncu", "⚡ Kayıt şart değil"];

/** Giriş ekranlarının üstündeki logo + slogan. */
export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.duration(500)}>
      <View className="items-center gap-4 pt-6">
      <View className="rounded-[28px] shadow-2xl shadow-primary/60" style={{ transform: [{ rotate: "-6deg" }] }}>
        <LinearGradient
          colors={["#ff4d6d", "#b5132f", "#4a0716"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ width: compact ? 72 : 92, height: compact ? 72 : 92, borderRadius: 28, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: compact ? 38 : 50, lineHeight: compact ? 46 : 60, transform: [{ rotate: "6deg" }] }}>🧛</Text>
        </LinearGradient>
      </View>
      <View className="items-center gap-2">
        <Text variant="h1" className="text-center text-[40px]">
          Trust<Text className="text-primary text-[40px] font-extrabold tracking-tight">Nobody</Text>
        </Text>
        <Text variant="lead" className="max-w-[340px] text-center text-base">
          Arkadaşlarınla aynı masada vampir-köylü. Rolleri dağıtmak, geceyi yönetmek, oyları saymak uygulamanın işi.
        </Text>
      </View>
      {!compact && (
        <View className="flex-row flex-wrap justify-center gap-2">
          {FEATURES.map(f => (
            <View key={f} className="border-border bg-card/60 rounded-full border px-3 py-1.5">
              <Text className="text-muted-foreground text-xs font-medium">{f}</Text>
            </View>
          ))}
        </View>
      )}
      </View>
    </Animated.View>
  );
}
