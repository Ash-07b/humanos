import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Date of Birth',
}) {
  const isWeb = Platform.OS === 'web';
  const currentYear = new Date().getFullYear();
  const { theme, isDarkMode } = useTheme();

  // Parse initial date if valid (format YYYY-MM-DD or DD/MM/YYYY)
  const parseInitial = () => {
    if (!initialDate) return new Date(2000, 0, 1);
    
    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const parts = initialDate.split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    // Check DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(initialDate)) {
      const parts = initialDate.split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    // Check MM/DD/YYYY
    const d = new Date(initialDate);
    return isNaN(d.getTime()) ? new Date(2000, 0, 1) : d;
  };

  const [selectedYear, setSelectedYear] = useState(2000);
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'year'

  useEffect(() => {
    if (visible) {
      const parsed = parseInitial();
      setSelectedYear(parsed.getFullYear());
      setSelectedMonth(parsed.getMonth());
      setSelectedDay(parsed.getDate());
      setViewMode('calendar');
    }
  }, [visible, initialDate]);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleConfirm = () => {
    const daysInM = getDaysInMonth(selectedYear, selectedMonth);
    const day = Math.min(selectedDay, daysInM);
    const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const result = `${formattedDay}/${formattedMonth}/${selectedYear}`;
    onSelectDate(result);
    onClose();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

  // Generate Year list from 1930 to currentYear
  const years = [];
  for (let y = currentYear; y >= 1930; y--) {
    years.push(y);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerCard, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
          {/* Header */}
          <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerTitleWrap}>
              <CalendarDays size={18} color="#6366F1" strokeWidth={2.2} />
              <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <X size={18} color="#94A3B8" strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Month & Year Bar */}
          <View style={[styles.navBar, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
            <Pressable
              onPress={handlePrevMonth}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <ChevronLeft size={16} color="#6366F1" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
              style={({ pressed }) => [
                styles.monthYearSelector,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={[styles.monthYearText, { color: theme.colors.textPrimary }]}>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </Text>
              <Text style={styles.toggleModeHint}>
                {viewMode === 'year' ? '▲ Calendar' : '▼ Change Year'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleNextMonth}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <ChevronRight size={16} color="#6366F1" strokeWidth={2.4} />
            </Pressable>
          </View>

          {viewMode === 'year' ? (
            /* Year Picker Scroll */
            <View style={styles.yearScrollContainer}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.yearGrid}>
                {years.map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => {
                      setSelectedYear(y);
                      setViewMode('calendar');
                    }}
                    style={[
                      styles.yearChip,
                      { backgroundColor: theme.colors.cardAltBg },
                      selectedYear === y && styles.yearChipSelected,
                      isWeb && styles.webPointer,
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearChipText,
                        { color: theme.colors.textPrimary },
                        selectedYear === y && styles.yearChipTextSelected,
                      ]}
                    >
                      {y}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            /* Calendar Grid View */
            <View style={styles.calendarContainer}>
              {/* Day Labels */}
              <View style={styles.daysOfWeekRow}>
                {DAYS_OF_WEEK.map((d) => (
                  <Text key={d} style={[styles.dayOfWeekText, { color: theme.colors.textMuted }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Day Cells Matrix */}
              <View style={styles.daysGrid}>
                {/* Empty cells before month start */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCellEmpty} />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = selectedDay === dayNum;

                  return (
                    <Pressable
                      key={`day-${dayNum}`}
                      onPress={() => setSelectedDay(dayNum)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isWeb && styles.webPointer,
                        pressed && styles.pressedOpacity,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          { color: theme.colors.textPrimary },
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Selected Date Summary & Actions */}
          <View style={[styles.selectedSummaryRow, { backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
            <Text style={styles.selectedDateLabel}>Selected Date:</Text>
            <Text style={[styles.selectedDateVal, { color: theme.colors.textPrimary }]}>
              {String(selectedDay).padStart(2, '0')}/{String(selectedMonth + 1).padStart(2, '0')}/{selectedYear}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: theme.colors.cardAltBg },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.confirmBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearSelector: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  monthYearText: {
    color: '#0F172A',
    fontSize: 14.5,
    fontWeight: '800',
  },
  toggleModeHint: {
    color: '#6366F1',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },
  calendarContainer: {
    marginBottom: 12,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayOfWeekText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 36,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 1,
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayCellText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  yearScrollContainer: {
    height: 230,
    marginBottom: 12,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    minWidth: 68,
    alignItems: 'center',
  },
  yearChipSelected: {
    backgroundColor: '#4F46E5',
  },
  yearChipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  yearChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  selectedDateLabel: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedDateVal: {
    color: '#1E1B4B',
    fontSize: 14,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
});
