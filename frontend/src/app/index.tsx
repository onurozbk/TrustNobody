import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { Loading } from "../components/layout";

export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  return <Redirect href={user ? "/home" : "/login"} />;
}
