import { SafeAreaView, StatusBar, StyleSheet, Text, Pressable, View } from 'react-native';

const focusItems = [
  { icon: '◔', label: 'Focus', value: '3h 20m' },
  { icon: '♡', label: 'Wellbeing', value: 'Good' },
  { icon: '↗', label: 'Growth', value: '+12%' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.hero}>
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <View style={[styles.brandDot, styles.brandDotOffset]} />
          </View>
          <Text style={styles.brand}>humanos</Text>
          <View style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, styles.menuLineShort]} />
          </View>
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

        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
        <View style={styles.heroFooter}>
          <Text style={styles.footerCaption}>YOUR DAY, IN BALANCE</Text>
          <Text style={styles.footerNumber}>24</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.handle} />
        <Text style={styles.sectionLabel}>A gentle dashboard for your life</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardKicker}>TODAY’S RHYTHM</Text>
              <Text style={styles.cardTitle}>Good morning, Ash.</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Your daily intention</Text>
            <Text style={styles.progressValue}>68%</Text>
          </View>

          <View style={styles.focusRow}>
            {focusItems.map((item) => (
              <View style={styles.focusItem} key={item.label}>
                <Text style={styles.focusIcon}>{item.icon}</Text>
                <Text style={styles.focusValue}>{item.value}</Text>
                <Text style={styles.focusLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.primaryButtonText}>Begin your day</Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#102821' },
  hero: {
    height: '49%',
    minHeight: 360,
    overflow: 'hidden',
    backgroundColor: '#102821',
    paddingHorizontal: 24,
  },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  brandMark: { height: 25, justifyContent: 'center', width: 28 },
  brandDot: { backgroundColor: '#d9f99d', borderRadius: 8, height: 13, width: 13 },
  brandDotOffset: { alignSelf: 'flex-end', backgroundColor: '#89b39e', marginTop: -5 },
  brand: { color: '#f5f4ed', flex: 1, fontSize: 19, fontWeight: '700', letterSpacing: -0.5, marginLeft: 8 },
  menuButton: { gap: 5, padding: 8 },
  menuLine: { backgroundColor: '#f5f4ed', borderRadius: 2, height: 2, width: 22 },
  menuLineShort: { alignSelf: 'flex-end', width: 13 },
  heroContent: { marginTop: 58, maxWidth: 330 },
  eyebrow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 17 },
  eyebrowPulse: { backgroundColor: '#c7f36d', borderRadius: 5, height: 7, width: 7 },
  eyebrowText: { color: '#b9cabe', fontSize: 10, fontWeight: '700', letterSpacing: 1.45 },
  headline: { color: '#f6f5ed', fontSize: 42, fontWeight: '700', letterSpacing: -1.8, lineHeight: 46 },
  heroCopy: { color: '#c0d1c7', fontSize: 14, lineHeight: 21, marginTop: 17, maxWidth: 310 },
  orbLarge: { backgroundColor: '#315a49', borderRadius: 180, height: 270, opacity: 0.66, position: 'absolute', right: -122, top: 162, width: 270 },
  orbSmall: { backgroundColor: '#b8d770', borderRadius: 50, bottom: 34, height: 18, opacity: 0.9, position: 'absolute', right: 57, width: 18 },
  heroFooter: { alignItems: 'flex-end', bottom: 17, flexDirection: 'row', justifyContent: 'space-between', left: 24, position: 'absolute', right: 24 },
  footerCaption: { color: '#96aa9d', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  footerNumber: { color: '#d8e7dc', fontSize: 25, fontWeight: '200', letterSpacing: -1 },
  content: { backgroundColor: '#f6f4ec', borderTopLeftRadius: 30, borderTopRightRadius: 30, flex: 1, marginTop: -24, paddingHorizontal: 24, paddingTop: 13 },
  handle: { alignSelf: 'center', backgroundColor: '#d2d5cd', borderRadius: 3, height: 4, marginBottom: 20, width: 38 },
  sectionLabel: { color: '#667269', fontSize: 13, marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderColor: '#e8e9e2', borderRadius: 22, borderWidth: 1, padding: 18, shadowColor: '#34443b', shadowOffset: { height: 8, width: 0 }, shadowOpacity: 0.08, shadowRadius: 18 },
  cardHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  cardKicker: { color: '#7b897f', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cardTitle: { color: '#17342a', fontSize: 19, fontWeight: '700', letterSpacing: -0.5, marginTop: 5 },
  avatar: { alignItems: 'center', backgroundColor: '#dcebc9', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  avatarText: { color: '#31573e', fontSize: 14, fontWeight: '700' },
  progressTrack: { backgroundColor: '#ebeee8', borderRadius: 4, height: 7, marginTop: 22, overflow: 'hidden' },
  progressFill: { backgroundColor: '#436e50', borderRadius: 4, height: '100%', width: '68%' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  progressText: { color: '#758077', fontSize: 11 },
  progressValue: { color: '#31573e', fontSize: 11, fontWeight: '700' },
  focusRow: { borderTopColor: '#edf0eb', borderTopWidth: 1, flexDirection: 'row', marginTop: 18, paddingTop: 15 },
  focusItem: { flex: 1 },
  focusIcon: { color: '#79946a', fontSize: 15, marginBottom: 5 },
  focusValue: { color: '#203b30', fontSize: 14, fontWeight: '700' },
  focusLabel: { color: '#879087', fontSize: 10, marginTop: 3 },
  primaryButton: { alignItems: 'center', backgroundColor: '#183d30', borderRadius: 17, flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingBottom: 12, paddingLeft: 20, paddingRight: 12, paddingTop: 12 },
  primaryButtonText: { color: '#f5f4ed', fontSize: 15, fontWeight: '700' },
  arrowCircle: { alignItems: 'center', backgroundColor: '#d6ef90', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  arrow: { color: '#1c412f', fontSize: 19, fontWeight: '700', marginTop: -2 },
  secondaryButton: { alignItems: 'center', paddingVertical: 13 },
  secondaryButtonText: { color: '#4b6557', fontSize: 13, fontWeight: '600' },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  secondaryPressed: { opacity: 0.6 },
});
