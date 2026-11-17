import { useRef, useState, type ComponentRef } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import { cn } from "../lib/utils";
import { Text } from "./ui/text";

const LENGTH = 6;

function Box({ char, active, size = "md" }: { char?: string; active?: boolean; size?: "md" | "lg" }) {
  return (
    <View
      className={cn(
        "bg-input/40 flex-1 items-center justify-center rounded-xl border",
        size === "lg" ? "h-16 max-w-[56px]" : "h-14 max-w-[52px]",
        active ? "border-primary bg-primary/10" : char ? "border-foreground/20" : "border-input",
      )}
    >
      <Text className={cn("font-extrabold", size === "lg" ? "text-3xl" : "text-2xl")}>{char ?? ""}</Text>
    </View>
  );
}

/** 6 kutulu oda kodu girişi (shadcn input-otp benzeri). */
export function CodeInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const chars = value.split("");

  return (
    <Pressable onPress={() => ref.current?.focus()} className="relative" accessibilityLabel="Oda kodu">
      <View className="flex-row justify-center gap-2">
        {Array.from({ length: LENGTH }, (_, i) => (
          <Box key={i} char={chars[i]} active={focused && (i === Math.min(value.length, LENGTH - 1))} />
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={v => onChange(v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        maxLength={LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="go"
        caretHidden
        aria-label="Oda kodu"
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, color: "transparent", opacity: 0.011 },
          Platform.OS === "web" ? ({ outlineStyle: "none", caretColor: "transparent" } as object) : null,
        ]}
      />
    </Pressable>
  );
}

/** Oda kodunu kutucuklar hâlinde gösterir (seçilebilir değil, sadece görüntü). */
export function CodeDisplay({ code }: { code: string }) {
  return (
    <View className="w-full flex-row justify-center gap-2" accessibilityLabel={`Oda kodu ${code.split("").join(" ")}`}>
      {code.split("").slice(0, LENGTH).map((c, i) => (
        <Box key={i} char={c} size="lg" />
      ))}
    </View>
  );
}
