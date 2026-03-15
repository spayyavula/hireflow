import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import api from '../services/api';
import { useAuth } from '../services/AuthContext';

export default function JobsScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadJobs();
  }, [user]);

  const loadJobs = async () => {
    try {
      if (user) {
        const data = await api.getMatches();
        setJobs(data);
      } else {
        const data = await api.getJobs();
        setJobs(data);
      }
    } catch (e) {
      console.error('Failed to load jobs:', e);
      try {
        const data = await api.getJobs();
        setJobs(data);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderJob = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.company}>{item.company_name || 'Company'}</Text>
        </View>
        {item.match_score > 0 && (
          <View style={[styles.matchBadge, { backgroundColor: item.match_score >= 80 ? colors.sage : colors.gold }]}>
            <Text style={styles.matchText}>{item.match_score}%</Text>
          </View>
        )}
      </View>
      <View style={styles.tagRow}>
        {item.location && (
          <View style={styles.tag}><Text style={styles.tagText}>{item.location}</Text></View>
        )}
        {item.remote && (
          <View style={[styles.tag, { backgroundColor: 'rgba(126,184,158,0.1)' }]}>
            <Text style={[styles.tagText, { color: colors.sage }]}>Remote</Text>
          </View>
        )}
        {item.type && (
          <View style={styles.tag}><Text style={styles.tagText}>{item.type}</Text></View>
        )}
      </View>
      {item.salary_display && (
        <Text style={styles.salary}>{item.salary_display}</Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Job Matches</Text>
      <TextInput
        style={styles.search}
        placeholder="Search jobs..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderJob}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs found</Text>
            <Text style={styles.emptySubtext}>Complete your profile to get matched</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, padding: 14, fontSize: 15, color: colors.ink, marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  jobTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  company: { fontSize: 14, color: colors.textSecondary },
  matchBadge: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  matchText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full,
    backgroundColor: 'rgba(13,13,15,0.04)',
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  salary: { fontSize: 14, fontWeight: '700', color: colors.coral },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: colors.textMuted },
});
