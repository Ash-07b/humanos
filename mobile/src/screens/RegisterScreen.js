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

export default function RegisterScreen({ onBack, onNavigateToLogin, onRegisterSuccess }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Gender');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState('🌱');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

  const handleRegister = () => {
    if (onRegisterSuccess) {
      onRegisterSuccess({ fullName, email, phoneNumber, dob, gender, profilePic, password });
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
      <View style={[styles.hero, { minHeight: Math.max(200, height * 0.28) }]}>
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
            <Text style={styles.eyebrowText}>START YOUR JOURNEY</Text>
          </View>
          <Text style={styles.headline}>Create your account.</Text>
          <Text style={styles.heroCopy}>
            Join Humanos to build productive habits, manage tasks, and focus on what matters.
          </Text>
        </View>

        {/* Ambient glowing Orbs */}
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
      </View>

      {/* Main Content Form Sheet */}
      <View style={styles.content}>
        <View style={styles.handle} />

        <View style={styles.formContainer}>
          {/* Centered Avatar Picker */}
          <View style={styles.centeredAvatarContainer}>
            <Pressable
              onPress={() => {
                const avatars = ['🌱', '🌿', '✨', '☀️', '🌸', '🦊', '🦉'];
                const currentIndex = avatars.indexOf(profilePic);
                const nextIndex = (currentIndex + 1) % avatars.length;
                setProfilePic(avatars[nextIndex]);
              }}
              style={({ pressed }) => [styles.avatarPicker, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.avatarEmoji}>{profilePic}</Text>
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraIcon}>+</Text>
              </View>
            </Pressable>
          </View>

          {/* Full Name & Email (Grid Row 1) */}
          <View style={styles.gridRow}>
            <View style={[styles.inputGroup, styles.gridCol]}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, isWeb && styles.webOutlineNone]}
                  placeholder="Ash Morgan"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.gridCol]}>
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
          </View>

          {/* Phone Number & Date of Birth (Grid Row 2) */}
          <View style={styles.gridRow}>
            <View style={[styles.inputGroup, styles.gridCol]}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, isWeb && styles.webOutlineNone]}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor="#94A3B8"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.gridCol]}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, isWeb && styles.webOutlineNone]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94A3B8"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>
          </View>

          {/* Gender & Password (Grid Row 3) */}
          <View style={styles.gridRow}>
            {/* Gender Select with Custom Dropdown */}
            <View style={[styles.inputGroup, styles.gridCol, { position: 'relative', zIndex: 10 }]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <Pressable
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                style={({ pressed }) => [
                  styles.inputWrapper,
                  styles.dropdownWrapper,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text
                  style={[
                    styles.dropdownValueText,
                    gender === 'Gender' && styles.dropdownPlaceholderText,
                  ]}
                >
                  {gender}
                </Text>
                <Text style={styles.chevronIcon}>{showGenderDropdown ? '▲' : '▼'}</Text>
              </Pressable>

              {/* Absolute Dropdown Floating Box */}
              {showGenderDropdown && (
                <View style={styles.dropdownMenu}>
                  {genderOptions.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setGender(option);
                        setShowGenderDropdown(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        gender === option && styles.dropdownItemActive,
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          gender === option && styles.dropdownItemTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Password */}
            <View style={[styles.inputGroup, styles.gridCol]}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput, isWeb && styles.webOutlineNone]}
                  placeholder="Password"
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
          </View>

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsRow}>
            <Pressable
              onPress={() => setAgreeTerms(!agreeTerms)}
              style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Primary Create Account Button */}
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          {/* Footer Sign In Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable
              onPress={onNavigateToLogin}
              style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              <Text style={styles.signInLink}>Sign In</Text>
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
    minHeight: 200,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
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
  heroContent: { marginTop: 22, maxWidth: 330 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 8 },
  eyebrowPulse: { backgroundColor: '#818CF8', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headline: { color: '#F8FAFC', fontSize: 30, fontWeight: '800', letterSpacing: -1.2, lineHeight: 34 },
  heroCopy: { color: '#94A3B8', fontSize: 12.5, lineHeight: 18, marginTop: 8, maxWidth: 310 },
  orbLarge: { backgroundColor: '#4338CA', borderRadius: 180, height: 220, opacity: 0.4, position: 'absolute', right: -90, top: 80, width: 220 },
  orbSmall: { backgroundColor: '#0284C7', borderRadius: 50, bottom: 16, height: 16, opacity: 0.8, position: 'absolute', right: 40, width: 16 },
  content: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: { alignSelf: 'center', backgroundColor: '#CBD5E1', borderRadius: 3, height: 4, marginBottom: 16, width: 38 },
  formContainer: { gap: 12 },
  centeredAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarPicker: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarEmoji: { fontSize: 30 },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cameraIcon: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', marginTop: -1 },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 1,
  },
  gridCol: {
    flex: 1,
  },
  inputGroup: { gap: 4 },
  inputLabel: { color: '#0F172A', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 46,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  input: { flex: 1, color: '#0F172A', fontSize: 13.5, fontWeight: '500' },
  passwordInput: { paddingRight: 32 },
  eyeButton: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eyeIcon: { fontSize: 15 },
  dropdownWrapper: {
    justifyContent: 'space-between',
  },
  dropdownValueText: { color: '#0F172A', fontSize: 13.5, fontWeight: '500' },
  dropdownPlaceholderText: { color: '#94A3B8' },
  chevronIcon: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 4,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: { color: '#334155', fontSize: 12.5, fontWeight: '500' },
  dropdownItemTextActive: { color: '#4F46E5', fontWeight: '700' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  termsText: { flex: 1, color: '#475569', fontSize: 11, lineHeight: 15 },
  termsLink: { color: '#4F46E5', fontWeight: '700', textDecorationLine: 'underline' },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    marginTop: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: { color: '#64748B', fontSize: 12 },
  signInLink: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
