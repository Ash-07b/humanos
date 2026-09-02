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
  Modal,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Check,
  Calendar,
  Upload,
  X,
} from 'lucide-react-native';
import { registerUser, loginUser } from '../services/api';
import { saveToken, saveUser } from '../services/storage';
import Logo from '../components/Logo';
import DatePickerModal from '../components/DatePickerModal';

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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Pickers
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const avatarOptions = ['🌱', '🌿', '✨', '☀️', '🌸', '🦊', '🦉', '👑', '⚡', '🧠'];

  const isCustomImage = (val) => {
    return (
      typeof val === 'string' &&
      (val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('data:') ||
        val.startsWith('file:') ||
        val.startsWith('blob:') ||
        val.startsWith('ph://'))
    );
  };

  const pickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && permission.status !== 'granted') {
        setErrorMessage('Gallery access is required to pick an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePic(imageUri);
        setPhotoPickerVisible(false);
        if (errorMessage) setErrorMessage('');
      }
    } catch (err) {
      console.log('Image picker error:', err);
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted && permission.status !== 'granted') {
        setErrorMessage('Camera access is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePic(imageUri);
        setPhotoPickerVisible(false);
        if (errorMessage) setErrorMessage('');
      }
    } catch (err) {
      console.log('Camera error:', err);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customImageUrl.trim()) return;
    setProfilePic(customImageUrl.trim());
    setCustomImageUrl('');
    setPhotoPickerVisible(false);
    if (errorMessage) setErrorMessage('');
  };

  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

  const handleRegister = async () => {
    setErrorMessage('');

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in your full name, email address, and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const regResponse = await registerUser({
        fullName,
        email,
        phoneNumber,
        dob,
        gender,
        profilePic,
        password,
      });

      if (!regResponse.success) {
        setErrorMessage(regResponse.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // Automatically log in newly registered CLIENT user to obtain JWT token & session
      const loginRes = await loginUser(email, password);

      if (loginRes.success && loginRes.token) {
        await saveToken(loginRes.token);
        if (loginRes.user) {
          await saveUser(loginRes.user);
        }
        setLoading(false);
        if (onRegisterSuccess) {
          onRegisterSuccess(loginRes.user, loginRes.token);
        }
      } else {
        // Fallback with registered user object
        setLoading(false);
        if (onRegisterSuccess) {
          onRegisterSuccess(regResponse.user);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during registration.');
      setLoading(false);
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
            <ArrowLeft size={18} color="#818CF8" strokeWidth={2.4} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Logo size={32} showText={false} />
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
          {/* Error Message Display */}
          {!!errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Centered Avatar Picker */}
          <View style={styles.centeredAvatarContainer}>
            <Pressable
              onPress={() => setPhotoPickerVisible(true)}
              style={({ pressed }) => [styles.avatarPicker, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
            >
              {isCustomImage(profilePic) ? (
                <Image source={{ uri: profilePic }} style={styles.avatarCustomImg} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarEmoji}>{profilePic}</Text>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={11} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Pressable>
            <Text style={styles.avatarPickerHint}>Tap to choose photo or avatar</Text>
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
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errorMessage) setErrorMessage('');
                  }}
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
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
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
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.gridCol]}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.inputWrapperWithCalendar}>
                <TextInput
                  style={[styles.input, styles.inputFlex, isWeb && styles.webOutlineNone]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94A3B8"
                  value={dob}
                  onChangeText={(text) => {
                    setDob(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
                <Pressable
                  onPress={() => setDatePickerVisible(true)}
                  style={({ pressed }) => [
                    styles.calendarIconBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Calendar size={17} color="#6366F1" strokeWidth={2.2} />
                </Pressable>
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
                {showGenderDropdown ? (
                  <ChevronUp size={14} color="#64748B" strokeWidth={2.4} />
                ) : (
                  <ChevronDown size={14} color="#64748B" strokeWidth={2.4} />
                )}
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
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={({ pressed }) => [styles.eyeButton, isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" strokeWidth={2} />
                  ) : (
                    <Eye size={18} color="#94A3B8" strokeWidth={2} />
                  )}
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
                {agreeTerms && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
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
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryButton,
              loading && styles.buttonDisabled,
              isWeb && styles.webPointer,
              pressed && !loading && styles.buttonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
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

      {/* CHANGE PHOTO MODAL */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.photoPickerCard}>
            <View style={styles.photoPickerHeader}>
              <Text style={styles.photoPickerTitle}>Profile Picture</Text>
              <Pressable
                onPress={() => setPhotoPickerVisible(false)}
                style={({ pressed }) => [isWeb && styles.webPointer, pressed && styles.pressedOpacity]}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>
            <Text style={styles.photoPickerSubtitle}>Upload your own photo or choose an avatar</Text>

            {/* Current Avatar Preview */}
            <View style={styles.photoPickerPreviewContainer}>
              <View style={styles.photoPickerPreviewCircle}>
                {isCustomImage(profilePic) ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarCustomImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarEmojiLarge}>{profilePic}</Text>
                )}
              </View>
            </View>

            {/* Custom Photo Upload Action Buttons */}
            <View style={styles.photoUploadActionsRow}>
              <Pressable
                onPress={pickImageFromGallery}
                style={({ pressed }) => [
                  styles.uploadOptionBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Upload size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.uploadOptionBtnText}>Upload Photo</Text>
              </Pressable>

              <Pressable
                onPress={takePhotoWithCamera}
                style={({ pressed }) => [
                  styles.cameraOptionBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Camera size={15} color="#4F46E5" strokeWidth={2.4} />
                <Text style={styles.cameraOptionBtnText}>Take Photo</Text>
              </Pressable>
            </View>

            {/* Image URL Input */}
            <View style={styles.customUrlContainer}>
              <Text style={styles.customUrlLabel}>Or paste image URL:</Text>
              <View style={styles.customUrlInputRow}>
                <TextInput
                  style={[styles.customUrlInput, isWeb && styles.webOutlineNone]}
                  value={customImageUrl}
                  onChangeText={setCustomImageUrl}
                  placeholder="https://example.com/photo.jpg"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleApplyCustomUrl}
                  style={({ pressed }) => [
                    styles.customUrlApplyBtn,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.customUrlApplyText}>Apply</Text>
                </Pressable>
              </View>
            </View>

            {/* Preset Avatars Divider & Grid */}
            <View style={styles.avatarSectionDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>Or choose preset avatar</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.avatarGrid}>
              {avatarOptions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    setProfilePic(item);
                    setPhotoPickerVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.avatarOptionItem,
                    profilePic === item && styles.avatarOptionItemActive,
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <Text style={styles.avatarOptionEmoji}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setPhotoPickerVisible(false)}
              style={({ pressed }) => [
                styles.photoPickerCloseBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.photoPickerCloseText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* DATE PICKER MODAL */}
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={(dateStr) => {
          setDob(dateStr);
          if (errorMessage) setErrorMessage('');
        }}
        initialDate={dob}
        title="Select Date of Birth"
      />
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
  avatarPickerHint: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  avatarCustomImg: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  inputWrapperWithCalendar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingLeft: 12,
    paddingRight: 6,
    height: 46,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  inputFlex: {
    flex: 1,
  },
  calendarIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  photoPickerCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  photoPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
  },
  photoPickerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  photoPickerSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  photoPickerPreviewContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  photoPickerPreviewCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#818CF8',
    overflow: 'hidden',
  },
  avatarEmojiLarge: {
    fontSize: 30,
  },
  photoUploadActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  uploadOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadOptionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cameraOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cameraOptionBtnText: {
    color: '#4F46E5',
    fontSize: 12.5,
    fontWeight: '700',
  },
  customUrlContainer: {
    width: '100%',
    marginBottom: 12,
  },
  customUrlLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 6,
  },
  customUrlInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  customUrlInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  customUrlApplyBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customUrlApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarSectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  avatarOptionItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  avatarOptionEmoji: {
    fontSize: 20,
  },
  photoPickerCloseBtn: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerCloseText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
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
  buttonDisabled: { opacity: 0.7 },
  pressedOpacity: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
