import { LinearGradient } from "expo-linear-gradient";
import { CircleAlert, Minus, Plus, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "../lib/utils";
import { colors } from "../theme";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Text } from "./ui/text";

/**
 * Sayfa iskeleti: güvenli alan + kaydırma + web'de ortalanmış dar sütun.
 * Üstte, sayfanın ruh hâline göre renk alan yumuşak bir ışık var (oyunda aşama rengi).
 */
export function Screen({ children, scroll = true, glow = colors.primary }: { children: ReactNode; scroll?: boolean; glow?: string }) {
  const content = <View className="w-full max-w-[560px] gap-5 self-center">{children}</View>;
  return (
    <View className="bg-background flex-1">
      <LinearGradient
        pointerEvents="none"
        colors={[`${glow}33`, `${glow}0d`, "transparent"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {scroll ? (
          <ScrollView contentContainerClassName="grow px-4 pb-10 pt-4" keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        ) : (
          <View className="grow px-4 pb-10 pt-4">{content}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

export function Loading() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-4">
      <Text className="text-5xl">🧛</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

/** Etiketli metin alanı (shadcn Label + Input + hata). */
export function Field({ label, error, className, ...props }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{label}</Text>
      <Input aria-invalid={!!error} className={cn(error && "border-destructive", className)} {...props} />
      {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
    </View>
  );
}

/** shadcn Alert (destructive). */
export function ErrorAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View role="alert" className="border-destructive/40 bg-destructive/10 flex-row items-start gap-3 rounded-xl border p-4">
      <CircleAlert size={18} color={colors.destructive} style={{ marginTop: 1 }} />
      <Text className="text-destructive flex-1 text-sm leading-5">{message}</Text>
    </View>
  );
}

/** Ayarlarda kullanılan satır: ikon + etiket (+ açıklama) + sağda kontrol. */
export function SettingRow({ icon, label, description, children }: { icon?: string; label: string; description?: string; children: ReactNode }) {
  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-4">
      <View className="flex-1 flex-row items-center gap-3">
        {icon ? (
          <View className="bg-secondary h-9 w-9 items-center justify-center rounded-lg">
            <Text className="text-lg">{icon}</Text>
          </View>
        ) : null}
        <View className="flex-1 gap-0.5">
          <Text className="text-[15px] font-medium">{label}</Text>
          {description ? <Text variant="muted" className="text-xs">{description}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

function StepButton({ icon: Icon, label, onPress, disabled }: { icon: LucideIcon; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      role="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      className={cn("h-9 w-9 items-center justify-center rounded-lg active:bg-accent web:hover:bg-accent", disabled && "opacity-30")}
    >
      <Icon size={16} color={colors.foreground} />
    </Pressable>
  );
}

/** − değer + seçici. */
export function Stepper({
  label, icon, description, value, onChange, min, max, step = 1, format = String,
}: {
  label: string; icon?: string; description?: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; format?: (v: number) => string;
}) {
  return (
    <SettingRow icon={icon} label={label} description={description}>
      <View className="border-border bg-background/50 flex-row items-center rounded-xl border p-0.5">
        <StepButton icon={Minus} label={`${label} azalt`} disabled={value <= min} onPress={() => onChange(Math.max(min, value - step))} />
        <Text className="min-w-[64px] text-center text-base font-bold" style={{ fontVariant: ["tabular-nums"] }}>{format(value)}</Text>
        <StepButton icon={Plus} label={`${label} artır`} disabled={value >= max} onPress={() => onChange(Math.min(max, value + step))} />
      </View>
    </SettingRow>
  );
}

export function ToggleRow({ label, icon, description, value, onChange }: { label: string; icon?: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <SettingRow icon={icon} label={label} description={description}>
      <Switch checked={value} onCheckedChange={onChange} accessibilityLabel={label} />
    </SettingRow>
  );
}

/** "ya da" ayracı. */
export function OrDivider({ label = "ya da" }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="bg-border h-px flex-1" />
      <Text variant="overline">{label}</Text>
      <View className="bg-border h-px flex-1" />
    </View>
  );
}
