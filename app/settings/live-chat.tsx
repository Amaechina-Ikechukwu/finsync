import { ThemedText } from '@/components/ThemedText';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
// polling will replace realtime DB listener
import { useColorScheme } from '@/hooks/useColorScheme';
import apiClient from '@/services/apiClient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, FlatList, Keyboard, KeyboardAvoidingView, LayoutAnimation, Platform, StyleSheet, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatMessage = {
    id: string;
    text: string;
    from: 'user' | 'agent';
    timestamp: number;
};

export default function LiveChatScreen() {
    const colorScheme = useColorScheme();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const flatListRef = useRef<FlatList<ChatMessage> | null>(null);
    const insets = useSafeAreaInsets();
    const [composerHeight, setComposerHeight] = useState<number>(56);
    const [headerHeight, setHeaderHeight] = useState<number>(56);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;

    useEffect(() => {
        // Enable LayoutAnimation on Android
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }

        // Fetch messages from API
        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const res = await apiClient.get<{ messages: any[]; profile?: any }>(`/messaging/messages`);
                if (res.success && res.data && Array.isArray(res.data.messages)) {
                    const mapped = res.data.messages.map((m: any) => ({
                        id: m.id,
                        text: m.text,
                        from: (m.from === 'admin' || m.from === 'agent') ? 'agent' : 'user',
                        timestamp: m.createdAt ?? Date.now(),
                    })) as ChatMessage[];
                    // sort ascending by timestamp
                    mapped.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setMessages(mapped);
                    setIsLoading(false);
                    return;
                }
            } catch (e) {
                // fall through to welcome
            }

            // fallback welcome message
            const welcome: ChatMessage = {
                id: 'm0',
                text: 'Hi there! How can we help you today?',
                from: 'agent',
                timestamp: Date.now()
            };
            setMessages([welcome]);
            setIsLoading(false);
        };

        fetchMessages();
    }, []);

    // Adaptive polling for new messages with backoff and background pause
    useEffect(() => {
        let mounted = true;
        let stopped = false;
        let consecutiveErrors = 0;
    let timeoutId: number | NodeJS.Timeout | null = null;

        const BASE_INTERVAL = 15000; // 15s base interval to avoid rate limits
        const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutes

        const isAppActive = () => AppState.currentState === 'active';

        const scheduleNext = (delay: number) => {
            if (!mounted || stopped) return;
            // clear any previous
            if (timeoutId) clearTimeout(timeoutId as any);
            timeoutId = setTimeout(() => {
                void runPoll();
            }, delay);
        };

        const runPoll = async () => {
            if (!mounted || stopped) return;
            // pause polling when app is backgrounded
            if (!isAppActive()) {
                // check again in 30s
                scheduleNext(30000);
                return;
            }

            try {
                const res = await apiClient.get<{ messages: any[]; profile?: any }>(`/messaging/messages`);
                if (!mounted || stopped) return;
                if (res.success && res.data && Array.isArray(res.data.messages)) {
                    const mapped = res.data.messages.map((m: any) => ({
                        id: m.id,
                        text: m.text,
                        from: (m.from === 'admin' || m.from === 'agent') ? 'agent' : 'user',
                        timestamp: m.createdAt ?? Date.now(),
                    })) as ChatMessage[];
                    mapped.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

                    setMessages((prev) => {
                        const merged = [...prev];
                        mapped.forEach((msg) => {
                            if (!merged.some((m) => m.id === msg.id)) merged.push(msg);
                        });
                        merged.sort((a, b) => a.timestamp - b.timestamp);
                        return merged;
                    });
                }

                // success -> reset error counter and schedule next at base interval
                consecutiveErrors = 0;
                scheduleNext(BASE_INTERVAL + Math.round(Math.random() * 2000)); // small jitter
            } catch (e) {
                consecutiveErrors += 1;
                // exponential backoff
                const backoff = Math.min(BASE_INTERVAL * Math.pow(2, consecutiveErrors), MAX_BACKOFF);
                const jitter = Math.round(Math.random() * 3000);
                scheduleNext(backoff + jitter);
            }
        };

        // start polling immediately
        void runPoll();

        const handleAppState = (nextAppState: AppStateStatus) => {
            // if we become active, poll immediately
            if (nextAppState === 'active') {
                consecutiveErrors = 0;
                void runPoll();
            }
        };

        const sub = AppState.addEventListener('change', handleAppState);

        return () => {
            mounted = false;
            stopped = true;
            if (timeoutId) clearTimeout(timeoutId as any);
            sub.remove();
        };
    }, []);


    useEffect(() => {
        // scroll to bottom on new message
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd?.(), 50);
        }
    }, [messages]);

    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
            setKeyboardHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const sendMessage = async (msgText: string) => {
        if (!msgText.trim()) return;
        const tempId = `temp-${Date.now()}`;
        const tempMsg: ChatMessage = {
            id: tempId,
            text: msgText,
            from: 'user',
            timestamp: Date.now(),
        };

        // Optimistic UI update
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setMessages((prev) => [...prev, tempMsg]);
        setText('');

        try {
            const res = await apiClient.post<{ id: string; userId?: string; from?: string; text: string; createdAt?: number }>(`/messaging/messages`, { text: msgText });
            if (res.success && res.data && res.data.id) {
                const serverMsg: ChatMessage = {
                    id: res.data.id,
                    text: res.data.text,
                    from: (res.data.from === 'admin' || res.data.from === 'agent') ? 'agent' : 'user',
                    timestamp: res.data.createdAt ?? Date.now(),
                };
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)));
                // Optionally scroll to end
                setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 50);
                return;
            }
            throw new Error(res.error || 'Send failed');
        } catch (error) {
            // Rollback optimistic message
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            // Add fallback agent reply to keep UX predictable
            setTimeout(() => {
                const agentMsg: ChatMessage = {
                    id: `a-${Date.now()}`,
                    text: 'Thanks — our team will get back to you shortly.',
                    from: 'agent',
                    timestamp: Date.now(),
                };
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages((prev) => [...prev, agentMsg]);
            }, 400);
        }
    };

    const generateAgentReply = (input: string) => {
        // Basic canned responses; in future wire to real backend/websocket
        const lower = input.toLowerCase();
        if (lower.includes('balance')) return 'I can help with your balance. Open the Accounts screen to view details.';
        if (lower.includes('transfer')) return 'To make a transfer, go to Transfers > New Transfer. Need me to walk you through?';
        if (lower.includes('pin') || lower.includes('password')) return 'You can change your transaction PIN from Settings > Change Transaction PIN.';
        return "Thanks for the message — our team will get back to you shortly. Meanwhile, can you provide more details?";
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.from === 'user';
        // Enforce strict black/white scheme for bubbles
        const bubbleBg = isUser ? Palette.black : Palette.white;
        const bubbleText = isUser ? Palette.white : Palette.black;
        const bubbleBorder = borderColor;
        return (
            <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
                <View style={[styles.bubble, { backgroundColor: bubbleBg, borderColor: bubbleBorder } , isUser ? styles.bubbleRight : styles.bubbleLeft]}>
                    <ThemedText style={{ color: bubbleText }}>{item.text}</ThemedText>
                </View>
            </View>
        );
    };

    const keyboardOffset = Platform.OS === 'ios' ? insets.top + headerHeight : 0;
    const keyboardPadding = Platform.OS === 'android' ? keyboardHeight : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}> 
            <View
                style={[styles.header, { borderBottomColor: borderColor }]}
                onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={22} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: textColor }]}>Live Chat</ThemedText>
                <View style={styles.headerSpacer} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={keyboardOffset}
            >
                {isLoading ? (
                    <View style={styles.loadingWrapper}>
                        <FSActivityLoader />
                    </View>
                ) : (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={m => m.id}
                            renderItem={renderMessage}
                            contentContainerStyle={[styles.chatList, { paddingBottom: composerHeight + 8 }]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        />

                        <View
                            style={[
                                styles.composer,
                                {
                                    borderTopColor: borderColor,
                                    backgroundColor: backgroundColor,
                                    marginBottom: keyboardPadding
                                }
                            ]}
                            onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
                        > 
                            <TextInput
                                value={text}
                                onChangeText={setText}
                                placeholder="Type a message..."
                                placeholderTextColor={Palette.gray}
                                style={[
                                    styles.input,
                                    { color: textColor, backgroundColor: cardBackground }
                                ]}
                                multiline
                                onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 100)}
                                textAlignVertical="top"
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: text.trim() ? Palette.primary : Palette.gray }]}
                                onPress={() => sendMessage(text)}
                                disabled={!text.trim()}
                                activeOpacity={0.8}
                            >
                                <IconSymbol name="paperplane.fill" size={18} color={Palette.white} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: { padding: 6 },
    headerTitle: { fontSize: 18, fontWeight: '600', fontFamily: 'Belgrano-Regular', flex: 1, textAlign: 'center', marginRight: 32 },
    headerSpacer: { width: 32 },
    content: { flex: 1 },
    chatList: { padding: 16, paddingBottom: 8 },
    loadingWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageRow: { marginVertical: 6, flexDirection: 'row' },
    messageRowLeft: { justifyContent: 'flex-start' },
    messageRowRight: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '78%', padding: 12, borderRadius: 12, borderWidth: 1 },
    bubbleLeft: { borderTopLeftRadius: 4 },
    bubbleRight: { borderTopRightRadius: 4 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1 },
    input: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        marginRight: 8,
        minHeight: 44,
        maxHeight: 120
    },
    sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
