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
import {
  WalletCards,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Plus,
  Check,
  X,
  Search,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  fetchAiFinanceRecommendation,
} from '../../services/api';
import { getToken } from '../../services/storage';

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
  const { theme, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('finance');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]); // Default to XAF (FCFA)
  const [noticeMessage, setNoticeMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Edit and Delete State
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // AI Wealth Insight State
  const [aiFinanceInsight, setAiFinanceInsight] = useState(
    'Optimal cashflow distribution detected. Maintain your reserve targets and automate monthly savings.'
  );
  const [aiFinanceLoading, setAiFinanceLoading] = useState(false);

  // Form State
  const [itemTitle, setItemTitle] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [itemType, setItemType] = useState('Expense'); // 'Expense' | 'Income'
  const [itemCategory, setItemCategory] = useState('Operations');

  // Transactions State (dynamically bound to database user)
  const [transactions, setTransactions] = useState(user?.transactions || []);

  // Fetch transactions from API
  const loadTransactionsFromApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchTransactions({}, token);
      if (res && res.success && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      }
    } catch (e) {
      console.log('Error fetching transactions from API:', e);
    }
  };

  // Load transactions on mount
  React.useEffect(() => {
    loadTransactionsFromApi();
  }, []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user && user.transactions && transactions.length === 0) {
      setTransactions(user.transactions || []);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 2600);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTransactionsFromApi();
      showNotice('Financial accounts synced');
    } catch (e) {
      console.log('Error refreshing financial accounts:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onNavigateTab) onNavigateTab(tabId);
    else if (navigation) {
      if (tabId === 'dashboard') navigation.navigate('Dashboard');
      else if (tabId === 'tasks') navigation.navigate('Tasks');
      else if (tabId === 'goals') navigation.navigate('Goals');
      else if (tabId === 'health') navigation.navigate('Health');
      else if (tabId === 'calendar') navigation.navigate('Calendar');
      else if (tabId === 'notes') navigation.navigate('Notes');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  // Open Create / Edit Modal
  const openCreateModal = (transactionToEdit = null) => {
    if (transactionToEdit) {
      setEditingTransaction(transactionToEdit);
      setItemTitle(transactionToEdit.title || '');
      setItemAmount(String(Math.abs(transactionToEdit.amount || 0)));
      setItemType(transactionToEdit.type || (transactionToEdit.amount > 0 ? 'Income' : 'Expense'));
      setItemCategory(transactionToEdit.category || 'Operations');
    } else {
      setEditingTransaction(null);
      setItemTitle('');
      setItemAmount('');
      setItemType('Expense');
      setItemCategory('Operations');
    }
    setCreateModalVisible(true);
  };

  const handleCreateTransaction = async () => {
    if (!itemTitle.trim() || !itemAmount.trim()) {
      showNotice('Please fill all fields');
      return;
    }
    const num = parseFloat(itemAmount) || 0;
    if (num <= 0) {
      showNotice('Amount must be greater than 0');
      return;
    }

    const payload = {
      title: itemTitle.trim(),
      category: itemCategory,
      amount: itemType === 'Expense' ? -Math.abs(num) : Math.abs(num),
      type: itemType,
      date: 'Just now',
    };

    try {
      const token = await getToken();
      if (editingTransaction) {
        const idToUpdate = editingTransaction.id || editingTransaction._id;
        setTransactions((prev) =>
          prev.map((t) => ((t.id === idToUpdate || t._id === idToUpdate) ? { ...t, ...payload } : t))
        );
        showNotice(`Transaction updated (${selectedCurrency.code})`);

        if (token) {
          const res = await updateTransaction(idToUpdate, payload, token);
          if (res && res.success && res.transaction) {
            setTransactions((prev) =>
              prev.map((t) => ((t.id === idToUpdate || t._id === idToUpdate) ? res.transaction : t))
            );
          }
        }
      } else {
        const tempTx = {
          id: Date.now().toString(),
          ...payload,
        };
        setTransactions((prev) => [tempTx, ...prev]);
        showNotice(`Transaction logged (${selectedCurrency.code})`);

        if (token) {
          const res = await createTransaction(payload, token);
          if (res && res.success && res.transaction) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === tempTx.id ? res.transaction : t))
            );
          }
        }
      }
    } catch (e) {
      console.log('Error saving transaction:', e);
      showNotice('Saved locally');
    }

    setCreateModalVisible(false);
    setEditingTransaction(null);
    setItemTitle('');
    setItemAmount('');
  };

  // Delete Transaction Handlers
  const confirmDeleteTransaction = (tx) => {
    setTransactionToDelete(tx);
    setDeleteModalVisible(true);
  };

  const executeDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    const targetId = transactionToDelete.id || transactionToDelete._id;

    setTransactions((prev) => prev.filter((t) => (t.id !== targetId && t._id !== targetId)));
    showNotice('Transaction removed from logs');
    setDeleteModalVisible(false);
    setTransactionToDelete(null);

    try {
      const token = await getToken();
      if (token) {
        await deleteTransaction(targetId, token);
      }
    } catch (e) {
      console.log('Error deleting transaction on server:', e);
    }
  };

  const totalIncome = transactions.filter((t) => t.amount > 0 || t.type === 'Income').reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const totalExpense = Math.abs(transactions.filter((t) => t.amount < 0 || t.type === 'Expense').reduce((acc, t) => acc + Math.abs(t.amount), 0));
  const netSavings = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((t) => {
    let matchesType = true;
    if (activeFilter === 'Income') matchesType = (t.type === 'Income' || t.amount > 0);
    if (activeFilter === 'Expenses') matchesType = (t.type === 'Expense' || t.amount < 0);

    const title = (t?.title || '').toLowerCase();
    const cat = (t?.category || '').toLowerCase();
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch = !q || title.includes(q) || cat.includes(q);

    return matchesType && matchesSearch;
  });

  const categories = ['Software', 'Revenue', 'Office', 'Investments', 'Growth', 'Personal', 'Operations'];

  const sym = selectedCurrency.symbol;

  const handleGenerateFinanceInsight = async () => {
    setAiFinanceLoading(true);
    try {
      const token = await getToken();
      const payload = {
        totalBalance: netSavings,
        monthlyIncome: totalIncome,
        monthlyExpenses: totalExpense,
        currency: sym,
      };
      const res = await fetchAiFinanceRecommendation(payload, token);
      if (res && res.success && res.recommendation) {
        setAiFinanceInsight(res.recommendation);
        showNotice(res.source && res.source.startsWith('ollama') ? 'AI Insight generated by Ollama' : 'AI Cashflow insight updated');
      } else {
        throw new Error(res?.message || 'Empty response');
      }
    } catch (e) {
      console.log('AI Finance error:', e.message);
      setAiFinanceInsight('Your net cashflow ratio remains well-balanced this month. Consider allocating surplus reserves into automated savings.');
      showNotice('AI Insight updated');
    } finally {
      setAiFinanceLoading(false);
    }
  };

  const appContent = (
    <View style={[styles.mainWrapper, { backgroundColor: theme.colors.pageBg }]}>
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
            tintColor="#6366F1"
            colors={['#4F46E5', '#6366F1']}
          />
        }
      >
        {/* Header Hero */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerKicker}>WEALTH & CASHFLOW</Text>
              <Text style={styles.headerTitle}>Finance</Text>
            </View>

            <View style={styles.headerActionBtns}>
              {/* Search Toggle */}
              <Pressable
                onPress={() => {
                  setShowSearch(!showSearch);
                  if (showSearch) setSearchQuery('');
                }}
                style={({ pressed }) => [
                  styles.headerSearchBtn,
                  showSearch && styles.headerSearchBtnActive,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
                hitSlop={8}
              >
                {showSearch ? (
                  <X size={17} color="#94A3B8" strokeWidth={2.2} />
                ) : (
                  <Search size={17} color="#94A3B8" strokeWidth={2.2} />
                )}
              </Pressable>

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
                  {selectedCurrency.code}
                </Text>
                <ChevronDown size={13} color="#818CF8" strokeWidth={2.4} />
              </Pressable>

              <Pressable
                onPress={() => openCreateModal()}
                style={({ pressed }) => [
                  styles.quickAddBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.quickAddBtnText}>Log</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>Monitor capital allocation & liquidity.</Text>

          {/* Search Bar */}
          {showSearch && (
            <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
              <Search size={15} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
              <TextInput
                style={[styles.searchInput, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }, isWeb && styles.webOutlineNone]}
                placeholder="Search transactions by title or category..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {!!searchQuery && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6} style={{ padding: 4 }}>
                  <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
                </Pressable>
              )}
            </View>
          )}

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* Content Body */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* Wealth Overview Card */}
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.overviewHeaderRow}>
              <Text style={styles.overviewKicker}>NET CASHFLOW (MTD)</Text>
              <Text style={styles.activeCurrencyTag}>{selectedCurrency.code}</Text>
            </View>
            <Text style={[styles.overviewAmount, { color: theme.colors.textPrimary }]}>
              {netSavings >= 0 ? '+' : '-'}{sym}{Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Inflow</Text>
                <Text style={styles.statIncome}>+{sym}{totalIncome.toLocaleString('en-US')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Outflow</Text>
                <Text style={styles.statExpense}>-{sym}{totalExpense.toLocaleString('en-US')}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Savings Rate</Text>
                <Text style={styles.statRate}>
                  {totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* AI Wealth & Cashflow Advisor Card */}
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
                borderColor: '#818CF8',
                marginBottom: 16,
                padding: 14,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#6366F1" strokeWidth={2.5} />
                <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 }}>
                  AI WEALTH ADVISORY
                </Text>
              </View>
              <Pressable
                onPress={handleGenerateFinanceInsight}
                disabled={aiFinanceLoading}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: isDarkMode ? '#312E81' : '#E0E7FF',
                  },
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={{ color: '#4F46E5', fontSize: 11, fontWeight: '700' }}>
                  {aiFinanceLoading ? 'Analyzing...' : 'Refresh'}
                </Text>
              </Pressable>
            </View>
            <Text style={{ color: isDarkMode ? '#E0E7FF' : '#1E1B4B', fontSize: 12.5, lineHeight: 18 }}>
              {aiFinanceInsight}
            </Text>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {['All', 'Income', 'Expenses'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.filterPill,
                  activeFilter === f
                    ? styles.filterPillActive
                    : [styles.filterPillInactive, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeFilter === f
                      ? styles.filterPillTextActive
                      : [styles.filterPillTextInactive, { color: theme.colors.textSecondary }],
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Transactions List */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Allocations</Text>
              <Text style={styles.sectionCount}>{filteredTransactions.length} logs</Text>
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
                <WalletCards size={36} color="#94A3B8" strokeWidth={1.5} />
                <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' }}>No transactions recorded</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
                  Tap "+ Log" above to track your income and expenditures.
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.amount > 0 || tx.type === 'Income';
                  return (
                    <Pressable
                      key={tx.id || tx._id}
                      onPress={() => openCreateModal(tx)}
                      style={({ pressed }) => [
                        styles.txItem,
                        { borderBottomColor: theme.colors.border },
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <View style={[styles.txIconWrap, isIncome ? styles.txIconIncome : styles.txIconExpense]}>
                        {isIncome ? (
                          <TrendingUp size={16} color="#059669" strokeWidth={2.4} />
                        ) : (
                          <TrendingDown size={16} color="#DC2626" strokeWidth={2.4} />
                        )}
                      </View>
                      <View style={styles.txMain}>
                        <Text style={[styles.txTitle, { color: theme.colors.textPrimary }]}>{tx.title}</Text>
                        <Text style={[styles.txMeta, { color: theme.colors.textMuted }]}>{tx.category} • {tx.date}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={[styles.txAmount, isIncome ? styles.amountPositive : styles.amountNegative]}>
                          {isIncome ? `+${sym}${Math.abs(tx.amount).toFixed(2)}` : `-${sym}${Math.abs(tx.amount).toFixed(2)}`}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            confirmDeleteTransaction(tx);
                          }}
                          hitSlop={8}
                          style={{ padding: 4 }}
                        >
                          <X size={14} color="#94A3B8" strokeWidth={2.2} />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
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
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
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
                    {isSelected && <Check size={16} color="#4F46E5" strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create / Edit Transaction Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setEditingTransaction(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>
                  {editingTransaction ? 'UPDATE ENTRY' : 'NEW ENTRY'}
                </Text>
                <Text style={styles.modalTitle}>
                  {editingTransaction ? 'Edit Cashflow Item' : 'Log Cashflow Item'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingTransaction(null);
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
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

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingTransaction(null);
                }}
                style={[styles.modalSubmitBtn, { flex: 1, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
              >
                <Text style={[styles.modalSubmitText, { color: isDarkMode ? '#F8FAFC' : '#475569' }]}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleCreateTransaction} style={[styles.modalSubmitBtn, { flex: 2 }]}>
                <Text style={styles.modalSubmitText}>
                  {editingTransaction ? 'Update Allocation' : 'Save Allocation'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Transaction Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>Delete Transaction?</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Are you sure you want to remove "{transactionToDelete?.title}" from your financial logs?
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.modalSubmitBtn, { flex: 1, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
              >
                <Text style={[styles.modalSubmitText, { color: isDarkMode ? '#F8FAFC' : '#475569' }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={executeDeleteTransaction}
                style={[styles.modalSubmitBtn, { flex: 1, backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.modalSubmitText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  headerTitleWrap: {
    flexShrink: 0,
  },
  headerKicker: {
    color: '#818CF8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    zIndex: 2,
  },

  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  },
  headerSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  headerSearchBtnActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    zIndex: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    marginHorizontal: 8,
  },
  currencyPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  currencyPickerText: {
    color: '#E0E7FF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  quickAddBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
