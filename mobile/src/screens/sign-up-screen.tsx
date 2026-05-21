import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { whiteLabelApplyUrl } from "../config/site-urls";
import type { RootStackParamList } from "../navigation/types";

const applyUri = whiteLabelApplyUrl();

export function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "SignUp">>();
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);
  const [webKey, setWebKey] = useState(0);

  const onRetry = useCallback(() => {
    setWebError(null);
    setWebLoading(true);
    setWebKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.toolbar}>
          <View style={styles.toolbarSide}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            >
              <Ionicons name="chevron-back" size={24} color="#f8fafc" />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Sign up</Text>
          <View style={styles.toolbarSide} />
        </View>
      </SafeAreaView>

      {webError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load sign up</Text>
          <Text style={styles.errorBody}>{webError}</Text>
          <Text style={styles.errorUrl} selectable>
            {applyUri}
          </Text>
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.webWrap}>
          {webLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loadingText}>Opening sign up…</Text>
            </View>
          ) : null}
          <WebView
            key={webKey}
            source={{ uri: applyUri }}
            style={styles.webview}
            onLoadStart={() => {
              setWebError(null);
              setWebLoading(true);
            }}
            onLoadEnd={() => setWebLoading(false)}
            onError={(e) => {
              setWebLoading(false);
              setWebError(e.nativeEvent.description || "Web page failed to load.");
            }}
            onHttpError={(e) => {
              if (e.nativeEvent.statusCode >= 400) {
                setWebLoading(false);
                setWebError(`Server returned ${e.nativeEvent.statusCode}.`);
              }
            }}
            startInLoadingState={false}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020617" },
  safe: { backgroundColor: "#020617" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  toolbarSide: { flex: 1 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnPressed: { opacity: 0.7 },
  backLabel: { color: "#f8fafc", fontSize: 17, fontWeight: "500", marginLeft: 2 },
  title: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  webWrap: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1, backgroundColor: "#fff" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  loadingText: { marginTop: 12, color: "#94a3b8", fontSize: 14 },
  errorBox: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  errorTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  errorBody: { color: "#94a3b8", fontSize: 14, lineHeight: 20 },
  errorUrl: { color: "#64748b", fontSize: 12 },
  retryBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: { color: "#082f49", fontWeight: "700", fontSize: 15 },
});
