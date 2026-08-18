import React, { useState } from 'react';
import {
  SafeAreaView,
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

export default function ForgotPasswordScreen({ onBack }) {
  const { width } = useWindowDimensions();
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
      <View style={styles.page}>
        {/* Back button */}
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back to Sign In</Text>
        </Pressable>

        {!submitted ? (
          /* — Email Input State — */
          <View style={styles.card}>
            <View style={styles.textBlock}>
              <Text style={styles.cardTitle}>Forgot password?</Text>
              <Text style={styles.cardSubtitle}>
                Enter your email and we'll send you a secure reset link.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, isWeb && styles.webOutlineNone]}
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
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
          </View>
        ) : (
          /* — Success State — */
          <View style={styles.card}>
            <View style={styles.successBadge}>
              <Text style={styles.successEmoji}>✉️</Text>
            </View>

            <View style={styles.textBlock}>
              <Text style={styles.cardTitle}>Check your email</Text>
              <Text style={styles.cardSubtitle}>
                We've sent a reset link to{' '}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💡</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
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
  safeArea: { flex: 1, backgroundColor: '#f6f4ec' },
  desktopOuterContainer: {
    flex: 1,
    backgroundColor: '#091814',
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  scrollContainer: { flex: 1, backgroundColor: '#f6f4ec' },
  scrollContentContainer: { flexGrow: 1 },

  page: {
    flex: 1,
    backgroundColor: '#f6f4ec',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 32,
  },
  backArrow: { color: '#183d30', fontSize: 18, fontWeight: '700' },
  backText: { color: '#183d30', fontSize: 14, fontWeight: '600' },

  card: {
    width: '100%',
    maxWidth: 380,
    aspectRatio: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#f8f8f4',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#dfe7e1',
    shadowColor: '#17342a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },

  textBlock: { gap: 4 },
  cardTitle: {
    color: '#17342a',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: '#68786f',
    fontSize: 13.5,
    lineHeight: 19,
  },
  emailHighlight: { color: '#183d30', fontWeight: '700' },

  inputGroup: { gap: 6 },
  inputLabel: { color: '#314439', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e1e5de',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#17342a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  input: { flex: 1, color: '#17342a', fontSize: 14.5, fontWeight: '500' },

  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#183d30',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#183d30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: '#f5f4ed', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  secondaryButtonText: { color: '#68786f', fontSize: 13, fontWeight: '600' },

  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eaf4ee',
    borderWidth: 2,
    borderColor: '#183d30',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  successEmoji: { fontSize: 32 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ffffff',
    borderColor: '#e1e5de',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, color: '#4b5b50', fontSize: 12.5, lineHeight: 18 },

  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
