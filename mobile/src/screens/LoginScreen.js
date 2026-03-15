import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radii } from '../constants/theme';
import { useAuth } from '../services/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.message || 'Login failed');
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
        {/* Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>JS</Text>
          </View>
          <Text style={styles.logoText}>JobsSearch</Text>
        </View>

        <Text style={styles.subtitle}>Sign in to your account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
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
