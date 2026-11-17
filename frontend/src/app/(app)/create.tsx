import { router } from "expo-router";
import { ArrowLeft, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { errorMessage } from "../../api/client";
import { gamesApi } from "../../api/endpoints";
import { DEFAULT_SETTINGS, type GameSettings } from "../../api/types";
import { ErrorAlert, Screen } from "../../components/layout";
import { SettingsForm } from "../../components/SettingsForm";
import { Button } from "../../components/ui/button";
import { Text } from "../../components/ui/text";
import { colors } from "../../theme";

export default function CreateGameScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const { code } = await gamesApi.create(settings);
      router.replace(`/game/${code}`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <Button variant="ghost" size="icon" accessibilityLabel="Geri"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}>
          <ArrowLeft size={20} color={colors.foreground} />
        </Button>
        <Text variant="h3">Oda kur</Text>
      </View>
      <Text variant="muted" className="-mt-2 px-1">
        Sen de oyuncusun: rolün diğerleri gibi rastgele gelir. Ayarları lobide de değiştirebilirsin.
      </Text>
      <SettingsForm value={settings} onChange={setSettings} />
      <ErrorAlert message={error} />
      <Button size="lg" onPress={create} loading={busy}>
        <Sparkles size={18} color="#fff" />
        <Text>Odayı oluştur</Text>
      </Button>
    </Screen>
  );
}
