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
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HeartPulse,
  Activity,
  Scale,
  Thermometer,
  Wind,
  ClipboardList,
  Pill,
  Moon,
  Zap,
  Droplets,
  Sparkles,
  Plus,
  Check,
  X,
  Clock,
  Trash2,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchAiHealthRecommendation,
  fetchAiHealthRecommendations,
  fetchHealthRecords,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  fetchMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from '../../services/api';
import { getToken } from '../../services/storage';

export default function HealthScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();

  // Active Tab
  const [activeTab, setActiveTab] = useState('health');
  const [refreshing, setRefreshing] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Modals & Editing State
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'record'|'med', id, name }

  // AI Recommendation State (dynamically bound to database user)
  const [aiLoading, setAiLoading] = useState(false);
  const [currentAiRecommendation, setCurrentAiRecommendation] = useState(
    user?.currentAiRecommendation ||
    'Add your daily health readings to receive personalized biometric recovery recommendations.'
  );
  const [aiHistory, setAiHistory] = useState(user?.aiHistory || []);
  const [showAllAiHistory, setShowAllAiHistory] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  // Health Records & Medications State (dynamically bound to database user)
  const [records, setRecords] = useState(user?.healthRecords || user?.records || []);
  const [medications, setMedications] = useState(user?.medications || []);

  // Fetch health data & AI history from backend API
  const loadHealthDataFromApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [recRes, medRes, aiRes] = await Promise.all([
        fetchHealthRecords({}, token),
        fetchMedications({}, token),
        fetchAiHealthRecommendations(token),
      ]);
      if (recRes && recRes.success && Array.isArray(recRes.records)) {
        setRecords(recRes.records);
      }
      if (medRes && medRes.success && Array.isArray(medRes.medications)) {
        setMedications(medRes.medications);
      }
      if (aiRes && aiRes.success && Array.isArray(aiRes.history)) {
        setAiHistory(aiRes.history);
        if (aiRes.history.length > 0 && aiRes.history[0].text) {
          setCurrentAiRecommendation(aiRes.history[0].text);
        }
      }
    } catch (e) {
      console.log('Error fetching health telemetry & AI history from API:', e);
    }
  };

  // Load health data on mount
  React.useEffect(() => {
    loadHealthDataFromApi();
  }, []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user) {
      if (user.currentAiRecommendation) {
        setCurrentAiRecommendation(user.currentAiRecommendation);
      }
      if (user.aiHistory) {
        setAiHistory(user.aiHistory || []);
      }
      if ((user.healthRecords || user.records) && records.length === 0) {
        setRecords(user.healthRecords || user.records || []);
      }
      if (user.medications && medications.length === 0) {
        setMedications(user.medications || []);
      }
    }
  }, [user]);

  // Form State for Health Record
  const [recordType, setRecordType] = useState('Heart Rate');
  const [recordValue, setRecordValue] = useState('');
  const [recordUnit, setRecordUnit] = useState('bpm');
  const [recordDate, setRecordDate] = useState('Today');
  const [recordTime, setRecordTime] = useState('09:00 AM');
  const [recordNotes, setRecordNotes] = useState('');

  // Form State for Medication
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Once daily');
  const [medStartDate, setMedStartDate] = useState('Today');
  const [medEndDate, setMedEndDate] = useState('Ongoing');
  const [medReminderTime, setMedReminderTime] = useState('08:00 AM');
  const [medInstructions, setMedInstructions] = useState('');

  const recordTypes = [
    { type: 'Heart Rate', icon: HeartPulse, defaultUnit: 'bpm', iconBg: '#FFE4E6', iconColor: '#E11D48' },
    { type: 'Blood Pressure', icon: Activity, defaultUnit: 'mmHg', iconBg: '#E0F2FE', iconColor: '#0284C7' },
    { type: 'Weight', icon: Scale, defaultUnit: 'kg', iconBg: '#CCFBF1', iconColor: '#0F766E' },
    { type: 'Temperature', icon: Thermometer, defaultUnit: '°C', iconBg: '#FEF3C7', iconColor: '#D97706' },
    { type: 'Blood Oxygen', icon: Wind, defaultUnit: '% SpO2', iconBg: '#F0FDFA', iconColor: '#0D9488' },
    { type: 'Other', icon: ClipboardList, defaultUnit: 'units', iconBg: '#F1F5F9', iconColor: '#475569' },
  ];

  const getRecordIconComponent = (type) => {
    const matched = recordTypes.find((r) => r.type === type);
    return matched ? matched.icon : Activity;
  };

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Weekly',
    'As needed',
  ];

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage('');
    }, 2800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHealthDataFromApi();
      showNotice('Health telemetry synced');
    } catch (e) {
      console.log('Error refreshing health data:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) {
      onNavigateTab(tabId);
    } else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'goals') navigation.navigate('Goals');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  // Record Modal Open (Create or Edit)
  const handleOpenRecordModal = (type = 'Heart Rate', recordToEdit = null) => {
    if (recordToEdit) {
      setEditingRecord(recordToEdit);
      const selected = recordTypes.find((r) => r.type === recordToEdit.type) || recordTypes[0];
      setRecordType(recordToEdit.type || selected.type);
      setRecordUnit(recordToEdit.unit || selected.defaultUnit);
      setRecordValue(recordToEdit.value || '');
      setRecordDate(recordToEdit.date || 'Today');
      setRecordTime(recordToEdit.time || '09:00 AM');
      setRecordNotes(recordToEdit.notes || '');
    } else {
      setEditingRecord(null);
      const selected = recordTypes.find((r) => r.type === type) || recordTypes[0];
      setRecordType(selected.type);
      setRecordUnit(selected.defaultUnit);
      setRecordValue('');
      setRecordDate('Today');
      setRecordTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setRecordNotes('');
    }
    setRecordModalVisible(true);
  };

  // Save or Update Record
  const handleSaveRecord = async () => {
    if (!recordValue.trim()) {
      showNotice('Please enter a measurement value');
      return;
    }

    const payload = {
      type: recordType,
      value: recordValue.trim(),
      unit: recordUnit.trim() || 'units',
      date: recordDate.trim() || 'Today',
      time: recordTime.trim() || '09:00 AM',
      dateTime: `${recordDate.trim() || 'Today'} • ${recordTime.trim() || '09:00 AM'}`,
      notes: recordNotes.trim() || 'Logged via Health Center',
    };

    try {
      const token = await getToken();
      if (editingRecord) {
        const idToUpdate = editingRecord.id || editingRecord._id;
        setRecords((prev) =>
          prev.map((r) => ((r.id === idToUpdate || r._id === idToUpdate) ? { ...r, ...payload } : r))
        );
        showNotice(`${recordType} record updated`);

        if (token) {
          const res = await updateHealthRecord(idToUpdate, payload, token);
          if (res && res.success && res.record) {
            setRecords((prev) =>
              prev.map((r) => ((r.id === idToUpdate || r._id === idToUpdate) ? res.record : r))
            );
          }
        }
      } else {
        const tempRecord = {
          id: Date.now().toString(),
          ...payload,
        };
        setRecords((prev) => [tempRecord, ...prev]);
        showNotice(`${recordType} record saved`);

        if (token) {
          const res = await createHealthRecord(payload, token);
          if (res && res.success && res.record) {
            setRecords((prev) =>
              prev.map((r) => (r.id === tempRecord.id ? res.record : r))
            );
          }
        }
      }
    } catch (e) {
      console.log('Error saving health record:', e);
      showNotice('Saved record locally');
    }

    setRecordModalVisible(false);
    setEditingRecord(null);
  };

  // Medication Modal Open (Create or Edit)
  const handleOpenMedicationModal = (medToEdit = null) => {
    if (medToEdit) {
      setEditingMedication(medToEdit);
      setMedName(medToEdit.name || '');
      setMedDosage(medToEdit.dosage || '');
      setMedFrequency(medToEdit.frequency || 'Once daily');
      setMedStartDate(medToEdit.startDate || 'Today');
      setMedEndDate(medToEdit.endDate || 'Ongoing');
      setMedReminderTime(medToEdit.reminderTime || '08:00 AM');
      setMedInstructions(medToEdit.instructions || '');
    } else {
      setEditingMedication(null);
      setMedName('');
      setMedDosage('');
      setMedFrequency('Once daily');
      setMedStartDate('Today');
      setMedEndDate('Ongoing');
      setMedReminderTime('08:00 AM');
      setMedInstructions('');
    }
    setMedicationModalVisible(true);
  };

  // Save or Update Medication
  const handleSaveMedication = async () => {
    if (!medName.trim() || !medDosage.trim()) {
      showNotice('Please provide medication name and dosage');
      return;
    }

    const payload = {
      name: medName.trim(),
      dosage: medDosage.trim(),
      frequency: medFrequency,
      startDate: medStartDate.trim() || 'Today',
      endDate: medEndDate.trim() || 'Ongoing',
      reminderTime: medReminderTime.trim() || '08:00 AM',
      status: 'Active',
      instructions: medInstructions.trim() || 'Take as prescribed',
    };

    try {
      const token = await getToken();
      if (editingMedication) {
        const idToUpdate = editingMedication.id || editingMedication._id;
        setMedications((prev) =>
          prev.map((m) => ((m.id === idToUpdate || m._id === idToUpdate) ? { ...m, ...payload } : m))
        );
        showNotice(`Updated ${medName.trim()}`);

        if (token) {
          const res = await updateMedication(idToUpdate, payload, token);
          if (res && res.success && res.medication) {
            setMedications((prev) =>
              prev.map((m) => ((m.id === idToUpdate || m._id === idToUpdate) ? res.medication : m))
            );
          }
        }
      } else {
        const tempMed = {
          id: Date.now().toString(),
          ...payload,
        };
        setMedications((prev) => [tempMed, ...prev]);
        showNotice(`Added ${medName.trim()}`);

        if (token) {
          const res = await createMedication(payload, token);
          if (res && res.success && res.medication) {
            setMedications((prev) =>
              prev.map((m) => (m.id === tempMed.id ? res.medication : m))
            );
          }
        }
      }
    } catch (e) {
      console.log('Error saving medication:', e);
      showNotice(`Added ${medName.trim()}`);
    }

    setMedicationModalVisible(false);
    setEditingMedication(null);
  };

  // Deletion logic
  const confirmDelete = (type, id, name) => {
    setItemToDelete({ type, id, name });
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;

    if (type === 'record') {
      setRecords((prev) => prev.filter((r) => (r.id !== id && r._id !== id)));
      showNotice('Health record removed');
      try {
        const token = await getToken();
        if (token) await deleteHealthRecord(id, token);
      } catch (e) {
        console.log('Error deleting record on server:', e);
      }
    } else if (type === 'med') {
      setMedications((prev) => prev.filter((m) => (m.id !== id && m._id !== id)));
      showNotice('Medication removed');
      try {
        const token = await getToken();
        if (token) await deleteMedication(id, token);
      } catch (e) {
        console.log('Error deleting medication on server:', e);
      }
    }
    setDeleteModalVisible(false);
    setItemToDelete(null);
  };

  // Live AI Health Insights via Ollama / Telemetry
  const handleGenerateAiRecommendation = async () => {
    setAiLoading(true);
    try {
      const heartRateRecord = records.find((r) => r.type === 'Heart Rate');
      const sleepRecord = records.find((r) => r.type === 'Sleep');
      const bpRecord = records.find((r) => r.type === 'Blood Pressure');
      const stepRecord = records.find((r) => r.type === 'Steps');

      const telemetry = {
        heartRate: heartRateRecord ? `${heartRateRecord.value} ${heartRateRecord.unit || 'bpm'}` : '72 bpm',
        sleep: sleepRecord ? `${sleepRecord.value}` : (user?.sleepDuration || '7.5h'),
        bloodPressure: bpRecord ? `${bpRecord.value}` : '120/80 mmHg',
        steps: stepRecord ? `${stepRecord.value}` : '8,420',
        medications: medications.map((m) => m.name),
      };

      const token = await getToken();
      const res = await fetchAiHealthRecommendation(telemetry, token);

      if (res && res.success && res.recommendation) {
        setCurrentAiRecommendation(res.recommendation);
        if (res.history && Array.isArray(res.history)) {
          setAiHistory(res.history);
        } else {
          setAiHistory((prev) => [
            {
              id: Date.now().toString(),
              text: res.recommendation,
              date: 'Just now',
            },
            ...prev,
          ]);
        }
        showNotice(res.source && res.source.startsWith('ollama') ? 'AI Insight generated by Ollama' : 'AI Health recommendation generated');
      } else {
        throw new Error(res?.message || 'Empty response');
      }
    } catch (err) {
      console.log('Using local fallback AI insight:', err.message);
      const suggestions = [
        'Your cardiovascular rhythm is stable at 72 bpm. Adding 10 minutes of zone 2 aerobic recovery can further enhance morning focus.',
        'Hydration levels have steadily supported metabolic equilibrium. Maintain your consistent 8-glass daily water baseline.',
        'Sleep consistency is strong at 7h 30m. Consider keeping screen-free winding hours 45 minutes before bedtime.',
        'Blood pressure readings (120/80 mmHg) remain right in the optimal range. Keep up your current nutritional and physical routines.',
      ];
      const fallbackPicked = suggestions[Math.floor(Math.random() * suggestions.length)];
      setCurrentAiRecommendation(fallbackPicked);
      setAiHistory((prev) => [
        {
          id: Date.now().toString(),
          text: fallbackPicked,
          date: 'Just now',
        },
        ...prev,
      ]);
      showNotice('AI health recommendation updated');
    } finally {
      setAiLoading(false);
    }
  };

  const displayedRecords = showAllRecords ? records : records.slice(0, 4);
  const displayedAiHistory = showAllAiHistory ? aiHistory : aiHistory.slice(0, 2);

  const appContent = (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
      {/* Toast Notice */}
      {!!noticeMessage && (
        <View style={styles.noticeToast}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
          <Text style={styles.noticeText}>{noticeMessage}</Text>
        </View>
      )}

      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: theme.colors.appBg }]}
        contentContainerStyle={[styles.scrollContentContainer, { backgroundColor: theme.colors.pageBg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14B8A6"
            colors={['#0D9488', '#14B8A6']}
          />
        }
      >
        {/* ==================== 1. HEADER ==================== */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerKicker}>VITALITY & WELLNESS</Text>
              <Text style={styles.headerTitle}>Health</Text>
              <Text style={styles.headerSubtitle}>
                Take care of yourself, one day at a time.
              </Text>
            </View>

            <View style={styles.headerActionBtn}>
              <View style={[styles.pulseIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#14B8A6' : '#99F6E4' }]}>
                <HeartPulse size={20} color="#E11D48" strokeWidth={2.2} />
              </View>
            </View>
          </View>

          {/* Ambient Botanical & Cyan Glow Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== 2. MAIN SHEET ==================== */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* ==================== 2. HEALTH OVERVIEW ==================== */}
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.overviewTopRow}>
              <View>
                <Text style={styles.overviewKicker}>HEALTH STATUS</Text>
                <Text style={[styles.overviewTitle, { color: theme.colors.textPrimary }]}>Your Wellbeing</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Good</Text>
              </View>
            </View>

            <Text style={[styles.overviewMessage, { color: theme.colors.textSecondary }]}>
              Keep maintaining your healthy routines.
            </Text>

            {/* 3 Summary indicators */}
            <View style={styles.indicatorsRow}>
              <View style={[styles.indicatorCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <View style={[styles.indicatorIconWrap, { backgroundColor: '#FFE4E6' }]}>
                  <HeartPulse size={18} color="#E11D48" strokeWidth={2.2} />
                </View>
                <Text style={[styles.indicatorValue, { color: theme.colors.textPrimary }]}>
                  {records.find((r) => r.type === 'Heart Rate')?.value
                    ? `${records.find((r) => r.type === 'Heart Rate').value} ${records.find((r) => r.type === 'Heart Rate').unit || 'bpm'}`
                    : '-- bpm'}
                </Text>
                <Text style={[styles.indicatorLabel, { color: theme.colors.textMuted }]}>Heart Rate</Text>
              </View>

              <View style={[styles.indicatorCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <View style={[styles.indicatorIconWrap, { backgroundColor: '#EEF2FF' }]}>
                  <Moon size={18} color="#4F46E5" strokeWidth={2.2} />
                </View>
                <Text style={[styles.indicatorValue, { color: theme.colors.textPrimary }]}>
                  {user?.sleepDuration || records.find((r) => r.type === 'Sleep')?.value || '--'}
                </Text>
                <Text style={[styles.indicatorLabel, { color: theme.colors.textMuted }]}>Sleep</Text>
              </View>

              <View style={[styles.indicatorCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <View style={[styles.indicatorIconWrap, { backgroundColor: '#CCFBF1' }]}>
                  <Scale size={18} color="#0F766E" strokeWidth={2.2} />
                </View>
                <Text style={[styles.indicatorValue, { color: theme.colors.textPrimary }]}>
                  {records.find((r) => r.type === 'Weight')?.value
                    ? `${records.find((r) => r.type === 'Weight').value} ${records.find((r) => r.type === 'Weight').unit || 'kg'}`
                    : '-- kg'}
                </Text>
                <Text style={[styles.indicatorLabel, { color: theme.colors.textMuted }]}>Weight</Text>
              </View>
            </View>
          </View>

          {/* ==================== 3. HEALTH QUICK ACTIONS ==================== */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionSubTitle}>IMMEDIATE LOGGING</Text>
              <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Quick Actions</Text>
            </View>

            <View style={styles.quickActionsGrid}>
              <Pressable
                onPress={() => handleOpenRecordModal('Heart Rate')}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedCard,
                ]}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: '#CCFBF1' }]}>
                  <Plus size={18} color="#0D9488" strokeWidth={2.5} />
                </View>
                <View style={styles.quickActionTextCol}>
                  <Text style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>Add Health Record</Text>
                  <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
                    Record a new health measurement
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleOpenMedicationModal}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedCard,
                ]}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                  <Pill size={18} color="#D97706" strokeWidth={2.2} />
                </View>
                <View style={styles.quickActionTextCol}>
                  <Text style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>Add Medication</Text>
                  <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
                    Manage your medications
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleGenerateAiRecommendation}
                style={({ pressed }) => [
                  styles.quickActionCard,
                  styles.quickActionAiCard,
                  { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedCard,
                ]}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
                  <Sparkles size={18} color="#059669" strokeWidth={2.2} />
                </View>
                <View style={styles.quickActionTextCol}>
                  <Text style={[styles.quickActionTitle, { color: theme.colors.textPrimary }]}>
                    AI Health Recommendation
                  </Text>
                  <Text style={[styles.quickActionSub, { color: theme.colors.textSecondary }]}>
                    Get personalized health insights
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* ==================== 8. AI HEALTH RECOMMENDATION ==================== */}
          <View style={[styles.aiHeroCard, { backgroundColor: theme.colors.cardBg, borderColor: isDarkMode ? 'rgba(20, 184, 166, 0.35)' : theme.colors.border, shadowColor: theme.colors.shadowColor }]}>
            <View style={styles.aiHeaderRow}>
              <View style={[styles.aiBadge, { backgroundColor: isDarkMode ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1', borderColor: isDarkMode ? 'rgba(20, 184, 166, 0.4)' : '#99F6E4' }]}>
                <Sparkles size={12} color={isDarkMode ? '#5EEAD4' : '#0F766E'} strokeWidth={2.2} />
                <Text style={[styles.aiBadgeText, { color: isDarkMode ? '#5EEAD4' : '#0F766E' }]}>INTELLIGENT VITALITY</Text>
              </View>
            </View>

            <Text style={[styles.aiTitle, { color: theme.colors.textPrimary }]}>AI Health Recommendation</Text>
            <Text style={[styles.aiSubtitle, { color: theme.colors.textSecondary }]}>
              Get personalized insights based on your health information.
            </Text>

            {/* Recommendation Result Box */}
            <View style={[styles.aiResultBox, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
              {aiLoading ? (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator color="#14B8A6" size="small" />
                  <Text style={[styles.aiLoadingText, { color: isDarkMode ? '#5EEAD4' : '#0D9488' }]}>
                    Analyzing your health information...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.aiResultText, { color: theme.colors.textPrimary }]}>
                  "{currentAiRecommendation}"
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleGenerateAiRecommendation}
              disabled={aiLoading}
              style={({ pressed }) => [
                styles.aiActionBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={styles.aiActionBtnText}>
                {aiLoading ? 'Synthesizing...' : 'Get Recommendation'}
              </Text>
            </Pressable>
          </View>

          {/* ==================== 9. AI RECOMMENDATION HISTORY ==================== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, shadowColor: theme.colors.shadowColor }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>INSIGHT HISTORY</Text>
                <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Recent AI Insights</Text>
              </View>
            </View>

            <View style={styles.aiHistoryList}>
              {displayedAiHistory.map((item) => (
                <View key={item.id} style={[styles.aiHistoryCard, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                  <Text style={styles.aiHistoryQuoteIcon}>“</Text>
                  <View style={styles.aiHistoryBody}>
                    <Text style={[styles.aiHistoryText, { color: theme.colors.textPrimary }]}>{item.text}</Text>
                    <Text style={[styles.aiHistoryDate, { color: theme.colors.textMuted }]}>{item.date}</Text>
                  </View>
                </View>
              ))}
            </View>

            {aiHistory.length > 2 && (
              <Pressable
                onPress={() => setShowAllAiHistory(!showAllAiHistory)}
                style={styles.viewMoreRowBtn}
              >
                <Text style={styles.viewMoreRowText}>
                  {showAllAiHistory
                    ? 'Show Less Insights ↑'
                    : 'View All Insights →'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* ==================== 4. HEALTH RECORDS ==================== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, shadowColor: theme.colors.shadowColor }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>TELEMETRY STREAM</Text>
                <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Recent Health Records</Text>
              </View>
              <Pressable
                onPress={() => handleOpenRecordModal('Heart Rate')}
                style={({ pressed }) => [
                  styles.headerAddPill,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.headerAddPillText}>+ Add</Text>
              </Pressable>
            </View>

            {/* Records List or Empty State */}
            {records.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <Activity size={36} color="#94A3B8" strokeWidth={1.5} />
                <Text style={[styles.emptyStateHeading, { color: theme.colors.textPrimary }]}>
                  No health records yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Start tracking your health to understand your wellbeing better.
                </Text>
                <Pressable
                  onPress={() => handleOpenRecordModal('Heart Rate')}
                  style={styles.emptyStateBtn}
                >
                  <Text style={styles.emptyStateBtnText}>Add Health Record</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {displayedRecords.map((item) => {
                  const matched = recordTypes.find((r) => r.type === item.type);
                  const iconBg = matched ? (isDarkMode ? 'rgba(99, 102, 241, 0.2)' : matched.iconBg) : (isDarkMode ? '#1E293B' : '#F1F5F9');
                  const iconColor = matched ? matched.iconColor : '#818CF8';
                  const IconComp = getRecordIconComponent(item.type);

                  return (
                    <Pressable
                      key={item.id || item._id}
                      onPress={() => handleOpenRecordModal(item.type, item)}
                      style={({ pressed }) => [
                        styles.recordCard,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <View style={[styles.recordIconBox, { backgroundColor: iconBg }]}>
                        <IconComp size={18} color={iconColor} strokeWidth={2.2} />
                      </View>

                      <View style={styles.recordContentCol}>
                        <Text style={[styles.recordTypeTitle, { color: theme.colors.textPrimary }]}>{item.type}</Text>
                        <View style={styles.recordValueRow}>
                          <Text style={[styles.recordValueText, { color: theme.colors.textPrimary }]}>{item.value}</Text>
                          <Text style={[styles.recordUnitText, { color: theme.colors.textMuted }]}>{item.unit}</Text>
                        </View>
                        <Text style={[styles.recordDateText, { color: theme.colors.textMuted }]}>{item.dateTime}</Text>
                      </View>

                      <Pressable
                        onPress={() => confirmDelete('record', item.id || item._id, item.type)}
                        style={styles.recordDeleteBtn}
                        hitSlop={8}
                      >
                        <X size={14} color="#94A3B8" strokeWidth={2.2} />
                      </Pressable>
                    </Pressable>
                  );
                })}

                {records.length > 4 && (
                  <Pressable
                    onPress={() => setShowAllRecords(!showAllRecords)}
                    style={styles.viewMoreRowBtn}
                  >
                    <Text style={styles.viewMoreRowText}>
                      {showAllRecords
                        ? 'Show Fewer Records ↑'
                        : 'View All Records →'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* ==================== 6. MEDICATION SECTION ==================== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, shadowColor: theme.colors.shadowColor }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>DAILY REGIMEN</Text>
                <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Medications</Text>
              </View>
              <Pressable
                onPress={() => handleOpenMedicationModal()}
                style={({ pressed }) => [
                  styles.headerAddPill,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.headerAddPillText}>+ Add Medication</Text>
              </Pressable>
            </View>

            {/* Medication List or Empty State */}
            {medications.length === 0 ? (
              <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                <Pill size={36} color="#94A3B8" strokeWidth={1.5} />
                <Text style={[styles.emptyStateHeading, { color: theme.colors.textPrimary }]}>No medications added</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Add your medications to keep track of your routine.
                </Text>
                <Pressable
                  onPress={() => handleOpenMedicationModal()}
                  style={styles.emptyStateBtn}
                >
                  <Text style={styles.emptyStateBtnText}>Add Medication</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.medicationsList}>
                {medications.map((med) => (
                  <Pressable
                    key={med.id || med._id}
                    onPress={() => handleOpenMedicationModal(med)}
                    style={({ pressed }) => [
                      styles.medicationCard,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <View style={styles.medTopRow}>
                      <View style={styles.medNameCol}>
                        <Text style={[styles.medNameText, { color: theme.colors.textPrimary }]}>{med.name}</Text>
                        <Text style={[styles.medDosageText, { color: theme.colors.textSecondary }]}>
                          {med.dosage} • {med.frequency}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => confirmDelete('med', med.id || med._id, med.name)}
                        style={styles.recordDeleteBtn}
                        hitSlop={8}
                      >
                        <X size={14} color="#94A3B8" strokeWidth={2.2} />
                      </Pressable>
                    </View>

                    <View style={styles.medFooterRow}>
                      <View style={[styles.medTimeBadge, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
                        <Clock size={11} color="#6366F1" strokeWidth={2.2} />
                        <Text style={[styles.medTimeText, { color: isDarkMode ? '#C7D2FE' : '#4F46E5' }]}>
                          {med.reminderTime}
                        </Text>
                      </View>
                      <Text style={[styles.medInstructionsText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {med.instructions}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* ==================== 10. HEALTH PROGRESS / TRENDS ==================== */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border, shadowColor: theme.colors.shadowColor }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionSubTitle}>BIOMETRIC CONSISTENCY</Text>
                <Text style={[styles.sectionMainTitle, { color: theme.colors.textPrimary }]}>Health Trends</Text>
              </View>
            </View>

            {(() => {
              const sleepHours = user?.healthTrends?.sleepHours ?? user?.sleepHours ?? 0;
              const sleepTarget = user?.healthTrends?.sleepTarget ?? 8;
              const sleepPercent = sleepHours > 0 ? Math.min(100, Math.round((sleepHours / sleepTarget) * 100)) : 0;

              const activityPercent = user?.healthTrends?.activityPercent ?? user?.activityScore ?? 0;

              const waterGlasses = user?.healthTrends?.waterGlasses ?? user?.waterGlasses ?? 0;
              const waterTarget = user?.healthTrends?.waterTarget ?? 8;
              const waterPercent = waterGlasses > 0 ? Math.min(100, Math.round((waterGlasses / waterTarget) * 100)) : 0;

              return (
                <View style={styles.trendsList}>
                  {/* Sleep */}
                  <View style={[styles.trendItem, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <View style={styles.trendHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Moon size={14} color="#4F46E5" strokeWidth={2.2} />
                        <Text style={[styles.trendLabel, { color: theme.colors.textPrimary }]}>Sleep Duration</Text>
                      </View>
                      <Text style={[styles.trendValue, { color: '#4F46E5' }]}>
                        {sleepHours > 0 ? `${sleepHours}h / ${sleepTarget}h` : '-- / 8h'}
                      </Text>
                    </View>
                    <View style={[styles.trendTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            width: `${Math.max(sleepPercent > 0 ? 5 : 0, sleepPercent)}%`,
                            backgroundColor: '#6366F1',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Activity */}
                  <View style={[styles.trendItem, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <View style={styles.trendHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} color="#0D9488" strokeWidth={2.2} />
                        <Text style={[styles.trendLabel, { color: theme.colors.textPrimary }]}>Physical Activity</Text>
                      </View>
                      <Text style={[styles.trendValue, { color: '#0D9488' }]}>
                        {activityPercent > 0 ? `${activityPercent}% target` : '--% target'}
                      </Text>
                    </View>
                    <View style={[styles.trendTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#CCFBF1' }]}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            width: `${Math.max(activityPercent > 0 ? 5 : 0, Math.min(100, activityPercent))}%`,
                            backgroundColor: '#0D9488',
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Water */}
                  <View style={[styles.trendItem, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <View style={styles.trendHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Droplets size={14} color="#0284C7" strokeWidth={2.2} />
                        <Text style={[styles.trendLabel, { color: theme.colors.textPrimary }]}>Hydration Level</Text>
                      </View>
                      <Text style={[styles.trendValue, { color: '#0284C7' }]}>
                        {waterGlasses > 0 ? `${waterGlasses} / ${waterTarget} glasses` : '-- / 8 glasses'}
                      </Text>
                    </View>
                    <View style={[styles.trendTrack, { backgroundColor: isDarkMode ? '#1E293B' : '#E0F2FE' }]}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            width: `${Math.max(waterPercent > 0 ? 5 : 0, waterPercent)}%`,
                            backgroundColor: '#0284C7',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* ==================== 5. ADD / EDIT HEALTH RECORD MODAL ==================== */}
      <Modal
        visible={recordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRecordModalVisible(false);
          setEditingRecord(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>
                  {editingRecord ? 'UPDATE ENTRY' : 'NEW LOG ENTRY'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  {editingRecord ? 'Edit Health Record' : 'Add Health Record'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setRecordModalVisible(false);
                  setEditingRecord(null);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Record Type Chips */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Record Type</Text>
                <View style={styles.chipRow}>
                  {recordTypes.map((rt) => {
                    const ChipIcon = rt.icon;
                    const isSelected = recordType === rt.type;
                    return (
                      <Pressable
                        key={rt.type}
                        onPress={() => {
                          setRecordType(rt.type);
                          setRecordUnit(rt.defaultUnit);
                        }}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                          isSelected && styles.chipActive,
                        ]}
                      >
                        <ChipIcon
                          size={13}
                          color={isSelected ? '#FFFFFF' : (isDarkMode ? '#C7D2FE' : '#475569')}
                          strokeWidth={2.2}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            { color: isDarkMode ? '#E2E8F0' : '#475569' },
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {rt.type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Measurement Value & Unit */}
              <View style={styles.rowInputsGroup}>
                <View style={[styles.modalInputGroup, { flex: 2 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Value *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    placeholder="e.g. 72 or 120/80"
                    placeholderTextColor="#667269"
                    value={recordValue}
                    onChangeText={setRecordValue}
                    autoFocus
                  />
                </View>

                <View style={[styles.modalInputGroup, { flex: 1.2 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Unit</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    placeholder="bpm"
                    placeholderTextColor="#667269"
                    value={recordUnit}
                    onChangeText={setRecordUnit}
                  />
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.rowInputsGroup}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    value={recordDate}
                    onChangeText={setRecordDate}
                  />
                </View>

                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    value={recordTime}
                    onChangeText={setRecordTime}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Notes (Optional)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    isWeb && styles.webOutlineNone,
                  ]}
                  placeholder="e.g. Taken right after waking up"
                  placeholderTextColor="#667269"
                  value={recordNotes}
                  onChangeText={setRecordNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => {
                  setRecordModalVisible(false);
                  setEditingRecord(null);
                }}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveRecord}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>
                  {editingRecord ? 'Update Record' : 'Save Record'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 7. ADD / EDIT MEDICATION MODAL ==================== */}
      <Modal
        visible={medicationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setMedicationModalVisible(false);
          setEditingMedication(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>
                  {editingMedication ? 'UPDATE REGIMEN' : 'PRESCRIPTION & SUPPLEMENT'}
                </Text>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  {editingMedication ? 'Edit Medication' : 'Add Medication'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setMedicationModalVisible(false);
                  setEditingMedication(null);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Medication Name */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Medication Name *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. Vitamin D3"
                  placeholderTextColor="#667269"
                  value={medName}
                  onChangeText={setMedName}
                  autoFocus
                />
              </View>

              {/* Dosage */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Dosage *</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. 1000 IU or 500 mg"
                  placeholderTextColor="#667269"
                  value={medDosage}
                  onChangeText={setMedDosage}
                />
              </View>

              {/* Frequency */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Frequency</Text>
                <View style={styles.chipRow}>
                  {frequencyOptions.map((freq) => (
                    <Pressable
                      key={freq}
                      onPress={() => setMedFrequency(freq)}
                      style={[
                        styles.chip,
                        { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                        medFrequency === freq && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isDarkMode ? '#E2E8F0' : '#475569' },
                          medFrequency === freq && styles.chipTextActive,
                        ]}
                      >
                        {freq}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Start Date & End Date */}
              <View style={styles.rowInputsGroup}>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    value={medStartDate}
                    onChangeText={setMedStartDate}
                  />
                </View>
                <View style={[styles.modalInputGroup, { flex: 1 }]}>
                  <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                    value={medEndDate}
                    onChangeText={setMedEndDate}
                  />
                </View>
              </View>

              {/* Reminder Time */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Reminder Time</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary }, isWeb && styles.webOutlineNone]}
                  placeholder="e.g. 08:00 AM"
                  placeholderTextColor="#667269"
                  value={medReminderTime}
                  onChangeText={setMedReminderTime}
                />
              </View>

              {/* Instructions */}
              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalInputLabel, { color: theme.colors.textSecondary }]}>Instructions</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
                    isWeb && styles.webOutlineNone,
                  ]}
                  placeholder="e.g. Take with food in the morning"
                  placeholderTextColor="#667269"
                  value={medInstructions}
                  onChangeText={setMedInstructions}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => {
                  setMedicationModalVisible(false);
                  setEditingMedication(null);
                }}
                style={[styles.modalCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.modalCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveMedication}
                style={styles.modalSubmitBtn}
              >
                <Text style={styles.modalSubmitText}>
                  {editingMedication ? 'Update Medication' : 'Save Medication'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== 12. DELETE CONFIRMATION MODAL ==================== */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.deleteWarningIconCircle}>
              <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
            </View>
            <Text style={[styles.deleteTitle, { color: theme.colors.textPrimary }]}>Delete Record?</Text>
            <Text style={[styles.deleteMessage, { color: theme.colors.textSecondary }]}>
              Are you sure you want to delete this record?
            </Text>

            <View style={styles.deleteActionRow}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.deleteCancelBtn, { backgroundColor: theme.colors.cardAltBg }]}
              >
                <Text style={[styles.deleteCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={executeDelete}
                style={styles.deleteConfirmBtn}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.appBg }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.colors.statusBarStyle} backgroundColor={theme.colors.appBg} />
      {isDesktop ? (
        <View style={[styles.desktopOuterContainer, { backgroundColor: theme.colors.desktopBg }]}>
          <View style={[styles.desktopShell, { backgroundColor: theme.colors.appBg, borderColor: theme.colors.borderDark }]}>
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
  safeArea: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
  },
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
    backgroundColor: '#0A0E1A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* 1. HEADER */
  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  headerKicker: {
    color: '#5EEAD4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    maxWidth: 240,
  },
  headerActionBtn: {
    paddingTop: 2,
  },
  pulseIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#14B8A6',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pulseIconText: {
    fontSize: 18,
    color: '#F43F5E',
  },

  orbLarge: {
    position: 'absolute',
    right: -70,
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#0F766E',
    opacity: 0.3,
  },
  orbSmall: {
    position: 'absolute',
    right: 60,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    opacity: 0.45,
  },

  /* 2. MAIN SHEET */
  sheetContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* 2. HEALTH OVERVIEW */
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  overviewKicker: {
    color: '#0D9488',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  overviewTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  overviewMessage: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 16,
  },
  indicatorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  indicatorCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  indicatorIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  indicatorIcon: {
    fontSize: 14,
    color: '#4F46E5',
  },
  indicatorValue: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  indicatorLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  /* 3. HEALTH QUICK ACTIONS */
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionSubTitle: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sectionMainTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  quickActionsGrid: {
    gap: 8,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  quickActionAiCard: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#CCFBF1',
  },
  quickActionIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionTitle: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '700',
  },
  quickActionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  /* 8. AI HEALTH RECOMMENDATION CARD */
  aiHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
  },
  aiBadgeSparkle: {
    fontSize: 11,
  },
  aiBadgeText: {
    color: '#0F766E',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  aiSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 14,
  },
  aiResultBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  aiResultText: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  aiLoadingText: {
    color: '#5EEAD4',
    fontSize: 12.5,
    fontWeight: '700',
  },
  aiActionBtn: {
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  aiActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* 9. AI RECOMMENDATION HISTORY & CARDS */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  headerAddPill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  headerAddPillText: {
    color: '#0F766E',
    fontSize: 12,
    fontWeight: '800',
  },
  aiHistoryList: {
    gap: 8,
  },
  aiHistoryCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiHistoryQuoteIcon: {
    fontSize: 22,
    color: '#0D9488',
    fontWeight: '900',
    lineHeight: 22,
    marginRight: 8,
  },
  aiHistoryBody: {
    flex: 1,
  },
  aiHistoryText: {
    color: '#0F172A',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
  },
  aiHistoryDate: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  viewMoreRowBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  viewMoreRowText: {
    color: '#0D9488',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* 4. HEALTH RECORDS LIST */
  recordsList: {
    gap: 8,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  recordIconText: {
    fontSize: 16,
  },
  recordContentCol: {
    flex: 1,
  },
  recordTypeTitle: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  recordValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 1,
  },
  recordValueText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  recordUnitText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  recordDateText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  recordDeleteBtn: {
    padding: 6,
  },
  recordDeleteText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },

  /* 6. MEDICATIONS LIST */
  medicationsList: {
    gap: 8,
  },
  medicationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  medNameCol: {
    flex: 1,
  },
  medNameText: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
  },
  medDosageText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  medFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medTimeText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  medInstructionsText: {
    color: '#64748B',
    fontSize: 11.5,
    flex: 1,
  },

  /* 10. HEALTH TRENDS */
  trendsList: {
    gap: 12,
  },
  trendItem: {},
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trendLabel: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
  },
  trendValue: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
  },
  trendTrack: {
    height: 8,
    backgroundColor: '#CCFBF1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 4,
  },

  /* 11. EMPTY STATES */
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  emptyStateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyStateHeading: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 240,
    lineHeight: 17,
  },
  emptyStateBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalKicker: {
    color: '#0D9488',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '800',
  },
  modalScroll: {
    maxHeight: 460,
  },
  modalInputGroup: {
    marginBottom: 14,
  },
  modalInputLabel: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalTextArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  rowInputsGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  chipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* 12. DELETE MODAL */
  deleteModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteWarningIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteWarningIcon: {
    fontSize: 22,
  },
  deleteTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  deleteMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  deleteCancelText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* TOAST NOTICE */
  noticeToast: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#14B8A6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  noticeText: {
    color: '#CCFBF1',
    fontSize: 12.5,
    fontWeight: '700',
  },

  pressedCard: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
