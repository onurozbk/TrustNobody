import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../auth/AuthContext";
import { Loading } from "../../components/layout";
import { colors } from "../../theme";

/** Giriş gerektiren ekranlar. */
export default function AppLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "fade" }} />;
}
