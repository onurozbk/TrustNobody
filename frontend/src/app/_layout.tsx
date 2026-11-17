import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../auth/AuthContext";
import { ConfirmHost } from "../components/ConfirmHost";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade" }} />
        <ConfirmHost />
        <PortalHost />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
