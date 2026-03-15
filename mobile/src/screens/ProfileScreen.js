import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>My Profile</Text>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name || user?.name || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.name || user?.name}</Text>
            <Text style={styles.headline}>{profile?.headline || 'No headline set'}</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Skills */}
      {profile?.skills?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SKILLS</Text>
          <View style={styles.tagRow}>
            {profile.skills.map(s => (
              <View key={s} style={styles.skillTag}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Experience */}
      {profile?.experience?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>EXPERIENCE</Text>
          {profile.experience.map((exp, i) => (
            <View key={i} style={[styles.expItem, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md }]}>
              <Text style={styles.expTitle}>{exp.title}</Text>
              <Text style={styles.expCompany}>{exp.company} · {exp.duration}</Text>
              {exp.description && <Text style={styles.expDesc}>{exp.description}</Text>}
            </View>
          ))}
        </View>
      )}

      {/* AI Summary */}
      {profile?.ai_summary && (
        <View style={[styles.card, { backgroundColor: 'rgba(255,107,91,0.04)' }]}>
          <Text style={[styles.sectionTitle, { color: colors.coral }]}>AI SUMMARY</Text>
          <Text style={styles.summaryText}>{profile.ai_summary}</Text>
        </View>
      )}

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  headline: { fontSize: 14, color: colors.coral, fontWeight: '600', marginTop: 2 },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, marginBottom: spacing.sm,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full,
    backgroundColor: 'rgba(255,107,91,0.08)',
  },
  skillText: { fontSize: 13, fontWeight: '600', color: colors.coral },
  expItem: { marginBottom: spacing.md },
  expTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  expCompany: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  expDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  summaryText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  logoutBtn: {
    padding: 16, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.borderStrong,
    alignItems: 'center', marginTop: spacing.md,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
});
