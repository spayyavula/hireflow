import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import api from '../services/api';

const CATEGORY_LABELS = {
  'career-playbook': 'Career Playbook',
  'resume-lab': 'Resume Lab',
  'interview-decoded': 'Interview Decoded',
  'hiring-signals': 'Hiring Signals',
  'company-spotlight': 'Company Spotlight',
  'remote-work': 'Remote Work',
  'ai-future-work': 'AI & Future',
  'salary-compass': 'Salary Compass',
  'recruiter-craft': 'Recruiter Craft',
};

export default function BlogScreen({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      const data = await api.getBlogPosts();
      setPosts(data);
    } catch (e) {
      console.error('Failed to load blog:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('BlogPost', { slug: item.slug })}
    >
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {CATEGORY_LABELS[item.category] || item.category}
          </Text>
        </View>
        <Text style={styles.readTime}>{item.reading_time_min} min</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      {item.excerpt && (
        <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.author}>{item.author_name}</Text>
        {item.published_at && (
          <Text style={styles.date}>
            {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>
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
      <Text style={styles.heading}>Blog</Text>
      <Text style={styles.subheading}>Career insights & hiring trends</Text>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Check back soon for career insights</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  subheading: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(126,184,158,0.1)',
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: colors.sage },
  readTime: { fontSize: 12, color: colors.textMuted },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 6, lineHeight: 24 },
  excerpt: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 13, fontWeight: '600', color: colors.ink },
  date: { fontSize: 12, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: colors.textMuted },
});
