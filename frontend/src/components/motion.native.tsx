/**
 * Mobil sürümü: animasyonlar Reanimated ile. Web sürümü motion.tsx'te (CSS).
 * İki dosyanın dışa açtığı API aynı olmalı.
 */
import { useEffect, type ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withTiming, ZoomIn } from "react-native-reanimated";

export type AppearKind = "fade" | "up" | "zoom";

const ENTER = { fade: FadeIn, up: FadeInDown, zoom: ZoomIn } as const;

/** İlk görünüşte yumuşak giriş animasyonu. */
export function Appear({
  children,
  kind = "fade",
  duration = 400,
  delay = 0,
  style,
}: {
  children: ReactNode;
  kind?: AppearKind;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}) {
  return (
    <Animated.View entering={ENTER[kind].duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Diyalog katmanları için giriş/çıkış animasyonu. */
export function DialogMotion({ children, kind }: { children: ReactNode; kind: "overlay" | "content" }) {
  return kind === "overlay" ? (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)}>{children}</Animated.View>
  ) : (
    <Animated.View entering={ZoomIn.duration(200)}>{children}</Animated.View>
  );
}

/** `runKey` her değiştiğinde %100'den %0'a `duration` sürede eriyen çubuk. */
export function DrainBar({ runKey, duration, color }: { runKey: number; duration: number; color: string }) {
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = 1;
    progress.value = withTiming(0, { duration, easing: Easing.linear });
  }, [runKey, duration, progress]);

  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return <Animated.View style={[{ height: "100%", backgroundColor: color }, style]} />;
}
