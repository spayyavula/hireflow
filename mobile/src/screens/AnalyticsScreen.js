import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useAuth } from '../services/AuthContext';

const StatCard = ({ label, value, sub, accent = colors.coral }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </View>
);

export default function AnalyticsScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Analytics</Text>

      {user?.role === 'seeker' && (
        <>
          <View style={styles.row}>
            <StatCard label="Applications" value="12" />
            <StatCard label="Avg Match" value="84%" accent={colors.sage} />
          </View>
          <View style={styles.row}>
            <StatCard label="Strong Matches" value="8" accent={colors.lavender} />
            <StatCard label="Interviews" value="3" accent={colors.gold} />
          </View>
        </>
      )}

      {user?.role === 'recruiter' && (
        <>
          <View style={styles.row}>
            <StatCard label="Placements YTD" value="24" />
            <StatCard label="Avg Time to Fill" value="18d" accent={colors.sage} />
          </View>
          <View style={styles.row}>
            <StatCard label="Candidates Sourced" value="156" accent={colors.lavender} />
            <StatCard label="Response Rate" value="72%" accent={colors.gold} />
          </View>
        </>
      )}

      {user?.role === 'company' && (
        <>
          <View style={styles.row}>
            <StatCard label="Open Positions" value="8" />
            <StatCard label="Total Applicants" value="234" accent={colors.sage} />
          </View>
          <View style={styles.row}>
            <StatCard label="Cost per Hire" value="$3.2k" accent={colors.lavender} />
            <StatCard label="Offer Accept" value="92%" accent={colors.gold} />
          </View>
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardDesc}>
          Detailed charts, trends, and insights will be available in a future update. Stay tuned!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  cardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
