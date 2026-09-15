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
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Receipt,
  Calendar,
  AlertCircle,
  Percent,
  HelpCircle,
  Pencil,
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

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business / Sales',
  'Investments',
  'Gift / Bonus',
  'Other Income',
];

const EXPENSE_CATEGORIES = [
  'Housing & Rent',
  'Food & Groceries',
  'Transport & Fuel',
  'Utilities & Bills',
  'Health & Medical',
  'Shopping',
  'Entertainment',
  'Education',
  'Other Expense',
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
  const sym = selectedCurrency?.symbol || '$';
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
  const [itemCategory, setItemCategory] = useState('Food & Groceries');
  const [itemDate, setItemDate] = useState('Today');

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

  // Open Create / Edit Modal with optional preset type
  const openCreateModal = (transactionToEdit = null, presetType = 'Expense') => {
    if (transactionToEdit && typeof transactionToEdit === 'object') {
      setEditingTransaction(transactionToEdit);
      setItemTitle(transactionToEdit.title || '');
      setItemAmount(String(Math.abs(Number(transactionToEdit.amount) || 0)));
      const resolvedType = transactionToEdit.type || (Number(transactionToEdit.amount) > 0 ? 'Income' : 'Expense');
      setItemType(resolvedType);
      setItemCategory(transactionToEdit.category || (resolvedType === 'Income' ? 'Salary' : 'Food & Groceries'));
      setItemDate(transactionToEdit.date || 'Today');
    } else {
      setEditingTransaction(null);
      setItemTitle('');
      setItemAmount('');
      const targetType = typeof transactionToEdit === 'string' ? transactionToEdit : presetType;
      setItemType(targetType);
      setItemCategory(targetType === 'Income' ? 'Salary' : 'Food & Groceries');
      setItemDate('Today');
    }
    setCreateModalVisible(true);
  };

  const handleCreateTransaction = async () => {
    if (!itemTitle.trim() || !itemAmount.trim()) {
      showNotice('Please enter a title and amount');
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
      date: itemDate === 'Today' ? 'Today' : itemDate,
    };

    try {
      const token = await getToken();
      if (editingTransaction) {
        const idToUpdate = editingTransaction.id || editingTransaction._id;
        const res = await updateTransaction(idToUpdate, payload, token);
        if (res && res.success && res.transaction) {
          setTransactions((prev) =>
            (Array.isArray(prev) ? prev : []).map((t) => ((t.id === idToUpdate || t._id === idToUpdate) ? res.transaction : t))
          );
          showNotice(`Updated: "${itemTitle.trim()}"`);
        } else {
          // Local fallback
          setTransactions((prev) =>
            (Array.isArray(prev) ? prev : []).map((t) => ((t.id === idToUpdate || t._id === idToUpdate) ? { ...t, ...payload } : t))
          );
          showNotice(`Updated: "${itemTitle.trim()}"`);
        }
      } else {
        const res = await createTransaction(payload, token);
        if (res && res.success && res.transaction) {
          setTransactions((prev) => [res.transaction, ...(Array.isArray(prev) ? prev : [])]);
          showNotice(itemType === 'Income' ? `+ Added Income: "${itemTitle.trim()}"` : `- Logged Expense: "${itemTitle.trim()}"`);
        } else {
          // Local fallback
          const newTx = {
            id: Date.now().toString(),
            _id: Date.now().toString(),
            ...payload,
            createdAt: new Date().toISOString(),
          };
          setTransactions((prev) => [newTx, ...(Array.isArray(prev) ? prev : [])]);
          showNotice(itemType === 'Income' ? `+ Added Income: "${itemTitle.trim()}"` : `- Logged Expense: "${itemTitle.trim()}"`);
        }
      }
    } catch (e) {
      console.log('Error creating/updating transaction:', e);
      showNotice('Failed to save transaction');
    }

    setCreateModalVisible(false);
    setEditingTransaction(null);
  };

  const confirmDeleteTransaction = (tx) => {
    setTransactionToDelete(tx);
    setDeleteModalVisible(true);
  };

  const executeDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    const idToDelete = transactionToDelete.id || transactionToDelete._id;

    setTransactions((prev) => (Array.isArray(prev) ? prev : []).filter((t) => t && t.id !== idToDelete && t._id !== idToDelete));
    setDeleteModalVisible(false);
    const deletedTitle = transactionToDelete.title;
    setTransactionToDelete(null);
    showNotice(`Deleted "${deletedTitle}"`);

    try {
      const token = await getToken();
      if (token) {
        await deleteTransaction(idToDelete, token);
      }
    } catch (e) {
      console.log('Error deleting transaction on server:', e);
    }
  };

  // Calculations
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const totalIncome = safeTransactions
    .filter((t) => t && (Number(t.amount) > 0 || t.type === 'Income'))
    .reduce((acc, t) => acc + Math.abs(Number(t.amount) || 0), 0);

  const totalExpense = Math.abs(
    safeTransactions
      .filter((t) => t && (Number(t.amount) < 0 || t.type === 'Expense'))
      .reduce((acc, t) => acc + Math.abs(Number(t.amount) || 0), 0)
  );

  const netSavings = totalIncome - totalExpense;
  const spentRatio = totalIncome > 0 ? (totalExpense / totalIncome) : (totalExpense > 0 ? 1 : 0);
  const spentPercentage = Math.round(spentRatio * 100);

  const getBudgetStatus = () => {
    if (totalIncome === 0 && totalExpense === 0) return { label: 'Ready to track', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' };
    if (totalIncome === 0) return { label: 'No Income logged yet', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (spentPercentage < 70) return { label: `${100 - spentPercentage}% Salary remaining (Safe)`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (spentPercentage <= 90) return { label: `Caution: ${spentPercentage}% of Salary spent`, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
    if (spentPercentage <= 100) return { label: `Warning: ${spentPercentage}% spent!`, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    return { label: `Exceeded Income by ${sym}${(totalExpense - totalIncome).toLocaleString('en-US')}`, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)' };
  };

  const budgetStatus = getBudgetStatus();

  const filteredTransactions = safeTransactions.filter((t) => {
    if (!t) return false;
    let matchesType = true;
    if (activeFilter === 'Income') matchesType = (t.type === 'Income' || Number(t.amount) > 0);
    if (activeFilter === 'Expenses') matchesType = (t.type === 'Expense' || Number(t.amount) < 0);

    const title = (t?.title || '').toLowerCase();
    const cat = (t?.category || '').toLowerCase();
    const notes = (t?.notes || t?.description || '').toLowerCase();
    const date = (t?.date || '').toLowerCase();
    const amountStr = String(Math.abs(Number(t?.amount) || 0));
    const typeStr = (t?.type || '').toLowerCase();

    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch =
      !q ||
      title.includes(q) ||
      cat.includes(q) ||
      notes.includes(q) ||
      date.includes(q) ||
      amountStr.includes(q) ||
      typeStr.includes(q);

    return matchesType && matchesSearch;
  });

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
      setAiFinanceInsight(`Your current spending is at ${spentPercentage}% of your total income. Maintain strict adherence to essentials to protect your reserve.`);
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
        {/* ==================== 1. HEADER HERO ==================== */}
        <View style={styles.headerHero}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerKicker}>BUDGET & EXPENDITURE</Text>
              <Text style={styles.headerTitle}>Finance</Text>
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
                  {selectedCurrency.code}
                </Text>
                <ChevronDown size={13} color="#818CF8" strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.headerSubtitle}>Track how much of your salary you spend each month.</Text>

          {/* Search Bar - Permanently Visible & Fully Interactive */}
          <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Search size={15} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }, isWeb && styles.webOutlineNone]}
              placeholder="Search by title, category, amount, or date..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6} style={{ padding: 4 }}>
                <X size={14} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
              </Pressable>
            )}
          </View>

          {/* Prominent Two-Button Row (100% visible on all Android and iOS screens) */}
          <View style={styles.headerButtonsRow}>
            <Pressable
              onPress={() => openCreateModal(null, 'Income')}
              style={({ pressed }) => [
                styles.headerBtnHalf,
                styles.headerBtnIncome,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <ArrowDownLeft size={15} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.headerBtnText}>+ Add Income</Text>
            </Pressable>

            <Pressable
              onPress={() => openCreateModal(null, 'Expense')}
              style={({ pressed }) => [
                styles.headerBtnHalf,
                styles.headerBtnExpense,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <ArrowUpRight size={15} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.headerBtnText}>- Add Expense</Text>
            </Pressable>
          </View>

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* ==================== 2. MAIN CONTENT SHEET ==================== */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* Wealth & Spending Pulse Card */}
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.overviewHeaderRow}>
              <View>
                <Text style={styles.overviewKicker}>REMAINING BALANCE (SALARY & INFLOW)</Text>
                <Text style={[styles.overviewAmount, { color: netSavings >= 0 ? theme.colors.textPrimary : '#EF4444' }]}>
                  {netSavings >= 0 ? '+' : '-'}{sym}{Math.abs(netSavings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.budgetStatusChip, { backgroundColor: budgetStatus.bg }]}>
                <Text style={[styles.budgetStatusText, { color: budgetStatus.color }]}>
                  {budgetStatus.label}
                </Text>
              </View>
            </View>

            {/* Spending Progress Gauge */}
            <View style={styles.progressGaugeContainer}>
              <View style={styles.progressGaugeLabelRow}>
                <Text style={[styles.gaugeLabelText, { color: theme.colors.textSecondary }]}>
                  {totalIncome > 0
                    ? `Spent ${sym}${totalExpense.toLocaleString('en-US')} of ${sym}${totalIncome.toLocaleString('en-US')} Salary`
                    : 'No income logged yet'}
                </Text>
                <Text style={[styles.gaugePercentText, { color: budgetStatus.color }]}>
                  {totalIncome > 0 ? `${spentPercentage}% Spent` : '0%'}
                </Text>
              </View>
              <View style={[styles.gaugeTrack, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF' }]}>
                <View
                  style={[
                    styles.gaugeFill,
                    {
                      width: `${Math.max(4, Math.min(100, spentPercentage))}%`,
                      backgroundColor: spentPercentage > 90 ? '#EF4444' : spentPercentage > 70 ? '#F59E0B' : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>

            {/* 3 Column Quick Breakdown */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowDownLeft size={13} color="#059669" strokeWidth={2.4} />
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Salary / Inflow</Text>
                </View>
                <Text style={styles.statIncome}>+{sym}{totalIncome.toLocaleString('en-US')}</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.statItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight size={13} color="#DC2626" strokeWidth={2.4} />
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Spent / Outflow</Text>
                </View>
                <Text style={styles.statExpense}>-{sym}{totalExpense.toLocaleString('en-US')}</Text>
              </View>

              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />

              <View style={styles.statItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <PiggyBank size={13} color="#6366F1" strokeWidth={2.4} />
                  <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Savings Rate</Text>
                </View>
                <Text style={styles.statRate}>
                  {totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0}%
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Action Banner (Two primary buttons for high clarity) */}
          <View style={styles.quickActionBanner}>
            <Pressable
              onPress={() => openCreateModal(null, 'Income')}
              style={({ pressed }) => [
                styles.actionCardBtn,
                styles.actionCardIncome,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={styles.actionCardIconWrapIncome}>
                <ArrowDownLeft size={18} color="#059669" strokeWidth={2.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitleIncome}>+ Add Income</Text>
                <Text style={styles.actionCardSub}>Salary, Freelance, Bonus</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => openCreateModal(null, 'Expense')}
              style={({ pressed }) => [
                styles.actionCardBtn,
                styles.actionCardExpense,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <View style={styles.actionCardIconWrapExpense}>
                <ArrowUpRight size={18} color="#DC2626" strokeWidth={2.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionCardTitleExpense}>- Add Expense</Text>
                <Text style={styles.actionCardSub}>Rent, Groceries, Bills</Text>
              </View>
            </Pressable>
          </View>

          {/* AI Wealth & Cashflow Advisor Card */}
          <View
            style={[
              styles.aiBriefingCard,
              {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.12)' : '#F5F3FF',
                borderColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.18)',
              },
            ]}
          >
            <View style={styles.aiBriefingHeader}>
              <View style={styles.aiBriefingBadge}>
                <Sparkles size={12} color="#6366F1" strokeWidth={2.2} />
                <Text style={styles.aiBriefingBadgeText}>AI BUDGET ADVISORY</Text>
              </View>
              <Pressable
                onPress={handleGenerateFinanceInsight}
                disabled={aiFinanceLoading}
                style={({ pressed }) => [
                  styles.aiBriefingBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Text style={[styles.aiBriefingBtnText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                  {aiFinanceLoading ? 'Analyzing...' : '✦ Refresh'}
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.aiBriefingBody, { color: theme.colors.textPrimary }]}>
              {`"${aiFinanceInsight}"`}
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
                  {f === 'Income' ? 'Income (Salary)' : f === 'Expenses' ? 'Expenses (Spending)' : 'All Logs'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Transactions List */}
          <View style={[styles.sectionCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Income & Expenditure Logs</Text>
              <Text style={styles.sectionCount}>{filteredTransactions.length} entries</Text>
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconCircle}>
                  <WalletCards size={30} color="#6366F1" strokeWidth={1.8} />
                </View>
                <Text style={[styles.emptyHeading, { color: theme.colors.textPrimary }]}>
                  No transactions recorded
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                  Tap + Add Income or - Add Expense to start tracking your cashflow.
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <Pressable
                    onPress={() => openCreateModal(null, 'Income')}
                    style={[styles.emptyActionBtn, { backgroundColor: '#059669' }]}
                  >
                    <ArrowDownLeft size={14} color="#FFFFFF" strokeWidth={2.6} />
                    <Text style={styles.emptyActionBtnText}>+ Add Income</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => openCreateModal(null, 'Expense')}
                    style={[styles.emptyActionBtn, { backgroundColor: '#DC2626' }]}
                  >
                    <ArrowUpRight size={14} color="#FFFFFF" strokeWidth={2.6} />
                    <Text style={styles.emptyActionBtnText}>- Add Expense</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.txList}>
                {filteredTransactions.map((tx, idx) => {
                  if (!tx) return null;
                  const isIncome = Number(tx.amount) > 0 || tx.type === 'Income';
                  const txKey = tx.id || tx._id || `tx-${idx}`;
                  const numAmt = Math.abs(Number(tx.amount) || 0);

                  return (
                    <Pressable
                      key={txKey}
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
                          <ArrowDownLeft size={16} color="#059669" strokeWidth={2.6} />
                        ) : (
                          <ArrowUpRight size={16} color="#DC2626" strokeWidth={2.6} />
                        )}
                      </View>
                      <View style={styles.txMain}>
                        <Text style={[styles.txTitle, { color: theme.colors.textPrimary }]}>{tx.title || 'Untitled'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={[styles.txCategoryChip, { backgroundColor: isIncome ? '#ECFDF5' : '#FEE2E2' }]}>
                            <Text style={[styles.txCategoryText, { color: isIncome ? '#059669' : '#DC2626' }]}>
                              {tx.category || (isIncome ? 'Salary' : 'Expense')}
                            </Text>
                          </View>
                          <Text style={[styles.txMeta, { color: theme.colors.textMuted }]}>• {tx.date || 'Today'}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.txAmount, isIncome ? styles.amountPositive : styles.amountNegative]}>
                          {isIncome ? `+${sym}${numAmt.toFixed(2)}` : `-${sym}${numAmt.toFixed(2)}`}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            confirmDeleteTransaction(tx);
                          }}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.txDeleteBtn,
                            isWeb && styles.webPointer,
                            pressed && styles.pressedOpacity,
                          ]}
                        >
                          <Trash2 size={15} color="#EF4444" strokeWidth={2.2} />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 28 }} />
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
                <Text style={styles.modalKicker}>CURRENCY SETTINGS</Text>
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
                      showNotice(`Currency set to ${curr.name} (${curr.symbol.trim()})`);
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
                  {editingTransaction ? 'MODIFY RECORD' : itemType === 'Income' ? 'NEW INCOME RECORD' : 'NEW EXPENDITURE RECORD'}
                </Text>
                <Text style={styles.modalTitle}>
                  {editingTransaction
                    ? 'Edit Financial Item'
                    : itemType === 'Income'
                    ? 'Log Salary / Income'
                    : 'Log Everyday Expense'}
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

            {/* Clear Type Selector with Visual Feedback */}
            <View style={styles.typeSelector}>
              <Pressable
                onPress={() => {
                  setItemType('Income');
                  if (!INCOME_CATEGORIES.includes(itemCategory)) {
                    setItemCategory('Salary');
                  }
                }}
                style={[
                  styles.typeBtn,
                  itemType === 'Income' && styles.typeBtnIncomeActive,
                ]}
              >
                <ArrowDownLeft size={15} color={itemType === 'Income' ? '#FFFFFF' : '#059669'} strokeWidth={2.6} />
                <Text style={[styles.typeText, itemType === 'Income' && styles.typeTextActive]}>
                  + Income (Salary)
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setItemType('Expense');
                  if (!EXPENSE_CATEGORIES.includes(itemCategory)) {
                    setItemCategory('Food & Groceries');
                  }
                }}
                style={[
                  styles.typeBtn,
                  itemType === 'Expense' && styles.typeBtnExpenseActive,
                ]}
              >
                <ArrowUpRight size={15} color={itemType === 'Expense' ? '#FFFFFF' : '#DC2626'} strokeWidth={2.6} />
                <Text style={[styles.typeText, itemType === 'Expense' && styles.typeTextActive]}>
                  - Expense (Spending)
                </Text>
              </Pressable>
            </View>

            {/* Title / Description */}
            <Text style={styles.modalFieldLabel}>Description / Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                itemType === 'Income'
                  ? 'e.g. Monthly Salary, Freelance project, Bonus'
                  : 'e.g. Grocery shopping, House Rent, Electric Bill'
              }
              placeholderTextColor="#94A3B8"
              value={itemTitle}
              onChangeText={setItemTitle}
            />

            {/* Amount Input */}
            <Text style={styles.modalFieldLabel}>Amount ({selectedCurrency.code} - {sym.trim()})</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`e.g. 50000 or 1200`}
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={itemAmount}
              onChangeText={setItemAmount}
            />

            {/* Category Selection */}
            <Text style={styles.modalFieldLabel}>Category</Text>
            <View style={styles.chipRow}>
              {(itemType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setItemCategory(c)}
                  style={[styles.chip, itemCategory === c && (itemType === 'Income' ? styles.chipIncomeActive : styles.chipExpenseActive)]}
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

              <Pressable
                onPress={handleCreateTransaction}
                style={[
                  styles.modalSubmitBtn,
                  { flex: 2, backgroundColor: itemType === 'Income' ? '#059669' : '#4F46E5' },
                ]}
              >
                <Text style={styles.modalSubmitText}>
                  {editingTransaction ? 'Update Entry' : itemType === 'Income' ? '+ Save Income' : '- Save Expense'}
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
          <View style={[styles.modalCard, { maxWidth: 360, alignSelf: 'center', borderRadius: 24 }]}>
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Trash2 size={24} color="#EF4444" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>Delete Record?</Text>
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
  headerButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    zIndex: 3,
  },
  headerBtnHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBtnIncome: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  headerBtnExpense: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  headerBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

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
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewKicker: { color: '#6366F1', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.1 },
  overviewAmount: { color: '#0F172A', fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  budgetStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  progressGaugeContainer: {
    marginTop: 10,
    marginBottom: 14,
  },
  progressGaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gaugeLabelText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  gaugePercentText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 26, backgroundColor: '#E2E8F0' },
  statLabel: { color: '#64748B', fontSize: 10.5, fontWeight: '600' },
  statIncome: { color: '#059669', fontSize: 13, fontWeight: '800', marginTop: 2 },
  statExpense: { color: '#DC2626', fontSize: 13, fontWeight: '800', marginTop: 2 },
  statRate: { color: '#4F46E5', fontSize: 13, fontWeight: '800', marginTop: 2 },

  /* Quick Action Banner */
  quickActionBanner: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  actionCardIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  actionCardExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  actionCardIconWrapIncome: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardIconWrapExpense: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitleIncome: {
    color: '#059669',
    fontSize: 13.5,
    fontWeight: '800',
  },
  actionCardTitleExpense: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '800',
  },
  actionCardSub: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },

  /* AI Briefing Card */
  aiBriefingCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  aiBriefingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiBriefingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  aiBriefingBadgeText: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  aiBriefingBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBriefingBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiBriefingBody: {
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
    width: '100%',
    flexShrink: 1,
  },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  filterPillText: { color: '#475569', fontSize: 12.5, fontWeight: '700' },
  filterPillTextActive: { color: '#FFFFFF' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  sectionCount: { color: '#64748B', fontSize: 11.5, fontWeight: '600' },

  /* Empty State */
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  txList: { gap: 8 },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  txIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  txIconIncome: { backgroundColor: '#ECFDF5' },
  txIconExpense: { backgroundColor: '#FEE2E2' },
  txMain: { flex: 1 },
  txTitle: { color: '#0F172A', fontSize: 13.5, fontWeight: '700' },
  txCategoryChip: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  txCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  txMeta: { color: '#64748B', fontSize: 11 },
  txAmount: { fontSize: 13.5, fontWeight: '800' },
  amountPositive: { color: '#059669' },
  amountNegative: { color: '#0F172A' },
  txDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalKicker: { color: '#6366F1', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.2 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    fontSize: 13.5,
    fontWeight: '700',
  },
  currencyCodeText: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '600',
  },

  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  typeBtnIncomeActive: { backgroundColor: '#059669' },
  typeBtnExpenseActive: { backgroundColor: '#DC2626' },
  typeText: { color: '#475569', fontSize: 12.5, fontWeight: '700' },
  typeTextActive: { color: '#FFFFFF' },

  modalFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 11,
    fontSize: 13.5,
    color: '#0F172A',
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  chipIncomeActive: { backgroundColor: '#059669' },
  chipExpenseActive: { backgroundColor: '#4F46E5' },
  chipText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  modalSubmitBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '800' },

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
