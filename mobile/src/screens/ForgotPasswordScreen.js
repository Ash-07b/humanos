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
import { ArrowLeft, Mail, Lightbulb } from 'lucide-react-native';
import Logo from '../components/Logo';

export default function ForgotPasswordScreen({ onBack }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (email.trim()) {
      setSubmitted(true);
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
      <View style={[styles.hero, { minHeight: Math.max(220, height * 0.28) }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
          >
            <ArrowLeft size={18} color="#818CF8" strokeWidth={2.4} />
            <Text style={styles.backText}>Back to Sign In</Text>
          </Pressable>

          <Logo size={32} showText={false} />
        </View>

        <View style={styles.heroContent}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowPulse} />
            <Text style={styles.eyebrowText}>ACCOUNT RECOVERY</Text>
          </View>
          <Text style={styles.headline}>Reset Password</Text>
          <Text style={styles.heroCopy}>
            Enter your account email to receive a secure recovery code.
          </Text>
        </View>

        {/* Ambient glowing Orbs */}
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
      </View>

      {/* Main Content Sheet */}
      <View style={styles.content}>
        <View style={styles.handle} />

        {!submitted ? (
          /* — Email Input State — */
          <View style={styles.formContainer}>
            <View style={styles.textBlock}>
              <Text style={styles.cardTitle}>Forgot password?</Text>
              <Text style={styles.cardSubtitle}>
                Enter your email address and we'll send you a password reset link.
              </Text>
            </View>

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

            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Send Reset Link</Text>
            </Pressable>

            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.secondaryButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          /* — Success State — */
          <View style={styles.formContainer}>
            <View style={styles.successBadge}>
              <Mail size={28} color="#4F46E5" strokeWidth={2} />
            </View>

            <View style={styles.textBlockCentered}>
              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.cardSubtitle}>
                We've sent a reset link to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Lightbulb size={16} color="#4338CA" strokeWidth={2.2} style={{ marginTop: 2 }} />
              <Text style={styles.infoText}>
                Didn't receive it? Check your spam folder or try a different email.
              </Text>
            </View>

            <Pressable
              onPress={() => setSubmitted(false)}
              style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Try a Different Email</Text>
            </Pressable>

            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.secondaryButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </Pressable>
          </View>
        )}
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
    paddingVertical: 20,
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
    minHeight: 220,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backArrow: { color: '#818CF8', fontSize: 18, fontWeight: '800' },
  backText: { color: '#94A3B8', fontSize: 13.5, fontWeight: '700' },
  brandMark: { height: 25, justifyContent: 'center', width: 28 },
  brandDot: { backgroundColor: '#818CF8', borderRadius: 8, height: 13, width: 13 },
  brandDotOffset: { alignSelf: 'flex-end', backgroundColor: '#38BDF8', marginTop: -5 },
  heroContent: { marginTop: 24, maxWidth: 330, zIndex: 10 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 10 },
  eyebrowPulse: { backgroundColor: '#818CF8', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headline: { color: '#F8FAFC', fontSize: 32, fontWeight: '800', letterSpacing: -1, lineHeight: 38 },
  heroCopy: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginTop: 8 },
  orbLarge: {
    backgroundColor: '#4338CA',
    borderRadius: 180,
    height: 240,
    opacity: 0.35,
    position: 'absolute',
    right: -100,
    top: 50,
    width: 240,
  },
  orbSmall: {
    backgroundColor: '#0284C7',
    borderRadius: 50,
    bottom: 20,
    height: 18,
    opacity: 0.7,
    position: 'absolute',
    right: 40,
    width: 18,
  },

  content: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    height: 4,
    marginBottom: 20,
    width: 38,
  },

  formContainer: { gap: 16 },
  textBlock: { gap: 4, marginBottom: 4 },
  textBlockCentered: { gap: 4, marginBottom: 4, alignItems: 'center' },
  cardTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 13.5,
    lineHeight: 19,
  },
  emailHighlight: { color: '#4F46E5', fontWeight: '700' },

  inputGroup: { gap: 6 },
  inputLabel: { color: '#0F172A', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  input: { flex: 1, color: '#0F172A', fontSize: 14.5, fontWeight: '500' },

  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },

  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  successEmoji: { fontSize: 28 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, color: '#4338CA', fontSize: 12.5, lineHeight: 18 },

  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
