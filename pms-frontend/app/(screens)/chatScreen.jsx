import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authFetch, useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

import community from '../../assets/images/racoo.jpeg';

const ChatScreen = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(null);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingRef = useRef(false);
  const typingClearRef = useRef(null);

  const router = useRouter();
  const { name, chatId, me } = useLocalSearchParams();
  const { token, apiBaseUrl } = useAuth();

  const myId = useMemo(() => (typeof me === 'string' ? me : null), [me]);

  const loadMessages = React.useCallback(async () => {
    if (!chatId || typeof chatId !== 'string') return;
    try {
      setError('');
      setLoading(true);
      const data = await authFetch(`/chats/${chatId}/messages?limit=50`, { method: 'GET' });
      setMessages(Array.isArray(data?.messages) ? data.messages : []);
    } catch (e) {
      setError(e?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const markRead = React.useCallback(async () => {
    if (!chatId || typeof chatId !== 'string') return;

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('message:read', { chatId });
      return;
    }

    try {
      await authFetch(`/chats/${chatId}/read`, { method: 'PUT' });
    } catch {
      // ignore
    }
  }, [chatId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  useEffect(() => {
    if (!chatId || typeof chatId !== 'string') return;
    if (!token) return;

    const baseUrl = apiBaseUrl;
    const socket = io(baseUrl, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:chats', [chatId]);
      socket.emit('message:read', { chatId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setConnected(false);
      setError(err?.message || 'Socket connection failed');
    });

    socket.on('message:new', (msg) => {
      const incomingChatId = msg?.chat?._id || msg?.chat;
      if (!incomingChatId || incomingChatId !== chatId) return;

      setMessages((prev) => {
        const id = msg?._id;
        if (id && prev.some((m) => m?._id === id)) return prev;
        return [...prev, msg];
      });

      if (msg?._id) socket.emit('message:delivered', { messageId: msg._id });
      socket.emit('message:read', { chatId });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    });

    socket.on('typing:start', ({ chatId: typingChatId, userId, username }) => {
      if (!typingChatId || typingChatId !== chatId) return;
      const myId = typeof me === 'string' ? me : null;
      if (myId && userId && String(userId) === String(myId)) return;

      setTyping(username || 'Someone');
      if (typingClearRef.current) clearTimeout(typingClearRef.current);
      typingClearRef.current = setTimeout(() => setTyping(null), 2500);
    });

    socket.on('typing:stop', ({ chatId: typingChatId, userId }) => {
      if (!typingChatId || typingChatId !== chatId) return;
      const myId = typeof me === 'string' ? me : null;
      if (myId && userId && String(userId) === String(myId)) return;
      setTyping(null);
    });

    socket.on('message:delivery:update', ({ messageId, deliveredTo }) => {
      if (!messageId) return;
      setMessages((prev) =>
        prev.map((m) => (m?._id === messageId ? { ...m, deliveredTo: deliveredTo || [] } : m))
      );
    });

    socket.on('message:read', ({ chatId: readChatId, userId }) => {
      if (!readChatId || readChatId !== chatId || !userId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (!m) return m;
          const rb = Array.isArray(m.readBy) ? m.readBy.map((x) => String(x)) : [];
          if (rb.includes(String(userId))) return m;
          return { ...m, readBy: [...(Array.isArray(m.readBy) ? m.readBy : []), userId] };
        })
      );
    });

    return () => {
      try {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (typingClearRef.current) clearTimeout(typingClearRef.current);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('message:new');
        socket.off('typing:start');
        socket.off('typing:stop');
        socket.off('message:delivery:update');
        socket.off('message:read');
        socket.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
  }, [apiBaseUrl, chatId, token]);

  const sendMessage = async () => {
    if (!chatId || typeof chatId !== 'string') return;
    const content = message.trim();
    if (!content || sending) return;

    try {
      setSending(true);
      const socket = socketRef.current;

      if (socket && socket.connected) {
        setMessage('');
        socket.emit('message:send', { chatId, content });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
        return;
      }

      const res = await authFetch(`/chats/${chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const created = res?.message;
      if (created) setMessages((prev) => [...prev, created]);
      else await loadMessages();

      setMessage('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleChangeText = (text) => {
    setMessage(text);
    const socket = socketRef.current;
    if (!socket || !socket.connected || !chatId || typeof chatId !== 'string') return;

    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit('typing:start', { chatId });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      socket.emit('typing:stop', { chatId });
    }, 900);
  };

  const uiMessages = useMemo(() => {
    return messages.map((m) => {
      const ts = m?.createdAt ? new Date(m.createdAt) : null;
      const time = ts && !Number.isNaN(ts.getTime())
        ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      const isMe = myId && (m?.sender?._id ? m.sender._id === myId : m?.sender === myId);

      let receipt = null;
      if (isMe) {
        const readBy = Array.isArray(m?.readBy) ? m.readBy.map((x) => String(x)) : [];
        const deliveredTo = Array.isArray(m?.deliveredTo) ? m.deliveredTo.map((x) => String(x)) : [];

        const otherRead = readBy.some((id) => myId && id !== String(myId));
        const otherDelivered = deliveredTo.some((id) => myId && id !== String(myId));

        receipt = otherRead ? 'Read' : otherDelivered ? 'Delivered' : 'Sent';
      }

      const senderName = m?.sender?.username || (isMe ? 'You' : 'User');
      const avatar = m?.sender?.photo ? { uri: m.sender.photo } : community;

      return {
        id: m?._id || String(Math.random()),
        sender: senderName,
        avatar,
        message: m?.content || '',
        time,
        isMe: !!isMe,
        receipt,
      };
    });
  }, [messages, myId]);

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
      {!item.isMe && <Image source={item.avatar} style={styles.avatar} />}
      
      <View style={styles.bubbleWrapper}>
        {!item.isMe && <Text style={styles.senderName}>{item.sender}</Text>}
        <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, item.isMe && styles.myMessageText]}>{item.message}</Text>
          <View style={styles.metaRow}>
            {!!item.receipt && item.isMe ? (
              <Text style={[styles.receipt, item.isMe && styles.myReceipt]}>{item.receipt}</Text>
            ) : null}
            <Text style={[styles.timestamp, item.isMe && styles.myTimestamp]}>{item.time}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Image source={community} style={styles.groupAvatar} />
          <View style={styles.textContainer}>
            <Text style={styles.groupName}>{typeof name === 'string' && name.trim() ? name : 'Chat'}</Text>
            {typing ? (
              <Text style={styles.typingText}>{typing} typing…</Text>
            ) : null}
            {/* <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.members}>122 members • 12 online</Text>
            </View> */}
          </View>
        </View>

        <TouchableOpacity style={styles.infoBtn}>
          <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ paddingTop: 30 }}>
          <ActivityIndicator size="small" color={Colors.light.success} />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#dc2626' }}>{error}</Text>
          <TouchableOpacity onPress={loadMessages} style={{ marginTop: 10 }}>
            <Text style={{ color: Colors.light.success, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={uiMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContent}
          ListHeaderComponent={<Text style={styles.timeHeader}>TODAY</Text>}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Write a message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={handleChangeText}
            multiline
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendDisabled]} 
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            <MaterialCommunityIcons name="send" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  textContainer: { marginLeft: 10 },
  groupAvatar: { width: 42, height: 42, borderRadius: 14 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  members: { fontSize: 11, color: '#6B7280' },
  typingText: { fontSize: 12, color: Colors.light.success, marginTop: 2, fontWeight: '700' },

  chatContent: { padding: 16, paddingBottom: 30 },
  timeHeader: { textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 20, letterSpacing: 1 },
  
  messageContainer: { flexDirection: 'row', marginBottom: 16, maxWidth: '85%' },
  myMessageContainer: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  theirMessageContainer: { alignSelf: 'flex-start' },
  
  avatar: { width: 32, height: 32, borderRadius: 10, alignSelf: 'flex-end' },
  bubbleWrapper: { marginLeft: 8, marginRight: 8 },
  senderName: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 4, marginLeft: 4 },
  
  bubble: { padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: Colors.light.success, borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 2 },
  
  messageText: { fontSize: 15, lineHeight: 20, color: '#1F2937' },
  myMessageText: { color: '#FFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 8 },
  timestamp: { fontSize: 10, color: '#9CA3AF' },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  receipt: { fontSize: 10, color: '#6B7280', fontWeight: '700' },
  myReceipt: { color: 'rgba(255,255,255,0.85)' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#1F2937',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: '#D1D5DB' },
});

export default ChatScreen;