import React, { useState, useRef, useEffect } from 'react';
import {
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
  KeyboardAvoidingView,
} from 'react-native';
import {
  Sparkles,
  MessageSquare,
  Send,
  X,
  Bot,
  RotateCcw,
  Zap,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  User,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchAiGeneralAssistant } from '../services/api';
import { getToken } from '../services/storage';

const QUICK_PROMPTS = [
  'How do I use HumanOS?',
  'How do habit streaks work?',
  'Tips for high focus today',
  'How do I connect goals to habits?',
  'Explain the AI Briefing',
];

const APP_KNOWLEDGE_BASE = {
  'how do i use humanos': `Welcome to **HumanOS**! Here's a quick roadmap to master your operating system:

1. ⚡ **Dashboard**: View your daily priorities, live AI Executive Briefing, energy focus modes, and active habit loops.
2. 📋 **Tasks**: Manage priority queues, set start/end times, and schedule audio reminders.
3. 🔁 **Habits & Routines**: Track daily or weekly consistency with automatic streak telemetry.
4. 🎯 **Goals**: Break long-term aspirations into milestones, track % completion, and connect supporting habits.
5. 💳 **Finance**: Log income and expenses with automatic cashflow and savings rate calculations.
6. ❤️ **Health**: Monitor vital telemetry, medications, and wellness recommendations.
7. 📝 **Notes**: Capture thoughts and leverage AI summarization.
8. 📅 **Calendar**: Plan focus blocks and inspect agenda timelines.`,

  'how do habit streaks work': `🔥 **Habit Streaks** measure your consistency:

• **Increment**: Every day you tap the checkmark on a habit, your streak count increases by +1 day.
• **Status**: Habits reset daily so you can maintain steady momentum.
• **Supporting Goals**: Your active habit streaks link into overarching milestones in the Goals tab to power your overall consistency score.`,

  'tips for high focus today': `🧠 **High-Focus Execution Tips for Today**:

1. **Rule of 3**: Identify your top 3 non-negotiable tasks and tackle the highest-leverage one before noon.
2. **Ultradian Sprints**: Work in 90-minute deep work blocks followed by 10-minute complete mental recharge.
3. **Low Cognitive Friction**: Clear done tasks to keep your priority queue clean and motivating.`,

  'how do i connect goals to habits': `🎯 **Connecting Goals to Habits**:

Small daily routines drive big quarterly milestones!
1. In the **Goals** tab, scroll down to **Supporting Habits**.
2. Tap **+ Add Habit** to link a routine (e.g., *"Daily 30m Deep Work"*).
3. Completed habits automatically feed into your dashboard loop and assist your milestone progress.`,

  'explain the ai briefing': `✨ **Live AI Executive Briefing**:

Your executive briefing synthesizes your current operating mood (*High Focus, Execution, Clarity, etc.*) and pending tasks to give you an actionable 2-sentence productivity strategy. Tap **✦ Refresh** anytime on the dashboard to generate a fresh synthesis!`,
};

