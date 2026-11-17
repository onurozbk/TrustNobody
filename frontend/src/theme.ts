import { Flag, Home, Moon, Sun, Vote, type LucideIcon } from "lucide-react-native";
import type { GamePhase, Role } from "./api/types";
import type { BadgeVariant } from "./components/ui/badge";

/**
 * src/global.css içindeki shadcn token'larının hex karşılıkları.
 * Sınıf kullanılamayan yerler için (ikon rengi, gradyan, dinamik renk).
 */
export const colors = {
  background: "#0b080d",
  card: "#120f15",
  foreground: "#f3eff6",
  mutedForeground: "#9e95a6",
  border: "#29232e",
  primary: "#e82a4a",
  destructive: "#e44646",
  night: "#9a85f9",
  day: "#f6be4a",
  vote: "#45b8e0",
  success: "#2ec67c",
} as const;

const AVATAR_PALETTE = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185", "#22d3ee", "#c084fc", "#f97316", "#4ade80"];

/** Kullanıcı adına göre her cihazda aynı avatar rengi. */
export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export const roleInfo: Record<Role, { name: string; emoji: string; color: string; badge: BadgeVariant; description: string }> = {
  None: { name: "-", emoji: "❔", color: colors.mutedForeground, badge: "outline", description: "" },
  Villager: { name: "Köylü", emoji: "🧑‍🌾", color: colors.success, badge: "success", description: "Gündüz tartış, vampirleri bul ve oylamayla as." },
  Vampire: { name: "Vampir", emoji: "🧛", color: colors.primary, badge: "blood", description: "Her gece bir kurban seç. Gündüz masum görün." },
  Doctor: { name: "Doktor", emoji: "🩺", color: colors.vote, badge: "vote", description: "Her gece birini (kendin dahil) vampirlerden koru." },
  Seer: { name: "Kahin", emoji: "🔮", color: colors.night, badge: "night", description: "Her gece bir oyuncunun vampir olup olmadığını öğren." },
};

export const phaseInfo: Record<GamePhase, { label: string; emoji: string; color: string; badge: BadgeVariant; icon: LucideIcon; hint: string }> = {
  Lobby: { label: "Lobi", emoji: "🏠", color: colors.mutedForeground, badge: "outline", icon: Home, hint: "Oyuncular toplanıyor" },
  Night: { label: "Gece", emoji: "🌙", color: colors.night, badge: "night", icon: Moon, hint: "Herkes gözlerini kapatsın. Rolü olanlar telefonundan seçim yapsın." },
  Day: { label: "Gündüz", emoji: "☀️", color: colors.day, badge: "day", icon: Sun, hint: "Yüz yüze tartışın. Kim yalan söylüyor?" },
  Voting: { label: "Oylama", emoji: "🗳️", color: colors.vote, badge: "vote", icon: Vote, hint: "Asılmasını istediğin kişiye oy ver ya da pas geç." },
  Ended: { label: "Bitti", emoji: "🏁", color: colors.mutedForeground, badge: "outline", icon: Flag, hint: "Oyun sona erdi" },
};
