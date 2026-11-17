import { ArrowRight } from "./icons";
import { useState } from "react";
import { errorMessage } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorAlert, Field } from "./layout";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Text } from "./ui/text";

const GUEST_NAME_RE = /^[\p{L}\p{N}_ .-]{2,20}$/u;

/** Kayıt olmadan takma adla devam etme formu. Başarılı olunca onDone çağrılır. */
export function GuestForm({
  title,
  description,
  submitLabel,
  onDone,
  onBusyChange,
  highlight,
}: {
  title: string;
  description: string;
  submitLabel: string;
  onDone: () => void | Promise<void>;
  /** Üst ekran, oturum açılırken kendi yönlendirmesini bekletebilsin diye. */
  onBusyChange?: (busy: boolean) => void;
  /** Sayfadaki ana eylemse vurgulu çerçeve. */
  highlight?: boolean;
}) {
  const { continueAsGuest } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim().replace(/\s+/g, " ");
  const nameError = name && !GUEST_NAME_RE.test(trimmed) ? "2-20 karakter: harf, rakam, boşluk" : null;

  const submit = async () => {
    if (!trimmed) return setError("Masadakilerin seni tanıyacağı bir ad yaz.");
    if (nameError) return setError(nameError);
    setBusy(true);
    onBusyChange?.(true);
    setError(null);
    try {
      await continueAsGuest(trimmed);
      await onDone();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return (
    <Card className={highlight ? "border-primary/40 shadow-xl shadow-primary/10" : undefined}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <Field label="Takma adın" placeholder="ör. Ayşe" autoCorrect={false} autoComplete="nickname" maxLength={20}
          error={nameError} value={name} onChangeText={setName} onSubmitEditing={submit} returnKeyType="go" />
        <ErrorAlert message={error} />
        <Button onPress={submit} loading={busy}>
          <Text>{submitLabel}</Text>
          <ArrowRight size={18} color="#fff" />
        </Button>
      </CardContent>
    </Card>
  );
}
