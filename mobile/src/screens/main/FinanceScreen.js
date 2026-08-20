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
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';

const CURRENCIES = [
  { code: 'XAF', symbol: 'FCFA ', name: 'Central African CFA Franc (Cameroon)' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'XOF', symbol: 'CFA ', name: 'West African CFA Franc' },
  { code: 'KES', symbol: 'KSh ', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R ', name: 'South African Rand' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export default function FinanceScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  const [activeTab, setActiveTab] = useState('finance');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]); // Default to XAF (FCFA)
  const [noticeMessage, setNoticeMessage] = useState('');

  // Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemType, setItemType] = useState('Expense'); // 'Expense' | 'Income'
  const [itemCategory, setItemCategory] = useState('Operations');

  // Transactions State
  const [transactions, setTransactions] = useState([
    { id: '1', title: 'Cloud Infrastructure & AI API', category: 'Software', amount: -150000, type: 'Expense', date: 'Today, 2:15 PM' },
    { id: '2', title: 'Consulting Retainer Payment', category: 'Revenue', amount: 2850000, type: 'Income', date: 'Yesterday' },
    { id: '3', title: 'Hardware & Workstation Lease', category: 'Office', amount: -125000, type: 'Expense', date: 'Aug 18' },
    { id: '4', title: 'Quarterly Strategic Dividend', category: 'Investments', amount: 520000, type: 'Income', date: 'Aug 15' },
    { id: '5', title: 'Executive Coaching & Books', category: 'Growth', amount: -85000, type: 'Expense', date: 'Aug 14' },
  ]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 2600);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showNotice('Financial accounts synced');
    }, 600);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) onNavigateTab(tabId);
    else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'calendar') navigation.navigate('Calendar');
      else if (tabId === 'notes') navigation.navigate('Notes');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  const handleCreateTransaction = () => {
    if (!itemTitle.trim() || !itemAmount.trim()) {
      showNotice('Please fill all fields');
      return;
    }
    const num = parseFloat(itemAmount) || 0;
    const newTx = {
      id: Date.now().toString(),
      title: itemTitle.trim(),
      category: itemCategory,
      amount: itemType === 'Expense' ? -Math.abs(num) : Math.abs(num),
      type: itemType,
      date: 'Just now',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setCreateModalVisible(false);
    setItemTitle('');
    setItemAmount('');
    showNotice(`Transaction logged (${selectedCurrency.code})`);
  };

  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = Math.abs(transactions.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));
  const netSavings = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((t) => {
    if (activeFilter === 'Income') return t.type === 'Income';
    if (activeFilter === 'Expenses') return t.type === 'Expense';
    return true;
  });

  const categories = ['Software', 'Revenue', 'Office', 'Investments', 'Growth', 'Personal'];

  const sym = selectedCurrency.symbol;

  const appContent = (
    <View style={styles.mainWrapper}>
      {!!noticeMessage && (
        <View style={styles.noticeToast}>
          <Text style={styles.noticeText}>✓ {noticeMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#4F46E5', '#6366F1']}
          />
        }
      >
        {/* Header Hero */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerKicker}>WEALTH & CASHFLOW</Text>
              <Text style={styles.headerTitle}>Finance</Text>
              <Text style={styles.headerSubtitle}>Monitor capital allocation & liquidity.</Text>
            </View>

            <View style={styles.headerActionBtns}>
              {/* Currency Selector Pill */}
              <Pressable
                onPress={() => setCurrencyModalVisible(true)}
                style={({ pressed }) => [
                  styles.currencyPickerBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.currencyPickerText}>
                  {selectedCurrency.code} ({selectedCurrency.symbol.trim()}) ▾
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCreateModalVisible(true)}
                style={({ pressed }) => [
                  styles.quickAddBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={styles.quickAddBtnText}>+ Log</Text>
              </Pressable>
            </View>
          </View>

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* Content Body */}
        <View style={styles.sheetContent}>
          {/* Wealth Overview Card */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewKicker}>NET CASHFLOW (MTD)</Text>
              <Text style={styles.activeCurrencyTag}>{selectedCurrency.code}</Text>
            </View>
            <Text style={styles.overviewAmount}>
              {netSavings >= 0 ? '+' : '-'}{sym}{Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Inflow</Text>
                <Text style={styles.statIncome}>+{sym}{totalIncome.toLocaleString('en-US')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Outflow</Text>
                <Text style={styles.statExpense}>-{sym}{totalExpense.toLocaleString('en-US')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Savings Rate</Text>
                <Text style={styles.statRate}>
                  {totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {['All', 'Income', 'Expenses'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Transactions List */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Allocations</Text>
              <Text style={styles.sectionCount}>{filteredTransactions.length} logs</Text>
            </View>

            <View style={styles.txList}>
              {filteredTransactions.map((tx) => (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txIconWrap, tx.amount > 0 ? styles.txIconIncome : styles.txIconExpense]}>
                    <Text style={styles.txIcon}>{tx.amount > 0 ? '↗' : '↘'}</Text>
                  </View>
                  <View style={styles.txMain}>
                    <Text style={styles.txTitle}>{tx.title}</Text>
                    <Text style={styles.txMeta}>{tx.category} • {tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, tx.amount > 0 ? styles.amountPositive : styles.amountNegative]}>
                    {tx.amount > 0 ? `+${sym}${tx.amount.toFixed(2)}` : `-${sym}${Math.abs(tx.amount).toFixed(2)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Currency Selection Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.currencyModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>PREFERENCES</Text>
                <Text style={styles.modalTitle}>Select Currency</Text>
              </View>
              <Pressable onPress={() => setCurrencyModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency.code === curr.code;
                return (
                  <Pressable
                    key={curr.code}
                    onPress={() => {
                      setSelectedCurrency(curr);
                      setCurrencyModalVisible(false);
                      showNotice(`Currency updated to ${curr.name} (${curr.symbol.trim()})`);
                    }}
                    style={[styles.currencyRow, isSelected && styles.currencyRowActive]}
                  >
                    <View style={styles.currencySymbolBadge}>
                      <Text style={styles.currencySymbolBadgeText}>{curr.symbol.trim()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.currencyNameText}>{curr.name}</Text>
                      <Text style={styles.currencyCodeText}>{curr.code}</Text>
                    </View>
                    {isSelected && <Text style={styles.currencySelectedCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Transaction Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>NEW ENTRY</Text>
                <Text style={styles.modalTitle}>Log Cashflow Item</Text>
              </View>
              <Pressable onPress={() => setCreateModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Type selector */}
            <View style={styles.typeSelector}>
              {['Expense', 'Income'].map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setItemType(t)}
                  style={[styles.typeBtn, itemType === t && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeText, itemType === t && styles.typeTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Title / Vendor (e.g. AWS Cloud Infrastructure)"
              placeholderTextColor="#94A3B8"
              value={itemTitle}
              onChangeText={setItemTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={`Amount in ${selectedCurrency.code} (${sym.trim()})`}
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={itemAmount}
              onChangeText={setItemAmount}
            />

            <View style={styles.chipRow}>
              {categories.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setItemCategory(c)}
                  style={[styles.chip, itemCategory === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, itemCategory === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleCreateTransaction} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitText}>Save Allocation</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabChange} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      {isDesktop ? (
        <View style={styles.desktopOuterContainer}>
          <View style={styles.desktopShell}>{appContent}</View>
        </View>
      ) : (
        appContent
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0E1A' },
  mainWrapper: { flex: 1, backgroundColor: '#0A0E1A' },
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
  scrollContainer: { flex: 1, backgroundColor: '#0A0E1A' },
  scrollContentContainer: { flexGrow: 1, backgroundColor: '#F8FAFC', paddingBottom: 24 },

  headerHero: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 36,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
  headerKicker: { color: '#818CF8', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  headerTitle: { color: '#F8FAFC', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  headerSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 4 },

  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPickerBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  currencyPickerText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  quickAddBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  quickAddBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  orbLarge: {
    position: 'absolute',
    right: -80,
    top: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4338CA',
    opacity: 0.35,
  },
  orbSmall: {
    position: 'absolute',
    right: 50,
    bottom: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    opacity: 0.6,
  },

  sheetContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

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
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewKicker: { color: '#6366F1', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  activeCurrencyTag: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  overviewAmount: { color: '#0F172A', fontSize: 30, fontWeight: '900', letterSpacing: -1, marginVertical: 8 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  statLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  statIncome: { color: '#059669', fontSize: 13, fontWeight: '800' },
  statExpense: { color: '#DC2626', fontSize: 13, fontWeight: '800' },
  statRate: { color: '#4F46E5', fontSize: 13, fontWeight: '800' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  filterPillText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  filterPillTextActive: { color: '#FFFFFF' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  sectionCount: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  txList: { gap: 10 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  txIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txIconIncome: { backgroundColor: '#ECFDF5' },
  txIconExpense: { backgroundColor: '#FEE2E2' },
  txIcon: { fontSize: 16, fontWeight: '900' },
  txMain: { flex: 1 },
  txTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  txMeta: { color: '#64748B', fontSize: 11.5, marginTop: 2 },
  txAmount: { fontSize: 14.5, fontWeight: '800' },
  amountPositive: { color: '#059669' },
  amountNegative: { color: '#0F172A' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 },
  currencyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginBottom: 'auto',
    marginTop: 'auto',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalKicker: { color: '#6366F1', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { color: '#64748B', fontSize: 14, fontWeight: '800' },

  /* Currency Rows */
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  currencyRowActive: {
    backgroundColor: '#EEF2FF',
  },
  currencySymbolBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currencySymbolBadgeText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  currencyNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  currencyCodeText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  currencySelectedCheck: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '900',
  },

  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#0F172A' },
  typeText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  typeTextActive: { color: '#FFFFFF' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: '#475569', fontSize: 11.5, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  modalSubmitBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  noticeToast: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
  },
  noticeText: { color: '#E0E7FF', fontSize: 12.5, fontWeight: '700' },
  pressedOpacity: { opacity: 0.7 },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
