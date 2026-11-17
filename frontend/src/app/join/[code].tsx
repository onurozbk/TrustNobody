import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { errorMessage } from "../../api/client";
import { gamesApi } from "../../api/endpoints";
import { useAuth } from "../../auth/AuthContext";
import { Brand } from "../../components/Brand";
import { CodeDisplay } from "../../components/CodeInput";
import { GuestForm } from "../../components/GuestForm";
import { ErrorAlert, Loading, Screen } from "../../components/layout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Text } from "../../components/ui/text";

/**
 * Davet linki: /join/KOD.
 * Oturum varsa doğrudan katılır. Yoksa kayıt zorunlu değil: takma adla misafir olarak katılabilir
 * ya da giriş/kayıt yapabilir (o durumda kod saklanır ve girişten sonra buraya dönülür).
 */
export default function JoinScreen() {
  const { code: rawCode } = useLocalSearchParams<{ code: string }>();
  const code = (rawCode ?? "").toUpperCase();
  const { user, ready, setPendingInvite } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user || !code) return;
    gamesApi
      .join(code)
      .then(() => router.replace(`/game/${code}`))
      .catch(e => setError(errorMessage(e)));
  }, [ready, user, code]);

  if (!ready) return <Loading />;

  if (!user) {
    const goAuth = () => void setPendingInvite(code);
    return (
      <Screen>
        <Brand compact />
        <View className="items-center gap-3">
          <Text variant="overline">Seni bu odaya davet ettiler</Text>
          <CodeDisplay code={code} />
        </View>
        <GuestForm
          highlight
          title="Hemen katıl"
          description="Kayıt olmana gerek yok. Masadakilerin seni tanıyacağı bir ad yaz, yeter."
          submitLabel="Odaya katıl"
          onDone={() => {}} // oturum açılınca yukarıdaki effect odaya katılır
        />
        <Text variant="muted" className="text-center">
          Hesabın var mı?{" "}
          <Link href="/login" onPress={goAuth} className="text-primary font-semibold">Giriş yap</Link>
          {"  ·  "}
          <Link href="/register" onPress={goAuth} className="text-primary font-semibold">Kayıt ol</Link>
        </Text>
      </Screen>
    );
  }

  if (!error) return <Loading />;

  return (
    <Screen>
      <Card className="mt-10">
        <CardHeader className="items-center">
          <Text className="text-5xl">🚪</Text>
          <CardTitle className="text-center">Odaya katılamadın</CardTitle>
          <CardDescription className="text-center">Oda kodu: {code}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <ErrorAlert message={error} />
          <Button variant="secondary" onPress={() => router.replace("/home")}>
            <Text>Ana sayfaya dön</Text>
          </Button>
        </CardContent>
      </Card>
    </Screen>
  );
}
