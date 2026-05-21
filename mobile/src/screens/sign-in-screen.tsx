import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useAuth } from "../state/auth-context";
import type { RootStackParamList } from "../navigation/types";

const palette = {
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  border: "rgba(148, 163, 184, 0.16)",
  borderFocus: "rgba(56, 189, 248, 0.45)",
  fieldBg: "rgba(15, 23, 42, 0.65)",
  cardBg: "rgba(15, 23, 42, 0.82)",
  cardBorder: "rgba(148, 163, 184, 0.12)",
  glow: "rgba(14, 165, 233, 0.14)",
};

export function SignInScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "SignIn">>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const hasCredentials = email.trim().length > 0 && password.length > 0;
  const ctaLocked = !hasCredentials || loading;

  async function onSubmit() {
    if (!hasCredentials || loading) return;
    Keyboard.dismiss();
    try {
      setLoading(true);
      await signIn(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      Alert.alert("Sign-in failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#0c1222", "#020617", "#010409"]} locations={[0, 0.45, 1]} style={styles.gradient}>
      <View style={styles.ambient} pointerEvents="none">
        <LinearGradient
          colors={["rgba(56, 189, 248, 0.22)", "rgba(56, 189, 248, 0)"]}
          style={styles.orbLeft}
        />
        <LinearGradient
          colors={["rgba(99, 102, 241, 0.18)", "rgba(99, 102, 241, 0)"]}
          style={styles.orbRight}
        />
      </View>

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <LinearGradient
                colors={["rgba(56, 189, 248, 0.35)", "rgba(14, 165, 233, 0.12)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.markRing}
              >
                <View style={styles.markInner}>
                  <Text style={styles.markLetter}>S</Text>
                </View>
              </LinearGradient>
              <Text style={styles.brand}>Statxeo</Text>
              <Text style={styles.tagline}>White-label partner workspace</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardAccent} />
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to manage clients, billing, and routing from anywhere.</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Work email</Text>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "email" && styles.inputShellFocused,
                  ]}
                >
                  <Ionicons name="mail-outline" size={20} color={palette.textSubtle} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="username"
                    autoComplete="email"
                    placeholder="you@company.com"
                    placeholderTextColor={palette.textSubtle}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField((f) => (f === "email" ? null : f))}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View
                  style={[
                    styles.inputShell,
                    focusedField === "password" && styles.inputShellFocused,
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={palette.textSubtle} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithToggle]}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                    placeholder="Enter your password"
                    placeholderTextColor={palette.textSubtle}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField((f) => (f === "password" ? null : f))}
                    returnKeyType="go"
                    onSubmitEditing={() => {
                      if (!ctaLocked) void onSubmit();
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    hitSlop={12}
                    onPress={() => setShowPassword((v) => !v)}
                    style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={palette.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={ctaLocked}
                style={({ pressed }) => [
                  styles.ctaOuter,
                  ctaLocked && !loading && styles.ctaDisabled,
                  pressed && !ctaLocked && styles.ctaPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    hasCredentials || loading
                      ? ["#22d3ee", "#0ea5e9", "#0284c7"]
                      : ["#334155", "#1e293b"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#082f49" />
                  ) : (
                    <Text style={[styles.ctaText, !hasCredentials && styles.ctaTextMuted]}>Sign in</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={styles.signUpRow}>
                <Text style={styles.signUpHint}>{"Don't have an account? "}</Text>
                <Pressable
                  onPress={() => navigation.navigate("SignUp")}
                  accessibilityRole="link"
                  accessibilityLabel="Go to sign up page"
                  hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                  style={({ pressed }) => [pressed && styles.signUpPressed]}
                >
                  <Text style={styles.signUpCta}>Sign Up</Text>
                </Pressable>
              </View>

              <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color={palette.textSubtle} />
                <Text style={styles.trustText}>Encrypted session · Same account as the web portal</Text>
              </View>
            </View>

            <Text style={styles.footer}>Statxeo · Built for operators who ship</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  safe: { flex: 1 },
  ambient: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  orbLeft: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -120,
    left: -100,
  },
  orbRight: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: 120,
    right: -80,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 28 },
  markRing: {
    padding: 2,
    borderRadius: 18,
    marginBottom: 16,
  },
  markInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },
  markLetter: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  brand: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 6,
    color: palette.textMuted,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 12,
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(56, 189, 248, 0.35)",
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.fieldBg,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  inputShellFocused: {
    borderColor: palette.borderFocus,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
  },
  inputIcon: { marginLeft: 12, marginRight: 4 },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    paddingHorizontal: 8,
    color: palette.text,
    fontSize: 16,
  },
  inputWithToggle: { paddingRight: 4 },
  toggle: {
    padding: 12,
    marginRight: 2,
    borderRadius: 12,
  },
  togglePressed: { backgroundColor: palette.glow },
  ctaOuter: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  ctaDisabled: { opacity: 0.85 },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  ctaText: {
    color: "#082f49",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  ctaTextMuted: { color: palette.textSubtle },
  signUpRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 4,
  },
  signUpHint: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "400",
  },
  signUpCta: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },
  signUpPressed: { opacity: 0.75 },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  trustText: {
    flex: 1,
    color: palette.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    marginTop: 28,
    textAlign: "center",
    color: palette.textSubtle,
    fontSize: 12,
    letterSpacing: 0.15,
  },
});
