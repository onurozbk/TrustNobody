import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { errorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Brand } from "../components/Brand";
import { ErrorAlert, Field, Loading, Screen } from "../components/layout";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Text } from "../components/ui/text";

const USERNAME_RE = /^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]{3,20}$/;

export default function RegisterScreen() {
  const { user, ready, register, takePendingInvite } = useAuth();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <Loading />;
  if (user && !busy) return <Redirect href="/home" />;

  const usernameError = form.username && !USERNAME_RE.test(form.username.trim())
    ? "3-20 karakter: harf, rakam ve _" : null;
  const passwordError = form.password && form.password.length < 6 ? "En az 6 karakter" : null;

  const submit = async () => {
    if (!form.email.trim() || !form.username.trim() || !form.password) return setError("Tüm alanları doldur.");
    if (usernameError || passwordError) return setError("Lütfen hatalı alanları düzelt.");
    setBusy(true);
    setError(null);
    try {
      await register(form.email, form.username, form.password);
      const invite = await takePendingInvite();
      router.replace(invite ? `/join/${invite}` : "/home");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Brand compact />
      <Card>
        <CardHeader>
          <CardTitle>Hesap oluştur</CardTitle>
          <CardDescription>Kayıt olmak zorunlu değil, ama oyunların hangi cihazdan girersen gir seninle olur.</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <Field label="E-posta" keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="sen@ornek.com"
            value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} />
          <Field label="Kullanıcı adı" autoCapitalize="none" autoCorrect={false} autoComplete="username-new"
            error={usernameError} value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} />
          <Field label="Şifre" secureTextEntry autoComplete="new-password" error={passwordError} placeholder="En az 6 karakter"
            value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} onSubmitEditing={submit} returnKeyType="go" />
          <ErrorAlert message={error} />
          <Button onPress={submit} loading={busy}>
            <Text>Kayıt ol</Text>
          </Button>
        </CardContent>
      </Card>
      <Text variant="muted" className="text-center">
        Zaten hesabın var mı?{" "}
        <Link href="/login" replace className="text-primary font-semibold">Giriş yap</Link>
      </Text>
    </Screen>
  );
}
