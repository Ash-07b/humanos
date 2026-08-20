import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GoogleIcon = () => (
  <View style={styles.googleIconCircle}>
    <Text style={styles.googleIconText}>G</Text>
  </View>
);

const AppleIcon = () => (
  <View style={styles.appleIconCircle}>
    <Text style={styles.appleIconText}></Text>
  </View>
);

export default function LoginScreen({ onBack, onNavigateToRegister, onLoginSuccess, onForgotPassword }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = () => {
    if (onLoginSuccess) {
      onLoginSuccess({ email, password });
    }
  };

  const appContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {/* Hero Header */}
      <View style={[styles.hero, { minHeight: Math.max(300, height * 0.38) }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <View style={[styles.brandDot, styles.brandDotOffset]} />
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowPulse} />
            <Text style={styles.eyebrowText}>WELCOME BACK</Text>
          </View>
          <Text style={styles.headline}>Good to see{`\n`}you again.</Text>
          <Text style={styles.heroCopy}>
            Sign in to access your daily tasks, focus stats, and habit logs.
          </Text>
        </View>

        {/* Ambient glowing Orbs */}
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
      </View>

      {/* Main Content Sheet */}
      <View style={styles.content}>
        <View style={styles.handle} />

        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, isWeb && styles.webOutlineNone]}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput, isWeb && styles.webOutlineNone]}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={({ pressed }) => [styles.eyeButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
          </View>

          {/* Remember me & Forgot Password */}
          <View style={styles.rowBetween}>
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={({ pressed }) => [styles.checkboxRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Remember me</Text>
            </Pressable>

            <Pressable
              onPress={onForgotPassword}
              style={({ pressed }) => [styles.forgotButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Primary Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Sign In to Humanos</Text>
          </Pressable>

          {/* Footer Register Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable
              onPress={onNavigateToRegister}
              style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.signUpLink}>Create one now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      {isDesktop ? (
        <View style={styles.desktopOuterContainer}>
          <View style={styles.desktopShell}>
            {appContent}
          </View>
        </View>
      ) : (
        appContent
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0E1A' },
  desktopOuterContainer: {
    flex: 1,
    backgroundColor: '#05070D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  desktopShell: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    maxHeight: 880,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
    backgroundColor: '#0A0E1A',
  },
  scrollContainer: { flex: 1, backgroundColor: '#0A0E1A' },
  scrollContentContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  hero: {
    minHeight: 300,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backArrow: { color: '#818CF8', fontSize: 18, fontWeight: '800' },
  backText: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  brandMark: { height: 25, justifyContent: 'center', width: 28 },
  brandDot: { backgroundColor: '#818CF8', borderRadius: 8, height: 13, width: 13 },
  brandDotOffset: { alignSelf: 'flex-end', backgroundColor: '#38BDF8', marginTop: -5 },
  heroContent: { marginTop: 36, maxWidth: 330 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 14 },
  eyebrowPulse: { backgroundColor: '#818CF8', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headline: { color: '#F8FAFC', fontSize: 36, fontWeight: '800', letterSpacing: -1.5, lineHeight: 40 },
  heroCopy: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 310 },
  orbLarge: { backgroundColor: '#4338CA', borderRadius: 180, height: 250, opacity: 0.45, position: 'absolute', right: -110, top: 120, width: 250 },
  orbSmall: { backgroundColor: '#0284C7', borderRadius: 50, bottom: 24, height: 16, opacity: 0.8, position: 'absolute', right: 48, width: 16 },
  content: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 13,
    paddingBottom: 32,
  },
  handle: { alignSelf: 'center', backgroundColor: '#CBD5E1', borderRadius: 3, height: 4, marginBottom: 20, width: 38 },
  formContainer: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { color: '#0F172A', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    height: 52,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  input: { flex: 1, color: '#0F172A', fontSize: 14.5, fontWeight: '500' },
  passwordInput: { paddingRight: 36 },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  eyeIcon: { fontSize: 16 },
  rowBetween: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  checkboxLabel: { color: '#475569', fontSize: 12.5, fontWeight: '600' },
  forgotButton: {
    paddingVertical: 6,
    paddingLeft: 8,
  },
  forgotText: { color: '#4F46E5', fontSize: 12.5, fontWeight: '700', textDecorationLine: 'underline' },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 17,
    marginTop: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: { color: '#64748B', fontSize: 13 },
  signUpLink: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
