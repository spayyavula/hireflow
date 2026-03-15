import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import api from '../services/api';

export default function ChatScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }) => {
    const otherNames = Object.values(item.participant_names || {}).join(', ') || 'Unknown';
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherNames.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topRow}>
              <Text style={styles.name} numberOfLines={1}>{otherNames}</Text>
              {item.last_message_at && (
                <Text style={styles.time}>
                  {new Date(item.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
            <Text style={styles.preview} numberOfLines={1}>{item.last_message || 'No messages yet'}</Text>
          </View>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.coral} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
  heading: { fontSize: 26, fontWeight: '800', color: colors.ink, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.cream, fontSize: 16, fontWeight: '800' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, flex: 1 },
  time: { fontSize: 12, color: colors.textMuted },
  preview: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.coral,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.ink },
});
