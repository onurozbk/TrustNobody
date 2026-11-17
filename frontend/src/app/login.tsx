import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { errorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";
import { GuestForm } from "../components/GuestForm";
import { ErrorAlert, Field, Loading, OrDivider, Screen } from "../components/layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Text } from "../components/ui/text";

export default function LoginScreen() {
  const { user, ready, login, takePendingInvite } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <Loading />;
  if (user && !busy) return <Redirect href="/home" />;

  const afterAuth = async () => {
    const invite = await takePendingInvite();
    router.replace(invite ? `/join/${invite}` : "/home");
  };

  const submit = async () => {
    if (!form.login.trim() || !form.password) return setError("Tüm alanları doldur.");
    setBusy(true);
    setError(null);
    try {
      await login(form.login, form.password);
      await afterAuth();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Brand />
      <GuestForm
        highlight
        title="Hemen oyna"
        description="Sadece bir takma ad yeter. Oda kurabilir ya da arkadaşının odasına katılabilirsin."
        submitLabel="Misafir olarak devam et"
        onBusyChange={setBusy}
        onDone={afterAuth}
      />
      <OrDivider label="hesabın var mı?" />
      <Card>
        <CardHeader>
          <CardTitle>Giriş yap</CardTitle>
          <CardDescription>Oyunların her cihazda seninle gelsin.</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Field label="E-posta veya kullanıcı adı" autoCapitalize="none" autoCorrect={false} autoComplete="username"
            value={form.login} onChangeText={v => setForm(f => ({ ...f, login: v }))} />
          <Field label="Şifre" secureTextEntry autoComplete="current-password" value={form.password}
            onChangeText={v => setForm(f => ({ ...f, password: v }))} onSubmitEditing={submit} returnKeyType="go" />
          <ErrorAlert message={error} />
          <Button variant="secondary" onPress={submit} loading={busy}>
            <Text>Giriş yap</Text>
          </Button>
        </CardContent>
      </Card>
      <Text variant="muted" className="text-center">
        Hesabın yok mu?{" "}
        <Link href="/register" replace className="text-primary font-semibold">Kayıt ol</Link>
      </Text>
    </Screen>
  );
}
