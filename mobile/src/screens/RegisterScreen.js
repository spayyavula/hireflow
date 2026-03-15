import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useAuth } from '../services/AuthContext';

const ROLES = [
  { key: 'seeker', label: 'Job Seeker', icon: '🔍', color: colors.coral },
  { key: 'recruiter', label: 'Recruiter', icon: '🤝', color: colors.sage },
  { key: 'company', label: 'Company', icon: '🏢', color: colors.lavender },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('seeker');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (role === 'company' && !companyName) {
      setError('Company name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email.trim(), password, role, name.trim(), companyName.trim() || null);
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>JS</Text>
          </View>
          <Text style={styles.logoText}>JobsSearch</Text>
        </View>

        <Text style={styles.subtitle}>Create your account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Role Selector */}
        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.key}
              style={[
                styles.roleCard,
                role === r.key && { borderColor: r.color, backgroundColor: r.color + '10' },
              ]}
              onPress={() => setRole(r.key)}
            >
              <Text style={styles.roleIcon}>{r.icon}</Text>
              <Text style={[styles.roleLabel, role === r.key && { color: r.color }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {role === 'company' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Acme Inc."
              placeholderTextColor={colors.textMuted}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 8 characters"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoBox: { alignItems: 'center', marginBottom: spacing.lg },
  logoIcon: {
    width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  logoIconText: { color: colors.cream, fontSize: 20, fontWeight: '800' },
  logoText: { fontSize: 28, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  subtitle: { textAlign: 'center', fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xl },
  errorBox: {
    backgroundColor: 'rgba(255,107,91,0.1)', padding: spacing.md,
    borderRadius: radii.md, marginBottom: spacing.md,
  },
  errorText: { color: colors.coral, fontWeight: '600', fontSize: 14 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  roleCard: {
    flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.white,
  },
  roleIcon: { fontSize: 24, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderStrong,
    borderRadius: radii.md, padding: 14, fontSize: 16, color: colors.ink,
  },
  button: {
    backgroundColor: colors.coral, borderRadius: radii.md, padding: 16,
    alignItems: 'center', marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.coral, fontWeight: '700' },
});