export default function AiChatWidget({ user, currentMood = 'High Focus' }) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { theme, isDarkMode } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const displayName = user?.fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'there');

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${displayName}! I am your HumanOS Assistant & Life Copilot. Ask me how to use any feature in the app or for daily productivity and wellness advice.`,
      time: 'Just now',
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const findKnowledgeAnswer = (query) => {
    const cleanQuery = query.toLowerCase().trim().replace(/[?!.,]/g, '');
    for (const [key, answer] of Object.entries(APP_KNOWLEDGE_BASE)) {
      if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
        return answer;
      }
    }
    if (cleanQuery.includes('task') || cleanQuery.includes('todo')) {
      return `📋 In the **Tasks** tab or on your **Dashboard**, tap **+ Add Task** to queue up intentions. You can set start/end times and enable automatic reminders to stay on schedule.`;
    }
    if (cleanQuery.includes('habit') || cleanQuery.includes('routine')) {
      return `🔁 Track habits directly from the Dashboard or Goals screen. Tap the check circle to mark complete and build your daily streak!`;
    }
    if (cleanQuery.includes('goal')) {
      return `🎯 Use the **Goals** tab to set target completion dates, track milestones with progress bars, and request AI goal recommendations.`;
    }
    if (cleanQuery.includes('finance') || cleanQuery.includes('money')) {
      return `💳 In the **Finance** tab, you can log transactions, balance sheets, and review income vs. expense cashflow ratios.`;
    }
    if (cleanQuery.includes('health') || cleanQuery.includes('medication')) {
      return `❤️ The **Health** module allows logging vital telemetry, medication schedules, and requesting personalized health insights.`;
    }
    return null;
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsgId = Date.now().toString();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    scrollToBottom();

    // Check local knowledge base first for instant high-quality HumanOS guides
    const localMatch = findKnowledgeAnswer(query);

    try {
      const token = await getToken();
      const payload = {
        prompt: query,
        module: 'Dashboard Copilot',
        context: {
          user: displayName,
          focusMood: currentMood,
          isAppHelp: true,
        },
      };

      const res = await fetchAiGeneralAssistant(payload, token);
      let replyText = '';

      if (res && res.success && res.reply && res.reply.trim().length > 0) {
        replyText = res.reply;
      } else if (localMatch) {
        replyText = localMatch;
      } else {
        replyText = `Focus on aligning your actions with your daily intentions. Break down complex priorities into bite-sized 25-minute sprints to maintain momentum.`;
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: localMatch || `I'm here to assist with HumanOS routines, tasks, and daily productivity. Let me know what you'd like to optimize today!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'ai',
        text: `Conversation reset. How can I assist you with HumanOS or your daily routine today, ${displayName}?`,
        time: 'Just now',
      },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.floatingLauncher,
          {
            backgroundColor: isDarkMode ? '#4F46E5' : '#4338CA',
            shadowColor: '#4F46E5',
          },
          isWeb && styles.webPointer,
          pressed && styles.pressedScale,
        ]}
      >
        <View style={styles.launcherInner}>
          <Sparkles size={16} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.launcherText}>Ask Assistant</Text>
          <View style={styles.onlineDot} />
        </View>
      </Pressable>

      {/* Chat Modal / Slide-up Box */}
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />

          <View
            style={[
              styles.chatContainer,
              isDesktop && styles.desktopChatContainer,
              {
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.chatHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.botAvatar, { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' }]}>
                  <Bot size={18} color="#6366F1" strokeWidth={2.2} />
                  <View style={styles.activeIndicator} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>HumanOS Copilot</Text>
                  <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>App Guide & Life Assistant</Text>
                </View>
              </View>

              <View style={styles.headerRightActions}>
                <Pressable
                  onPress={handleResetChat}
                  hitSlop={8}
                  style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressedOpacity, isWeb && styles.webPointer]}
                >
                  <RotateCcw size={14} color="#94A3B8" strokeWidth={2} />
                </Pressable>

                <Pressable
                  onPress={() => setIsOpen(false)}
                  hitSlop={8}
                  style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressedOpacity, isWeb && styles.webPointer]}
                >
                  <X size={18} color={theme.colors.textPrimary} strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            {/* Quick Suggestions Strip */}
            <View style={[styles.quickPromptSection, { borderBottomColor: theme.colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptRow}>
                {QUICK_PROMPTS.map((promptText) => (
                  <Pressable
                    key={promptText}
                    onPress={() => handleSendMessage(promptText)}
                    style={({ pressed }) => [
                      styles.promptChip,
                      { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border },
                      isWeb && styles.webPointer,
                      pressed && styles.pressedOpacity,
                    ]}
                  >
                    <Lightbulb size={11} color="#6366F1" strokeWidth={2.2} />
                    <Text style={[styles.promptChipText, { color: theme.colors.textSecondary }]}>{promptText}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Message Stream */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
            >
              {messages.map((item) => {
                const isUser = item.sender === 'user';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.messageBubbleWrapper,
                      isUser ? styles.userBubbleWrapper : styles.aiBubbleWrapper,
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.miniAvatar}>
                        <Sparkles size={11} color="#6366F1" strokeWidth={2.4} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isUser
                          ? styles.userMessageBubble
                          : [styles.aiMessageBubble, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isUser ? styles.userMessageText : { color: theme.colors.textPrimary },
                        ]}
                      >
                        {item.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTimeText,
                          isUser ? styles.userTimeText : { color: theme.colors.textMuted },
                        ]}
                      >
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {loading && (
                <View style={[styles.messageBubbleWrapper, styles.aiBubbleWrapper]}>
                  <View style={styles.miniAvatar}>
                    <Sparkles size={11} color="#6366F1" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.aiMessageBubble, styles.loadingBubble, { backgroundColor: theme.colors.cardAltBg, borderColor: theme.colors.border }]}>
                    <ActivityIndicator size="small" color="#6366F1" />
                    <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.inputBarWrapper, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.cardBg }]}>
              <TextInput
                style={[
                  styles.chatInput,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.cardAltBg,
                    borderColor: theme.colors.border,
                  },
                  isWeb && styles.webOutlineNone,
                ]}
                placeholder="Ask about HumanOS or daily routines..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSendMessage()}
                returnKeyType="send"
              />
              <Pressable
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || loading}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!inputText.trim() || loading) && styles.sendButtonDisabled,
                  isWeb && styles.webPointer,
                  pressed && styles.pressedOpacity,
                ]}
              >
                <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingLauncher: {
    position: 'absolute',
    right: 18,
    bottom: 82,
    zIndex: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  launcherInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  launcherText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  pressedScale: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  chatContainer: {
    width: '100%',
    maxHeight: '85%',
    height: 560,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  desktopChatContainer: {
    maxWidth: 480,
    borderRadius: 28,
    marginBottom: 40,
    height: 600,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  quickPromptSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  quickPromptRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  aiBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userMessageBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  messageTimeText: {
    fontSize: 9.5,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 13,
    borderWidth: 1,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
  pressedOpacity: {
    opacity: 0.7,
  },
  webPointer: Platform.OS === 'web' ? { cursor: 'pointer' } : {},
  webOutlineNone: Platform.OS === 'web' ? { outlineStyle: 'none' } : {},
});
