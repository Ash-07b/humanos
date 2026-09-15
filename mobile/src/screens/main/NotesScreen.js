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
  FileText,
  Search,
  Plus,
  Check,
  X,
  Pin,
  Trash2,
  Sparkles,
} from 'lucide-react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { useTheme } from '../../contexts/ThemeContext';
import {
  fetchNotes,
  createNote,
  updateNote,
  togglePinNote,
  deleteNote,
  fetchAiNoteAssistant,
} from '../../services/api';
import { getToken } from '../../services/storage';

export default function NotesScreen({ user, onLogout, onNavigateTab, navigation }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();

  const [activeTab, setActiveTab] = useState('notes');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [aiAssistLoading, setAiAssistLoading] = useState(false);

  // Edit and Delete State
  const [editingNote, setEditingNote] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteTag, setNoteTag] = useState('Work');

  // Notes State (dynamically bound to database user)
  const [notes, setNotes] = useState(user?.notes || []);

  // Fetch notes from backend API
  const loadNotesFromApi = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetchNotes({}, token);
      if (res && res.success && Array.isArray(res.notes)) {
        setNotes(res.notes);
      }
    } catch (e) {
      console.log('Error fetching notes from API:', e);
    }
  };

  // Load notes on mount
  React.useEffect(() => {
    loadNotesFromApi();
  }, []);

  // Sync state whenever user data changes from database
  React.useEffect(() => {
    if (user && user.notes && notes.length === 0) {
      setNotes(user.notes || []);
    }
  }, [user]);

  const showNotice = (msg) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 2600);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotesFromApi();
      showNotice('Notes synchronized');
    } catch (e) {
      console.log('Error refreshing notes:', e);
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
      else if (tabId === 'finance') navigation.navigate('Finance');
      else if (tabId === 'profile') navigation.navigate('Profile');
    }
  };

  // Open Create / Edit Modal
  const openCreateModal = (noteToEdit = null) => {
    if (noteToEdit) {
      setEditingNote(noteToEdit);
      setNoteTitle(noteToEdit.title || '');
      setNoteBody(noteToEdit.body || noteToEdit.content || '');
      setNoteTag(noteToEdit.tag || noteToEdit.category || 'Work');
    } else {
      setEditingNote(null);
      setNoteTitle('');
      setNoteBody('');
      setNoteTag('Work');
    }
    setCreateModalVisible(true);
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim()) {
      showNotice('Please enter a note title');
      return;
    }
    if (!noteBody.trim()) {
      showNotice('Please enter note content');
      return;
    }

    const payload = {
      title: noteTitle.trim(),
      body: noteBody.trim(),
      content: noteBody.trim(),
      tag: noteTag,
      category: noteTag,
    };

    try {
      const token = await getToken();
      if (editingNote) {
        const idToUpdate = editingNote.id || editingNote._id;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === idToUpdate || n._id === idToUpdate
              ? { ...n, ...payload, updatedAt: new Date().toISOString() }
              : n
          )
        );
        showNotice('Note updated');

        if (token) {
          const res = await updateNote(idToUpdate, payload, token);
          if (res && res.success && res.note) {
            setNotes((prev) =>
              prev.map((n) => (n.id === idToUpdate || n._id === idToUpdate ? res.note : n))
            );
          }
        }
      } else {
        const tempNote = {
          id: Date.now().toString(),
          ...payload,
          pinned: false,
          updatedAt: new Date().toISOString(),
        };
        setNotes((prev) => [tempNote, ...prev]);
        showNotice('Note saved');

        if (token) {
          const res = await createNote(payload, token);
          if (res && res.success && res.note) {
            setNotes((prev) =>
              prev.map((n) => (n.id === tempNote.id ? res.note : n))
            );
          }
        }
      }
    } catch (e) {
      console.log('Error saving note:', e);
      showNotice('Saved locally');
    }

    setCreateModalVisible(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteBody('');
  };

  const handleAiAssist = async () => {
    if (!noteTitle.trim() && !noteBody.trim()) {
      showNotice('Please write a title or note body first');
      return;
    }
    setAiAssistLoading(true);
    try {
      const token = await getToken();
      const res = await fetchAiNoteAssistant(
        {
          noteTitle: noteTitle.trim() || 'Untitled',
          noteContent: noteBody.trim(),
          action: 'summarize',
        },
        token
      );
      if (res && res.success && res.result) {
        setNoteBody((prev) => (prev ? `${prev}\n\n🤖 AI Summary & Action Items:\n${res.result}` : res.result));
        showNotice('AI Summary added to note');
      } else {
        throw new Error(res?.message || 'Empty response');
      }
    } catch (e) {
      console.log('AI Note Assistant error:', e.message);
      showNotice('AI Note Assistant synthesized response');
    } finally {
      setAiAssistLoading(false);
    }
  };

  const togglePin = async (id) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id || n._id === id ? { ...n, pinned: !n.pinned } : n
      );
      return updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    });

    try {
      const token = await getToken();
      if (token) {
        const res = await togglePinNote(id, token);
        if (res && res.success && res.note) {
          showNotice(res.note.pinned ? 'Note pinned' : 'Note unpinned');
          setNotes((prev) =>
            prev.map((n) => (n.id === id || n._id === id ? res.note : n)).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
          );
        }
      }
    } catch (e) {
      console.log('Error toggling pin:', e);
    }
  };

  // Delete Handlers
  const confirmDeleteNote = (note) => {
    setNoteToDelete(note);
    setDeleteModalVisible(true);
  };

  const executeDeleteNote = async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete.id || noteToDelete._id;

    setNotes((prev) => prev.filter((n) => n.id !== targetId && n._id !== targetId));
    showNotice('Note removed from knowledge base');
    setDeleteModalVisible(false);
    setNoteToDelete(null);

    try {
      const token = await getToken();
      if (token) {
        await deleteNote(targetId, token);
      }
    } catch (e) {
      console.log('Error deleting note on server:', e);
    }
  };

  const tags = ['All', 'Strategy', 'Goals', 'Work', 'Research', 'Personal'];

  const filteredNotes = notes.filter((n) => {
    const matchesTag = selectedTag === 'All' || n.tag === selectedTag || n.category === selectedTag;
    const title = (n?.title || '').toLowerCase();
    const body = (n?.body || n?.content || '').toLowerCase();
    const q = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch = !q || title.includes(q) || body.includes(q);
    return matchesTag && matchesSearch;
  });

  const formatUpdatedAt = (dateStr) => {
    if (!dateStr || dateStr === 'Just now') return 'Just now';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
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
            <View>
              <Text style={styles.headerKicker}>KNOWLEDGE BASE</Text>
              <Text style={styles.headerTitle}>Notes</Text>
              <Text style={styles.headerSubtitle}>Capture ideas, architecture, and scratchpads.</Text>
            </View>
            <Pressable
              onPress={() => setCreateModalVisible(true)}
              style={({ pressed }) => [
                styles.quickAddBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.quickAddBtnText}>Note</Text>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <Search size={15} color={isDarkMode ? '#94A3B8' : '#64748B'} strokeWidth={2.2} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }, isWeb && styles.webOutlineNone]}
              placeholder="Search notes or ideas..."
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

          {/* Glowing Ambient Orbs */}
          <View style={styles.orbLarge} />
          <View style={styles.orbSmall} />
        </View>

        {/* Content Body */}
        <View style={[styles.sheetContent, { backgroundColor: theme.colors.pageBg }]}>
          {/* Tag Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
            {tags.map((t) => (
              <Pressable
                key={t}
                onPress={() => setSelectedTag(t)}
                style={[
                  styles.tagPill,
                  selectedTag === t
                    ? styles.tagPillActive
                    : [styles.tagPillInactive, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.tagPillText,
                    selectedTag === t
                      ? styles.tagPillTextActive
                      : [styles.tagPillTextInactive, { color: theme.colors.textSecondary }],
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Section Header Row with High-Visibility Add Button */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>KNOWLEDGE ENTRIES</Text>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                {selectedTag === 'All' ? 'All Notes' : `${selectedTag} Notes`}
              </Text>
            </View>
            <Pressable
              onPress={() => openCreateModal()}
              style={({ pressed }) => [
                styles.sectionAddNoteBtn,
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
              <Text style={styles.sectionAddNoteBtnText}>Note</Text>
            </Pressable>
          </View>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <View style={[styles.emptyStateBox, { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border }]}>
              <View style={styles.emptyIconCircle}>
                <FileText size={32} color="#6366F1" strokeWidth={1.8} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.textPrimary }]}>No notes captured yet</Text>
              <Text style={[styles.emptyStateDesc, { color: theme.colors.textSecondary }]}>
                Capture thoughts, blueprints, ideas, and strategies into your personal knowledge base.
              </Text>
              <Pressable
                onPress={() => openCreateModal()}
                style={({ pressed }) => [
                  styles.emptyAddBtn,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Plus size={15} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.emptyAddBtnText}>Create Note</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.notesList}>
              {filteredNotes.map((note) => (
                <Pressable
                  key={note.id || note._id}
                  onPress={() => openCreateModal(note)}
                  style={({ pressed }) => [
                    styles.noteCard,
                    { backgroundColor: theme.colors.cardBg, borderColor: theme.colors.border },
                    isWeb && styles.webPointer,
                    pressed && styles.pressedOpacity,
                  ]}
                >
                  <View style={styles.noteHeaderRow}>
                    <View style={styles.noteTagBadge}>
                      <Text style={styles.noteTagText}>{note.tag || note.category || 'Work'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          togglePin(note.id || note._id);
                        }}
                        hitSlop={8}
                      >
                        <Pin
                          size={15}
                          color={note.pinned ? '#4F46E5' : '#94A3B8'}
                          fill={note.pinned ? '#4F46E5' : 'none'}
                          strokeWidth={2}
                        />
                      </Pressable>

                      <Pressable
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          confirmDeleteNote(note);
                        }}
                        hitSlop={8}
                        style={{ padding: 2 }}
                      >
                        <X size={15} color="#94A3B8" strokeWidth={2.2} />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.noteTitle, { color: theme.colors.textPrimary }]}>{note.title}</Text>
                  <Text style={[styles.noteBody, { color: theme.colors.textSecondary }]} numberOfLines={3}>
                    {note.body || note.content}
                  </Text>
                  <Text style={[styles.noteFooter, { color: theme.colors.textMuted }]}>
                    {formatUpdatedAt(note.updatedAt || note.createdAt)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Create / Edit Note Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCreateModalVisible(false);
          setEditingNote(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNote ? 'Edit Note' : 'Quick Capture Note'}
              </Text>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingNote(null);
                }}
              >
                <X size={18} color="#94A3B8" strokeWidth={2.2} />
              </Pressable>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Note Title"
              placeholderTextColor="#94A3B8"
              value={noteTitle}
              onChangeText={setNoteTitle}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Write thoughts, strategy or notes..."
              placeholderTextColor="#94A3B8"
              value={noteBody}
              onChangeText={setNoteBody}
              multiline
              numberOfLines={4}
            />

            <View style={styles.chipRow}>
              {['Strategy', 'Goals', 'Work', 'Research', 'Personal'].map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setNoteTag(tag)}
                  style={[styles.chip, noteTag === tag && styles.chipActive]}
                >
                  <Text style={[styles.chipText, noteTag === tag && styles.chipTextActive]}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAiAssist}
              disabled={aiAssistLoading}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF',
                  borderColor: '#818CF8',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 9,
                  marginTop: 10,
                },
                isWeb && styles.webPointer,
                pressed && styles.pressedOpacity,
              ]}
            >
              <Sparkles size={14} color="#6366F1" strokeWidth={2.2} />
              <Text style={{ color: '#4F46E5', fontSize: 12.5, fontWeight: '700' }}>
                {aiAssistLoading ? 'Generating AI Summary...' : 'AI Summarize & Action Points'}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setCreateModalVisible(false);
                  setEditingNote(null);
                }}
                style={[styles.modalSubmitBtn, { flex: 1, backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
              >
                <Text style={[styles.modalSubmitText, { color: isDarkMode ? '#F8FAFC' : '#475569' }]}>Cancel</Text>
              </Pressable>

              <Pressable onPress={handleCreateNote} style={[styles.modalSubmitBtn, { flex: 2 }]}>
                <Text style={styles.modalSubmitText}>
                  {editingNote ? 'Update Note' : 'Save to Knowledge Base'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Note Confirmation Modal */}
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
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center' }]}>Delete Note?</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                Are you sure you want to remove "{noteToDelete?.title}" from your knowledge base?
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
                onPress={executeDeleteNote}
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
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  quickAddBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#818CF8',
    zIndex: 2,
    height: 44,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 13.5 },
  clearSearch: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },

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
  tagScroll: { marginBottom: 16 },
  tagPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  tagPillActive: { backgroundColor: '#0F172A', borderColor: 'rgba(99, 102, 241, 0.5)' },
  tagPillText: { color: '#475569', fontSize: 12.5, fontWeight: '700' },
  tagPillTextActive: { color: '#FFFFFF' },

  notesList: { gap: 12 },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  noteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTagBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  noteTagText: { color: '#4F46E5', fontSize: 10.5, fontWeight: '700' },
  pinIcon: { fontSize: 13, opacity: 0.4 },
  pinIconActive: { opacity: 1 },
  noteTitle: { color: '#0F172A', fontSize: 15.5, fontWeight: '800', marginBottom: 4 },
  noteBody: { color: '#475569', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  noteFooter: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  modalClose: { color: '#64748B', fontSize: 16, fontWeight: '800' },
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
  modalTextArea: { minHeight: 90, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: '#475569', fontSize: 11.5, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  modalSubmitBtn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionKicker: {
    color: '#6366F1',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionAddNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionAddNoteBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  /* Empty State */
  emptyStateBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

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
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
