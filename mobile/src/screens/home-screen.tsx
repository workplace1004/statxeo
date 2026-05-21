import { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchWhiteLabelerOverview, WhiteLabelerOverview } from "../features/white-labeler/white-labeler-api";
import { useAuth } from "../state/auth-context";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function HomeScreen() {
  const { session } = useAuth();
  const [overview, setOverview] = useState<WhiteLabelerOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWhiteLabelerOverview(session);
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#38bdf8" />}
    >
      <Text style={styles.heading}>White Labeler Dashboard</Text>
      <Text style={styles.subheading}>Statxeo account KPI summary</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{overview?.account.displayName ?? "-"}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Active Clients</Text>
        <Text style={styles.value}>{overview?.kpis.activeClients ?? 0}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Active Sites</Text>
        <Text style={styles.value}>{overview?.kpis.activeSites ?? 0}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Month Revenue</Text>
        <Text style={styles.value}>{money(overview?.kpis.monthRevenueCents ?? 0)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Month Net Payout</Text>
        <Text style={styles.value}>{money(overview?.kpis.monthNetPayoutCents ?? 0)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, gap: 12 },
  heading: { color: "#f8fafc", fontSize: 22, fontWeight: "700" },
  subheading: { color: "#94a3b8", marginBottom: 8 },
  card: { backgroundColor: "#0f172a", borderColor: "#1e293b", borderWidth: 1, borderRadius: 12, padding: 14 },
  label: { color: "#94a3b8", fontSize: 13 },
  value: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginTop: 6 },
  error: { color: "#f87171", marginBottom: 8 },
});
