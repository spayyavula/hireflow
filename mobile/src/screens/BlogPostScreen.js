import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  useWindowDimensions, Share, Linking,
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

// Simple HTML-to-text renderer for React Native (strips tags, preserves structure)
function HtmlContent({ html, width }) {
  // Basic strip: remove tags, decode entities, keep paragraphs
  const blocks = html
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n__HEADING__$1__HEADING__\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n');

  return (
    <View style={{ width }}>
      {blocks.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={{ height: 12 }} />;
        if (trimmed.startsWith('__HEADING__') && trimmed.endsWith('__HEADING__')) {
          const text = trimmed.replace(/__HEADING__/g, '');
          return <Text key={i} style={styles.contentHeading}>{text}</Text>;
        }
        if (trimmed.startsWith('• ')) {
          return <Text key={i} style={styles.contentBullet}>{trimmed}</Text>;
        }
        return <Text key={i} style={styles.contentText}>{trimmed}</Text>;
      })}
    </View>
  );
}

export default function BlogPostScreen({ route, navigation }) {
  const { slug } = route.params;
  const { width } = useWindowDimensions();
  const [post, setPost] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPost(); }, [slug]);

  const loadPost = async () => {
    try {
      const [postData, jobsData] = await Promise.all([
        api.getBlogPost(slug),
        api.getRelatedJobsForPost(slug).catch(() => []),
      ]);
      setPost(postData);
      setRelatedJobs(jobsData);
    } catch (e) {
      console.error('Failed to load post:', e);
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

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backLink}>&larr; Back</Text>
      </TouchableOpacity>

      {/* Meta */}
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{CATEGORY_LABELS[post.category] || post.category}</Text>
        </View>
        <Text style={styles.readTime}>{post.reading_time_min} min read</Text>
        <Text style={styles.readTime}>{post.view_count} views</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{post.title}</Text>
      {post.subtitle && <Text style={styles.subtitle}>{post.subtitle}</Text>}

      {/* Author */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.author_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </Text>
        </View>
        <View>
          <Text style={styles.authorName}>{post.author_name}</Text>
          {post.published_at && (
            <Text style={styles.date}>
              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content */}
      <HtmlContent html={post.body_html} width={width - spacing.lg * 2} />

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsSection}>
          <View style={styles.divider} />
          <View style={styles.tagsRow}>
            {post.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Share Buttons */}
      <View style={styles.shareSection}>
        <Text style={styles.shareTitle}>Share this article</Text>
        <View style={styles.shareRow}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: '#0A66C2' }]}
            onPress={() => Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://jobssearch.work/blog/${slug}`)}`)}
          >
            <Text style={styles.shareBtnText}>LinkedIn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: '#0F1419' }]}
            onPress={() => Linking.openURL(`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://jobssearch.work/blog/${slug}`)}&text=${encodeURIComponent(post.title)}`)}
          >
            <Text style={styles.shareBtnText}>X</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: '#1877F2' }]}
            onPress={() => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://jobssearch.work/blog/${slug}`)}`)}
          >
            <Text style={styles.shareBtnText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.coral }]}
            onPress={() => Share.share({
              message: `${post.title} — https://jobssearch.work/blog/${slug}`,
              url: `https://jobssearch.work/blog/${slug}`,
            })}
          >
            <Text style={styles.shareBtnText}>More...</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Related Jobs */}
      {relatedJobs.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Jobs</Text>
          {relatedJobs.map(job => (
            <View key={job.id} style={styles.jobCard}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company_name}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {job.location && <Text style={styles.jobMeta}>{job.location}</Text>}
                {job.remote && <Text style={[styles.jobMeta, { color: colors.sage, fontWeight: '600' }]}>Remote</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  backButton: { marginBottom: spacing.md },
  backLink: { fontSize: 14, fontWeight: '600', color: colors.coral },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    backgroundColor: 'rgba(126,184,158,0.1)',
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: colors.sage },
  readTime: { fontSize: 12, color: colors.textMuted },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, lineHeight: 34, marginBottom: 8 },
  subtitle: { fontSize: 18, color: colors.textSecondary, lineHeight: 26, marginBottom: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.cream, fontSize: 14, fontWeight: '700' },
  authorName: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  date: { fontSize: 13, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },
  contentHeading: { fontSize: 20, fontWeight: '700', color: colors.ink, marginTop: 16, marginBottom: 8 },
  contentText: { fontSize: 16, lineHeight: 26, color: colors.ink, marginBottom: 4 },
  contentBullet: { fontSize: 16, lineHeight: 26, color: colors.ink, marginBottom: 4, paddingLeft: 8 },
  tagsSection: { marginTop: 24 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: 'rgba(13,13,15,0.04)' },
  tagText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  relatedSection: {
    marginTop: 32, backgroundColor: colors.white, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
  },
  relatedTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 16 },
  jobCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  jobCompany: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  jobMeta: { fontSize: 12, color: colors.textMuted },
  errorText: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  shareSection: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.border },
  shareTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  shareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shareBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  shareBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
