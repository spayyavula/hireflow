import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const d = await api.getCompanyDashboard();
      setData(d);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.lavender} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.welcome}>Welcome, {user?.companyName || user?.name}</Text>

      <View style={styles.row}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.lavender }]}>{data?.active_jobs || 0}</Text>
          <Text style={styles.statLabel}>Active Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.coral }]}>{data?.total_applicants || 0}</Text>
          <Text style={styles.statLabel}>Applicants</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.cardDesc}>
          View and manage your job postings, review applicants, and track hiring progress from the tabs below.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  welcome: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm },
  cardDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
});
