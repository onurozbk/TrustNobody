/**
 * Web sürümü: animasyonlar CSS ile (tailwindcss-animate). Reanimated web paketine hiç girmez (~700 KB tasarruf).
 * Mobil sürümü motion.native.tsx'te (Reanimated). İki dosyanın dışa açtığı API aynı olmalı.
 */
import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import { cn } from "../lib/utils";

export type AppearKind = "fade" | "up" | "zoom";

const KIND: Record<AppearKind, string> = {
  fade: "animate-in fade-in",
  up: "animate-in fade-in slide-in-from-bottom-3",
  zoom: "animate-in fade-in zoom-in-90",
};

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
    <View
      className={cn(KIND[kind], "fill-mode-both")}
      style={[{ animationDuration: `${duration}ms`, animationDelay: `${delay}ms` } as ViewStyle, style]}
    >
      {children}
    </View>
  );
}

/** Diyalog katmanları: web'de animasyonu diyalog bileşeninin kendi CSS sınıfları yapar. */
export function DialogMotion({ children }: { children: ReactNode; kind: "overlay" | "content" }) {
  return <>{children}</>;
}

/** `runKey` her değiştiğinde %100'den %0'a `duration` sürede eriyen çubuk. */
export function DrainBar({ runKey, duration, color }: { runKey: number; duration: number; color: string }) {
  // key değişince eleman yeniden oluşur ve CSS animasyonu baştan başlar
  return (
    <View
      key={runKey}
      style={
        {
          height: "100%",
          backgroundColor: color,
          animationKeyframes: [{ from: { width: "100%" }, to: { width: "0%" } }],
          animationDuration: `${duration}ms`,
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
        } as ViewStyle
      }
    />
  );
}
