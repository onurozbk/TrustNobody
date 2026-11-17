import { View } from "react-native";
import { MIN_PLAYERS, type GameSettings } from "../api/types";
import { roleInfo } from "../theme";
import { Stepper, ToggleRow } from "./layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Text } from "./ui/text";

const fmtSeconds = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} dk${s % 60 ? ` ${s % 60} sn` : ""}` : `${s} sn`);

/** Oda dolduğunda rollerin dağılımını renkli bir çubukla gösterir. */
function RoleMix({ s }: { s: GameSettings }) {
  const doctor = s.doctorEnabled ? 1 : 0;
  const seer = s.seerEnabled ? 1 : 0;
  const villagers = Math.max(0, s.maxPlayers - s.vampireCount - doctor - seer);
  const parts = [
    { role: roleInfo.Vampire, n: s.vampireCount },
    { role: roleInfo.Doctor, n: doctor },
    { role: roleInfo.Seer, n: seer },
    { role: roleInfo.Villager, n: villagers },
  ].filter(p => p.n > 0);

  return (
    <View className="gap-3">
      <View className="h-3 flex-row gap-1 overflow-hidden rounded-full">
        {parts.map(p => (
          <View key={p.role.name} style={{ flex: p.n, backgroundColor: p.role.color }} className="rounded-full" />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        {parts.map(p => (
          <View key={p.role.name} className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: p.role.color }} />
            <Text className="text-muted-foreground text-xs">
              <Text className="text-foreground text-xs font-bold">{p.n}</Text> {p.role.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Oda ayarları formu (oda kurarken ve lobide düzenlerken). */
export function SettingsForm({ value, onChange }: { value: GameSettings; onChange: (s: GameSettings) => void }) {
  const set = <K extends keyof GameSettings>(key: K, v: GameSettings[K]) => {
    const next = { ...value, [key]: v };
    // vampir sayısı oyuncuların yarısından az olmalı
    const maxVampires = Math.max(1, Math.floor((next.maxPlayers - 1) / 2));
    if (next.vampireCount > maxVampires) next.vampireCount = maxVampires;
    onChange(next);
  };
  const maxVampires = Math.max(1, Math.min(10, Math.floor((value.maxPlayers - 1) / 2)));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Masa</CardTitle>
          <CardDescription>Oda dolarsa roller böyle dağılır. Daha az kişi gelirse sayıya göre ayarlanır.</CardDescription>
        </CardHeader>
        <CardContent className="gap-1">
          <RoleMix s={value} />
          <Separator className="my-3" />
          <Stepper icon="👥" label="En fazla oyuncu" description="Sen dahil" value={value.maxPlayers} min={MIN_PLAYERS} max={30}
            onChange={v => set("maxPlayers", v)} />
          <Stepper icon="🧛" label="Vampir" value={value.vampireCount} min={1} max={maxVampires}
            onChange={v => set("vampireCount", v)} />
          <ToggleRow icon="🩺" label="Doktor" description="Her gece birini korur" value={value.doctorEnabled} onChange={v => set("doctorEnabled", v)} />
          <ToggleRow icon="🔮" label="Kahin" description="Her gece birinin rolüne bakar" value={value.seerEnabled} onChange={v => set("seerEnabled", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Süreler</CardTitle>
          <CardDescription>Herkes erken hazır olursa aşama beklemeden geçer.</CardDescription>
        </CardHeader>
        <CardContent className="gap-1">
          <Stepper icon="🌙" label="Gece" value={value.nightSeconds} min={15} max={600} step={15}
            format={fmtSeconds} onChange={v => set("nightSeconds", v)} />
          <Stepper icon="☀️" label="Tartışma" value={value.discussionSeconds} min={30} max={3600} step={30}
            format={fmtSeconds} onChange={v => set("discussionSeconds", v)} />
          <Stepper icon="🗳️" label="Oylama" value={value.votingSeconds} min={15} max={600} step={15}
            format={fmtSeconds} onChange={v => set("votingSeconds", v)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToggleRow icon="🪦" label="Ölenlerin rolü açıklansın" description="Kapalıysa oyun sonuna kadar gizli kalır"
            value={value.revealRoleOnDeath} onChange={v => set("revealRoleOnDeath", v)} />
        </CardContent>
      </Card>
    </>
  );
}

export { fmtSeconds };
