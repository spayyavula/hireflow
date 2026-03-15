import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import api from '../services/api';

export default function CandidatesScreen() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const data = await api.searchCandidates();
      setCandidates(data);
    } catch (e) {
      console.error('Failed to load candidates:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.headline?.toLowerCase().includes(search.toLowerCase())
  );

  const renderCandidate = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.headline}>{item.headline || item.desired_roles?.[0] || 'Candidate'}</Text>
          <View style={styles.tagRow}>
            {(item.skills || []).slice(0, 3).map(s => (
              <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
            ))}
          </View>
        </View>
        {item.match_score > 0 && (
          <View style={[styles.matchBadge, { backgroundColor: item.match_score >= 80 ? colors.sage : colors.gold }]}>
            <Text style={styles.matchText}>{item.match_score}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.sage} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Candidates</Text>
      <TextInput
        style={styles.search}
        placeholder="Search candidates..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderCandidate}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No candidates found</Text>
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
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  headline: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full, backgroundColor: 'rgba(126,184,158,0.1)' },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.sage },
  matchBadge: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  matchText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.ink },
});
