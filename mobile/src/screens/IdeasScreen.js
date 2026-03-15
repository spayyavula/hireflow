import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import api from '../services/api';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: colors.textMuted },
  under_review: { label: 'Under Review', color: colors.gold },
  planned: { label: 'Planned', color: colors.lavender },
  in_progress: { label: 'In Progress', color: colors.coral },
  shipped: { label: 'Shipped', color: colors.sage },
};

const CATEGORIES = ['All', 'Job Search', 'Resume Tools', 'Recruiter Tools', 'Company Dashboard', 'Chat & Messaging', 'AI Features', 'General'];

export default function IdeasScreen() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const loadFeatures = async () => {
    try {
      const params = { sort: 'votes' };
      if (category !== 'All') params.category = category;
      const data = await api.listFeatures(params);
      setFeatures(data);
    } catch (e) {
      console.error('Failed to load features:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeatures(); }, [category]);

  const handleVote = async (id) => {
    try {
      await api.voteFeature(id);
      await loadFeatures();
    } catch (e) {
      console.error('Vote failed:', e);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await api.createFeature({ title, description, category: newCategory });
      setShowSubmit(false);
      setTitle('');
      setDescription('');
      await loadFeatures();
    } catch (e) {
      console.error('Submit failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeature = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {/* Vote Column */}
          <TouchableOpacity style={[styles.voteCol, item.user_has_voted && styles.voteActive]} onPress={() => handleVote(item.id)}>
            <Text style={[styles.voteArrow, item.user_has_voted && { color: '#fff' }]}>▲</Text>
            <Text style={[styles.voteCount, item.user_has_voted && { color: '#fff' }]}>{item.vote_count}</Text>
          </TouchableOpacity>
          {/* Content */}
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: status.color + '18' }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDesc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>by {item.user_name}</Text>
              <Text style={styles.metaText}>💬 {item.comment_count}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Ideas Board</Text>
        <TouchableOpacity style={styles.submitBtn} onPress={() => setShowSubmit(true)}>
          <Text style={styles.submitBtnText}>+ Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={c => c}
        style={{ maxHeight: 44, marginBottom: spacing.md }}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.filterPill, category === c && styles.filterPillActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.filterText, category === c && styles.filterTextActive]}>{c}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.coral} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={features}
          keyExtractor={item => item.id}
          renderItem={renderFeature}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>💡</Text>
              <Text style={styles.emptyText}>No ideas yet</Text>
              <Text style={styles.emptySubtext}>Be the first to submit one!</Text>
            </View>
          }
        />
      )}

      {/* Submit Modal */}
      <Modal visible={showSubmit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit an Idea</Text>
              <TouchableOpacity onPress={() => setShowSubmit(false)}>
                <Text style={{ fontSize: 20, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="A short, descriptive title..." placeholderTextColor={colors.textMuted} />
            <Text style={styles.label}>Category</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={CATEGORIES.filter(c => c !== 'All')}
              keyExtractor={c => c}
              style={{ maxHeight: 40, marginBottom: spacing.md }}
              renderItem={({ item: c }) => (
                <TouchableOpacity
                  style={[styles.filterPill, newCategory === c && styles.filterPillActive]}
                  onPress={() => setNewCategory(c)}
                >
                  <Text style={[styles.filterText, newCategory === c && styles.filterTextActive]}>{c}</Text>
                </TouchableOpacity>
              )}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your idea..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.submitAction, (submitting || title.length < 5 || description.length < 10) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={submitting || title.length < 5 || description.length < 10}
            >
              <Text style={styles.submitActionText}>{submitting ? 'Submitting...' : 'Submit Idea'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink },
  submitBtn: { backgroundColor: colors.coral, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.full, marginRight: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white,
  },
  filterPillActive: { borderColor: colors.coral, backgroundColor: 'rgba(255,107,91,0.08)' },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: colors.coral },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  cardRow: { flexDirection: 'row', gap: spacing.md },
  voteCol: {
    width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.borderStrong, paddingVertical: spacing.sm,
  },
  voteActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  voteArrow: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  voteCount: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { fontSize: 11, fontWeight: '700' },
  categoryText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  featureTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.ink },
  emptySubtext: { fontSize: 14, color: colors.textMuted },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: radii.md, padding: 14, fontSize: 15, color: colors.ink, marginBottom: spacing.md,
  },
  submitAction: {
    backgroundColor: colors.coral, borderRadius: radii.md, padding: 16,
    alignItems: 'center', marginTop: spacing.sm,
  },
  submitActionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
