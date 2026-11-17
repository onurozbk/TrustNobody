import * as Clipboard from "expo-clipboard";
import { Alert, Platform, Share } from "react-native";
import { WEB_URL } from "./config";

/** Davet linki: https://site/join/KOD */
export function inviteUrl(code: string): string {
  const origin = WEB_URL || (Platform.OS === "web" ? globalThis.location?.origin ?? "" : "");
  return `${origin}/join/${code}`;
}

/** Paylaşım menüsünü açar; desteklenmiyorsa linki panoya kopyalar. "copied" dönerse kullanıcıya bildir. */
export async function shareInvite(code: string): Promise<"shared" | "copied"> {
  const url = inviteUrl(code);
  const message = `TrustNobody'de oyuna katıl! Oda kodu: ${code}\n${url}`;

  if (Platform.OS === "web") {
    const nav = globalThis.navigator as Navigator | undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: "TrustNobody", text: message, url });
        return "shared";
      } catch {
        // kullanıcı iptal etti ya da izin yok → kopyala
      }
    }
    await Clipboard.setStringAsync(url);
    return "copied";
  }

  await Share.share({ message });
  return "shared";
}

export async function copyText(text: string) {
  await Clipboard.setStringAsync(text);
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmText: string;
  destructive: boolean;
  resolve: (ok: boolean) => void;
}

let confirmHandler: ((req: ConfirmRequest) => void) | null = null;

/** ConfirmHost (shadcn AlertDialog) kendini buraya kaydeder. */
export function setConfirmHandler(handler: ((req: ConfirmRequest) => void) | null) {
  confirmHandler = handler;
}

/**
 * Onay sorusu. Uygulama içi diyalog (ConfirmHost) varsa o kullanılır;
 * yoksa web'de window.confirm, mobilde Alert.
 */
export function confirm(title: string, message: string, confirmText = "Evet", destructive = true): Promise<boolean> {
  if (confirmHandler) {
    const show = confirmHandler;
    return new Promise(resolve => show({ title, message, confirmText, destructive, resolve }));
  }
  if (Platform.OS === "web") return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? false);
  return new Promise(resolve =>
    Alert.alert(title, message, [
      { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
