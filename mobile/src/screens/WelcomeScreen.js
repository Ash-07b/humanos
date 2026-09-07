import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  View,
  ScrollView,
  Platform,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  HeartPulse,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import Logo from '../components/Logo';

const focusItems = [
  { icon: Clock, label: 'Focus', value: 'Deep Work' },
  { icon: HeartPulse, label: 'Wellbeing', value: 'Daily Calm' },
  { icon: TrendingUp, label: 'Growth', value: 'Habit Loops' },
];

export default function WelcomeScreen({ onBegin, onLogin }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const appContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <ImageBackground
        source={require('../../assets/landing-bg.jpg')}
        style={[styles.hero, { minHeight: Math.max(360, height * 0.46) }]}
        imageStyle={styles.heroBackgroundImage}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />

        <View style={styles.topBar}>
          <Logo size={36} textSize={20} textColor="#F8FAFC" />
          <Pressable style={({ pressed }) => [styles.menuButton, isWeb && styles.webPointer, pressed && styles.secondaryPressed]}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, styles.menuLineShort]} />
          </Pressable>
        </View>

        <View style={styles.heroContent}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowPulse} />
            <Text style={styles.eyebrowText}>A MORE INTENTIONAL LIFE</Text>
          </View>
          <Text style={styles.headline}>Make room for{`\n`}what matters.</Text>
          <Text style={styles.heroCopy}>
            A quiet space to shape your days, build kinder habits, and stay close to the person you are becoming.
          </Text>
        </View>

        <View style={styles.heroFooter}>
          <Text style={styles.footerCaption}>YOUR DAY, IN BALANCE</Text>
          <Text style={styles.footerNumber}>24</Text>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.handle} />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.cardKicker}>YOUR DAILY RHYTHM</Text>
              <Text style={styles.cardTitle}>Welcome to Humanos.</Text>
              <Text style={styles.cardSubtitle}>
                A quiet space designed to help you focus, maintain wellbeing, and grow at your own pace.
              </Text>
            </View>
            <View style={styles.welcomeBadge}>
              <Sparkles size={11} color="#4F46E5" strokeWidth={2.4} />
              <Text style={styles.welcomeBadgeText}>START</Text>
            </View>
          </View>

          <View style={styles.focusRow}>
            {focusItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <View style={styles.focusItem} key={item.label}>
                  <View style={styles.focusIconWrap}>
                    <IconComponent size={16} color="#4F46E5" strokeWidth={2.2} />
                  </View>
                  <Text style={styles.focusValue}>{item.value}</Text>
                  <Text style={styles.focusLabel}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={onBegin}
          style={({ pressed }) => [styles.primaryButton, isWeb && styles.webPointer, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Begin your day</Text>
          <View style={styles.arrowCircle}>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Pressable>

        <Pressable
          onPress={onLogin}
          style={({ pressed }) => [styles.secondaryButton, isWeb && styles.webPointer, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
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
    minHeight: 360,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
  },
  heroBackgroundImage: {
    opacity: 0.75,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 26, 0.45)',
  },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  menuButton: { gap: 5, padding: 8 },
  menuLine: { backgroundColor: '#F8FAFC', borderRadius: 2, height: 2, width: 22 },
  menuLineShort: { alignSelf: 'flex-end', width: 13 },
  heroContent: { marginTop: 44, maxWidth: 330 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 16 },
  eyebrowPulse: { backgroundColor: '#818CF8', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headline: { color: '#F8FAFC', fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 45 },
  heroCopy: { color: '#CBD5E1', fontSize: 13.5, lineHeight: 20, marginTop: 14, maxWidth: 310 },
  heroFooter: { alignItems: 'flex-end', bottom: 17, flexDirection: 'row', justifyContent: 'space-between', left: 24, position: 'absolute', right: 24 },
  footerCaption: { color: '#94A3B8', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  footerNumber: { color: '#818CF8', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  content: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, flex: 1, marginTop: -24, paddingHorizontal: 24, paddingTop: 13, paddingBottom: 28 },
  handle: { alignSelf: 'center', backgroundColor: '#CBD5E1', borderRadius: 3, height: 4, marginBottom: 20, width: 38 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 22, borderWidth: 1, padding: 18, shadowColor: '#0F172A', shadowOffset: { height: 6, width: 0 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 3 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  cardKicker: { color: '#6366F1', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  cardSubtitle: { color: '#475569', fontSize: 12, lineHeight: 18, marginTop: 6 },
  welcomeBadge: { backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: '#C7D2FE', flexDirection: 'row', alignItems: 'center', gap: 4 },
  welcomeBadgeText: { color: '#4F46E5', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  focusRow: { borderTopColor: '#F1F5F9', borderTopWidth: 1, flexDirection: 'row', marginTop: 16, paddingTop: 14 },
  focusItem: { flex: 1 },
  focusIconWrap: { marginBottom: 5 },
  focusValue: { color: '#0F172A', fontSize: 13.5, fontWeight: '700' },
  focusLabel: { color: '#64748B', fontSize: 10.5, marginTop: 3, fontWeight: '500' },
  primaryButton: { alignItems: 'center', backgroundColor: '#4F46E5', borderRadius: 17, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingBottom: 14, paddingLeft: 20, paddingRight: 12, paddingTop: 14, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  arrowCircle: { alignItems: 'center', backgroundColor: '#6366F1', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  secondaryButton: { alignItems: 'center', paddingVertical: 14 },
  secondaryButtonText: { color: '#4F46E5', fontSize: 13, fontWeight: '700' },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  secondaryPressed: { opacity: 0.6 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
