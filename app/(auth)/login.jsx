import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = async () => {
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await signIn({ email: emailAddress.trim(), password });
      router.replace('/home');
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.appName}>Smart Poultry</Text>

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={styles.activeToggle}>
            <Text style={styles.activeToggleText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.inactiveToggle}>
            <Link href="/signup" asChild>
              <Text style={styles.inactiveToggleText}>Sign Up</Text>
            </Link>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>Login to your poultry account</Text>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={Colors.light.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={emailAddress}
              onChangeText={setEmailAddress}
              editable={!loading}
            />
          </View>

            {/* Password Input */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>
                        <Ionicons name='lock-closed-outline' size={20} color={Colors.light.icon}/>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={Colors.light.icon}
                        />
                      </TouchableOpacity>
                    </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Email/Password Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={onSignInPress}
            disabled={loading || !emailAddress.trim() || !password}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <Text style={styles.link}>Sign up</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  // ... your existing styles remain the same ...

  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },

  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a472a',
    marginTop: 40,
    marginBottom: 28,
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 50,
    padding: 4,
    marginBottom: 32,
    width: '85%',
    maxWidth: 320,
  },
  activeToggle: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeToggleText: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 16,
  },
  inactiveToggle: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inactiveToggleText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 16,
    opacity: 0.75,
  },

  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 32,
    paddingTop: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },

  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logo: {
    width: 200,
    height: 200,
  },

  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 36,
    textAlign: 'center',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    paddingHorizontal: 18,
    height: 58,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    fontSize: 22,
    marginRight: 12,
    color: '#64748b',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  eyeIcon: {
    padding: 4,
  },

  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },

  loginButton: {
    backgroundColor: '#1a472a',
    width: '100%',
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  link: {
    color: '#2e7d32',
    fontWeight: '700',
    fontSize: 15,
  },
  // New styles for divider and Google button
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  orText: {
    color: '#6b7280',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    height: 58,
    width: '100%',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});