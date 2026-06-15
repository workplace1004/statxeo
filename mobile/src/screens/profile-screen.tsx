import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../state/auth-context";

export function ProfileScreen() {
  const { session, signOut } = useAuth();

  async function onSignOut() {
    try {
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out.";
      Alert.alert("Error", message);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.value}>{session?.email ?? "Unknown user"}</Text>
      <Pressable style={styles.button} onPress={onSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020617", padding: 16, gap: 10 },
  heading: { color: "#f8fafc", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  label: { color: "#94a3b8" },
  value: { color: "#f8fafc", fontSize: 16, fontWeight: "600" },
  button: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
