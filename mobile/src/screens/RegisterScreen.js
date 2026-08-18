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

  // 'Gender' placeholder is NOT in this array, so it cannot be selected again!
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
            Join Humanos to build intentional habits and focus on what matters.
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
                  placeholderTextColor="#9ca3af"
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
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>
          </View>

          {/* Gender Dropdown & Password (Grid Row 3 with High Z-Index) */}
          <View style={[styles.gridRow, { zIndex: 1000 }]}>
            {/* Gender Dropdown */}
            <View style={[styles.inputGroup, styles.gridCol, { zIndex: 1000 }]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <Pressable
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                style={({ pressed }) => [styles.inputWrapper, styles.dropdownWrapper, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <Text style={[styles.dropdownValueText, gender === 'Gender' && styles.dropdownPlaceholderText]}>
                  {gender}
                </Text>
                <Text style={styles.chevronIcon}>{showGenderDropdown ? '▲' : '▼'}</Text>
              </Pressable>

              {showGenderDropdown && (
                <View style={styles.dropdownMenu}>
                  {genderOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setGender(opt);
                        setShowGenderDropdown(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        gender === opt && styles.dropdownItemActive,
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text style={[styles.dropdownItemText, gender === opt && styles.dropdownItemTextActive]}>
                        {opt}
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
                  placeholderTextColor="#9ca3af"
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

          {/* Terms & Privacy Checkbox */}
          <Pressable
            onPress={() => setAgreeTerms(!agreeTerms)}
            style={({ pressed }) => [styles.termsRow, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
          >
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms of Service</Text> & <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Pressable>

          {/* Primary Create Account Button */}
          <Pressable
            onPress={handleRegister}
            style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          {/* Footer Navigation Link */}
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
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
  safeArea: { flex: 1, backgroundColor: '#102821' },
  desktopOuterContainer: {
    flex: 1,
    backgroundColor: '#091814',
    alignItems: 'center',
    justify: 'center',
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
  scrollContainer: { flex: 1, backgroundColor: '#102821' },
  scrollContentContainer: { flexGrow: 1, backgroundColor: '#f6f4ec' },
  hero: {
    minHeight: 200,
    overflow: 'hidden',
    backgroundColor: '#102821',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justify: 'space-between',
    paddingTop: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backArrow: { color: '#c7f36d', fontSize: 18, fontWeight: '700' },
  backText: { color: '#f5f4ed', fontSize: 14, fontWeight: '600' },
  brandMark: { height: 25, justifyContent: 'center', width: 28 },
  brandDot: { backgroundColor: '#d9f99d', borderRadius: 8, height: 13, width: 13 },
  brandDotOffset: { alignSelf: 'flex-end', backgroundColor: '#89b39e', marginTop: -5 },
  heroContent: { marginTop: 18, maxWidth: 330 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 8 },
  eyebrowPulse: { backgroundColor: '#c7f36d', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#b9cabe', fontSize: 10, fontWeight: '700', letterSpacing: 1.45 },
  headline: { color: '#f6f5ed', fontSize: 28, fontWeight: '700', letterSpacing: -1.2, lineHeight: 32 },
  heroCopy: { color: '#c0d1c7', fontSize: 12.5, lineHeight: 17, marginTop: 6, maxWidth: 310 },
  orbLarge: { backgroundColor: '#315a49', borderRadius: 180, height: 220, opacity: 0.5, position: 'absolute', right: -100, top: 100, width: 220 },
  orbSmall: { backgroundColor: '#b8d770', borderRadius: 50, bottom: 16, height: 14, opacity: 0.8, position: 'absolute', right: 40, width: 14 },
  content: {
    backgroundColor: '#f6f4ec',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flex: 1,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', backgroundColor: '#d2d5cd', borderRadius: 3, height: 4, marginBottom: 14, width: 38 },
  formContainer: { gap: 12 },
  centeredAvatarContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  avatarPicker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3ece6',
    borderWidth: 1.5,
    borderColor: '#183d30',
    alignItems: 'center',
    justify: 'center',
    position: 'relative',
    shadowColor: '#17342a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarEmoji: { fontSize: 30 },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#183d30',
    alignItems: 'center',
    justify: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cameraIcon: { color: '#ffffff', fontSize: 11, fontWeight: '900', marginTop: -1 },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 1,
  },
  gridCol: {
    flex: 1,
  },
  inputGroup: { gap: 4 },
  inputLabel: { color: '#314439', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e1e5de',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 46,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#17342a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  input: { flex: 1, color: '#17342a', fontSize: 13.5, fontWeight: '500' },
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
  dropdownValueText: { color: '#17342a', fontSize: 13.5, fontWeight: '500' },
  dropdownPlaceholderText: { color: '#9ca3af' },
  chevronIcon: { color: '#68786f', fontSize: 10, fontWeight: '700' },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderColor: '#183d30',
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
    backgroundColor: '#eaf4ee',
  },
  dropdownItemText: { color: '#314439', fontSize: 12.5, fontWeight: '500' },
  dropdownItemTextActive: { color: '#183d30', fontWeight: '700' },
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
    borderColor: '#96a69b',
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: { backgroundColor: '#183d30', borderColor: '#183d30' },
  checkmark: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  termsText: { flex: 1, color: '#4b5b50', fontSize: 11, lineHeight: 15 },
  termsLink: { color: '#183d30', fontWeight: '700', textDecorationLine: 'underline' },
  primaryButton: {
    alignItems: 'center',
    justify: 'center',
    backgroundColor: '#183d30',
    borderRadius: 16,
    marginTop: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#f5f4ed', fontSize: 14.5, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e6df' },
  dividerText: { color: '#8c9890', fontSize: 9.5, fontWeight: '700', letterSpacing: 1 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e5de',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 44,
  },
  googleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderColor: '#4285F4',
    borderWidth: 1.5,
    alignItems: 'center',
    justify: 'center',
  },
  googleIconText: {
    color: '#4285F4',
    fontSize: 11,
    fontWeight: '900',
    marginTop: -1,
  },
  appleIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justify: 'center',
  },
  appleIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: -1,
  },
  socialText: { fontSize: 13, fontWeight: '600', color: '#274438' },
  footerRow: {
    flexDirection: 'row',
    justify: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: { color: '#68786f', fontSize: 12 },
  signInLink: { color: '#183d30', fontSize: 12, fontWeight: '700' },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
