import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { fetchWhiteLabelerClients, WhiteLabelerClient } from "../features/white-labeler/white-labeler-api";
import { useAuth } from "../state/auth-context";

export function ClientsScreen() {
  const { session } = useAuth();
  const [clients, setClients] = useState<WhiteLabelerClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWhiteLabelerClients(session);
      setClients(data.clients);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.heading}>Clients</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#38bdf8" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.client_name}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Active sites: {item.active_site_count}</Text>
            <Text style={styles.meta}>{item.billing_email ?? "No billing email"}</Text>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No clients found.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020617", paddingTop: 16 },
  heading: { color: "#f8fafc", fontSize: 22, fontWeight: "700", paddingHorizontal: 16, marginBottom: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: "#0f172a", borderWidth: 1, borderColor: "#1e293b", borderRadius: 12, padding: 12 },
  name: { color: "#f8fafc", fontSize: 17, fontWeight: "700", marginBottom: 6 },
  meta: { color: "#94a3b8" },
  empty: { color: "#64748b", paddingTop: 18 },
  error: { color: "#f87171", paddingHorizontal: 16, paddingBottom: 8 },
});
