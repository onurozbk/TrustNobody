import { View } from "react-native";
import { cn } from "../../lib/utils";
import { avatarColor, colors } from "../../theme";
import { Text } from "./text";

const SIZES = { sm: "h-8 w-8", md: "h-11 w-11", lg: "h-14 w-14" } as const;
const TEXT = { sm: "text-xs", md: "text-sm", lg: "text-lg" } as const;

function initials(name: string) {
  const parts = name.replace(/\(\d+\)/, "").trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2);
  return letters.toLocaleUpperCase("tr-TR");
}

/** Kullanıcı adının baş harfleri; renk ada göre sabit. */
function Avatar({ name, size = "md", className, dimmed }: { name: string; size?: keyof typeof SIZES; className?: string; dimmed?: boolean }) {
  const color = dimmed ? colors.mutedForeground : avatarColor(name);
  return (
    <View
      aria-hidden
      className={cn("items-center justify-center rounded-full border", SIZES[size], className)}
      style={{ backgroundColor: `${color}${dimmed ? "14" : "24"}`, borderColor: `${color}${dimmed ? "22" : "60"}` }}
    >
      <Text className={cn("font-bold", TEXT[size])} style={{ color }}>
        {initials(name)}
      </Text>
    </View>
  );
}

export { Avatar };
