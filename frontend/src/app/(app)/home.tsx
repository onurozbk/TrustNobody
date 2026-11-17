import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { ArrowRight, ChevronRight, LogOut, Plus, Users } from "../../components/icons";
import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { Appear } from "../../components/motion";
import { errorMessage } from "../../api/client";
import { gamesApi } from "../../api/endpoints";
import type { MyGame } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { CodeInput } from "../../components/CodeInput";
import { ErrorAlert, Screen } from "../../components/layout";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Text } from "../../components/ui/text";
import { confirm } from "../../lib/platform";
import { colors, phaseInfo } from "../../theme";

function GameRow({ g }: { g: MyGame }) {
  const phase = phaseInfo[g.phase];
  const Icon = phase.icon;
  return (
    <Pressable
      onPress={() => router.push(`/game/${g.code}`)}
      className="bg-card border-border flex-row items-center gap-4 rounded-2xl border p-4 active:opacity-80 web:hover:border-foreground/20 web:transition-colors"
    >
      <View className="h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${phase.color}1f` }}>
        <Icon size={22} color={phase.color} />
      </View>
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-lg font-extrabold tracking-[3px]">{g.code}</Text>
          <Badge variant={phase.badge}>
            <Text>{phase.label}{g.round ? ` · ${g.round}. tur` : ""}</Text>
          </Badge>
        </View>
        <Text variant="muted" className="text-xs">
          {g.isOwner ? "Yöneticisi sensin" : `Yönetici: ${g.ownerUsername}`} · {g.playerCount}/{g.maxPlayers} oyuncu
        </Text>
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [games, setGames] = useState<MyGame[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      gamesApi.mine().then(setGames).catch(e => setError(errorMessage(e)));
    }, []),
  );

  const join = async () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return setError("Oda kodu 6 karakter olmalı.");
    setJoining(true);
    setError(null);
    try {
      await gamesApi.join(c);
      router.push(`/game/${c}`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setJoining(false);
    }
  };

  const signOut = async () => {
    if (!user?.isGuest || await confirm("Çıkış yap", "Misafir hesabına tekrar giremezsin. Devam eden oyunlarına da dönemezsin.", "Çıkış yap"))
      await logout();
  };

  return (
    <Screen>
      {/* Üst bar */}
      <View className="flex-row items-center gap-3">
        <Avatar name={user?.username ?? "?"} />
        <View className="flex-1">
          <Text variant="muted" className="text-xs">Tekrar hoş geldin</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold" numberOfLines={1}>{user?.username}</Text>
            {user?.isGuest && <Badge variant="secondary"><Text>misafir</Text></Badge>}
          </View>
        </View>
        <Button variant="ghost" size="icon" onPress={signOut} accessibilityLabel="Çıkış yap">
          <LogOut size={20} color={colors.mutedForeground} />
        </Button>
      </View>

      {/* Oda kur: öne çıkan kart */}
      <Appear kind="up">
        <Pressable onPress={() => router.push("/create")} className="active:opacity-90" role="button">
          <LinearGradient
            colors={["#e82a4a", "#9d1530", "#3d0815"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 22, overflow: "hidden" }}
          >
            <Text style={{ position: "absolute", right: -18, bottom: -30, fontSize: 140, lineHeight: 160, opacity: 0.18 }}>🧛</Text>
            <View className="gap-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Plus size={22} color="#fff" />
              </View>
              <View className="gap-1">
                <Text className="text-2xl font-extrabold text-white">Yeni oda kur</Text>
                <Text className="max-w-[260px] text-sm leading-5 text-white/75">
                  Kuralları sen belirle, davet linkini gönder. Sen de oynuyorsun, rolün sana da sürpriz.
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-white">Başla</Text>
                <ArrowRight size={16} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Appear>

      {/* Koda katıl */}
      <Appear kind="up" delay={80}>
        <Card>
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <Users size={18} color={colors.foreground} />
              <CardTitle>Odaya katıl</CardTitle>
            </View>
            <CardDescription>Arkadaşının paylaştığı 6 haneli kodu gir.</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <CodeInput value={code} onChange={setCode} onSubmit={join} />
            <Button variant="secondary" onPress={join} loading={joining} disabled={code.length !== 6}>
              <Text>Katıl</Text>
            </Button>
          </CardContent>
        </Card>
      </Appear>

      <ErrorAlert message={error} />

      {games && games.length > 0 && (
        <Appear kind="up" delay={160} style={{ gap: 12 }}>
          <Text variant="overline" className="px-1">Devam eden oyunların</Text>
          {games.map(g => <GameRow key={g.code} g={g} />)}
        </Appear>
      )}
    </Screen>
  );
}
