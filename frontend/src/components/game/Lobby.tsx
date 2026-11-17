import { Check, Copy, Pencil, Play, Share2 } from "../icons";
import { useState } from "react";
import { View } from "react-native";
import { MIN_PLAYERS, type GameSettings, type GameView } from "../../api/types";
import { copyText, inviteUrl, shareInvite } from "../../lib/platform";
import { colors } from "../../theme";
import { CodeDisplay } from "../CodeInput";
import { SettingsForm, fmtSeconds } from "../SettingsForm";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Text } from "../ui/text";

/** Davet kartı: oda kodu + paylaş/kopyala. */
export function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const flash = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const share = async () => {
    if ((await shareInvite(code)) === "copied") flash();
  };
  const copy = async () => {
    await copyText(inviteUrl(code));
    flash();
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="items-center">
        <Text variant="overline">Arkadaşlarını davet et</Text>
      </CardHeader>
      <CardContent className="items-center gap-4">
        <CodeDisplay code={code} />
        <Text selectable variant="muted" className="text-center text-xs">{inviteUrl(code)}</Text>
        <View className="w-full flex-row gap-2">
          <Button className="flex-1" onPress={share}>
            <Share2 size={18} color="#fff" />
            <Text>Davet et</Text>
          </Button>
          <Button variant="outline" onPress={copy} accessibilityLabel="Linki kopyala">
            {copied ? <Check size={18} color={colors.success} /> : <Copy size={18} color={colors.foreground} />}
            <Text>{copied ? "Kopyalandı" : "Kopyala"}</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}

export function SettingsSummary({ s }: { s: GameSettings }) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Badge variant="blood"><Text>🧛 {s.vampireCount} vampir</Text></Badge>
        {s.doctorEnabled && <Badge variant="vote"><Text>🩺 Doktor</Text></Badge>}
        {s.seerEnabled && <Badge variant="night"><Text>🔮 Kahin</Text></Badge>}
        <Badge variant="outline"><Text>{s.revealRoleOnDeath ? "🪦 Roller açıklanır" : "🤐 Roller gizli"}</Text></Badge>
      </View>
      <View className="flex-row gap-2">
        {[
          { e: "🌙", l: "Gece", v: s.nightSeconds },
          { e: "☀️", l: "Tartışma", v: s.discussionSeconds },
          { e: "🗳️", l: "Oylama", v: s.votingSeconds },
        ].map(x => (
          <View key={x.l} className="bg-secondary/60 flex-1 items-center gap-0.5 rounded-xl py-2.5">
            <Text className="text-base">{x.e}</Text>
            <Text className="text-sm font-bold">{fmtSeconds(x.v)}</Text>
            <Text variant="muted" className="text-[11px]">{x.l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LobbyPanel({
  game,
  busy,
  onStart,
  onLeave,
  onSaveSettings,
}: {
  game: GameView;
  busy: boolean;
  onStart: () => void;
  onLeave: () => void;
  onSaveSettings: (s: GameSettings) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<GameSettings | null>(null);
  const count = game.players.length;
  const s = game.settings;
  const maxVampiresNow = Math.floor((count - 1) / 2);
  const startProblem =
    count < MIN_PLAYERS ? `Başlamak için en az ${MIN_PLAYERS} oyuncu gerekli.`
    : s.vampireCount > maxVampiresNow ? `${count} oyuncu için en fazla ${maxVampiresNow} vampir olabilir. Ayarları düzenle.`
    : null;

  if (editing) {
    return (
      <>
        <SettingsForm value={editing} onChange={setEditing} />
        <View className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={() => setEditing(null)}>
            <Text>Vazgeç</Text>
          </Button>
          <Button className="flex-1" loading={busy} onPress={async () => { if (await onSaveSettings(editing)) setEditing(null); }}>
            <Text>Kaydet</Text>
          </Button>
        </View>
      </>
    );
  }

  return (
    <>
      <InviteCard code={game.code} />

      {game.isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>{startProblem ? "Oyuncular bekleniyor" : "Herkes hazır mı?"}</CardTitle>
            <CardDescription>{startProblem ?? "Herkes geldiyse başlat. Roller rastgele dağıtılacak."}</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            {count < MIN_PLAYERS && (
              <View className="gap-2">
                <Progress value={(count / MIN_PLAYERS) * 100} />
                <Text variant="muted" className="text-xs">{count}/{MIN_PLAYERS} oyuncu</Text>
              </View>
            )}
            <Button size="lg" onPress={onStart} loading={busy} disabled={!!startProblem}>
              <Play size={18} color="#fff" fill="#fff" />
              <Text>Oyunu başlat</Text>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="items-center">
            <Text className="text-4xl">⏳</Text>
            <CardTitle className="text-center">Yönetici bekleniyor</CardTitle>
            <CardDescription className="text-center">Herkes gelince oyun başlayacak. Roller rastgele dağıtılır.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onPress={onLeave} disabled={busy}>
              <Text>Odadan ayrıl</Text>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Kurallar</CardTitle>
          {game.isOwner && (
            <Button variant="outline" size="sm" onPress={() => setEditing(s)}>
              <Pencil size={14} color={colors.foreground} />
              <Text>Düzenle</Text>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <SettingsSummary s={s} />
        </CardContent>
      </Card>
    </>
  );
}
