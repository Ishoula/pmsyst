import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Platform, ActivityIndicator } from 'react-native';
import UserNavbar from '../../components/UserNavbar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch, useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

import community from '../../assets/images/racoo.jpeg';
import { Colors } from '../../constants/colors';

const MessagesScreen = () => {
  const router = useRouter();
  const { token, apiBaseUrl } = useAuth();

  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChats = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const data = await authFetch('/chats', { method: 'GET' });
      setMe(data?.me || null);
      setChats(Array.isArray(data?.chats) ? data.chats : []);
    } catch (e) {
      setError(e?.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  useEffect(() => {
    if (!token) return;

    const socket = io(apiBaseUrl, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
      autoConnect: true,
    });

    socket.on('message:new', (msg) => {
      const chatId = msg?.chat?._id || msg?.chat;
      if (!chatId) return;

      setChats((prev) => {
        const idx = prev.findIndex((c) => c?._id === chatId);
        if (idx === -1) return prev;

        const existing = prev[idx];
        const myId = typeof me === 'string' ? me : (me?._id || null);
        const senderId = msg?.sender?._id || msg?.sender;
        const isFromMe = myId && senderId && String(senderId) === String(myId);

        const nextUnread = isFromMe
          ? (typeof existing?.unreadCount === 'number' ? existing.unreadCount : 0)
          : (typeof existing?.unreadCount === 'number' ? existing.unreadCount + 1 : 1);

        const updated = {
          ...existing,
          lastMessage: msg,
          updatedAt: msg?.createdAt || new Date().toISOString(),
          unreadCount: nextUnread,
        };

        const next = [...prev];
        next.splice(idx, 1);
        next.unshift(updated);
        return next;
      });
    });

    socket.on('message:read', ({ chatId, userId }) => {
      const myId = typeof me === 'string' ? me : (me?._id || null);
      if (!chatId || !myId) return;
      if (!userId || String(userId) !== String(myId)) return;

      setChats((prev) =>
        prev.map((c) => (c?._id === chatId ? { ...c, unreadCount: 0 } : c))
      );
    });

    socket.on('user:online', (userId) => {
      if (!userId) return;
      setChats((prev) =>
        prev.map((c) => {
          const members = Array.isArray(c?.members) ? c.members : [];
          const nextMembers = members.map((m) =>
            m?._id && String(m._id) === String(userId) ? { ...m, isOnline: true } : m
          );
          if (nextMembers === members) return c;
          return { ...c, members: nextMembers };
        })
      );
    });

    socket.on('user:offline', (userId) => {
      if (!userId) return;
      setChats((prev) =>
        prev.map((c) => {
          const members = Array.isArray(c?.members) ? c.members : [];
          const nextMembers = members.map((m) =>
            m?._id && String(m._id) === String(userId) ? { ...m, isOnline: false } : m
          );
          if (nextMembers === members) return c;
          return { ...c, members: nextMembers };
        })
      );
    });

    return () => {
      try {
        socket.off('message:new');
        socket.off('message:read');
        socket.off('user:online');
        socket.off('user:offline');
        socket.disconnect();
      } catch {
        // ignore
      }
    };
  }, [apiBaseUrl, me, token]);

  const uiChats = useMemo(() => {
    const myId = typeof me === 'string' ? me : (me?._id || null);
    return chats.map((c) => {
      const members = Array.isArray(c.members) ? c.members : [];
      const other = myId ? members.find((m) => m?._id && m._id !== myId) : members[0];
      const displayName = c.isGroup ? (c.name || 'Group') : (other?.username || 'Chat');
      const photo = other?.photo;
      const avatarSource = photo ? { uri: photo } : community;
      const online = !!other?.isOnline;
      const lastMessageText = c?.lastMessage?.content ? c.lastMessage.content : 'No messages yet';
      const lastTime = c?.lastMessage?.createdAt || c?.updatedAt;
      const time = lastTime ? new Date(lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const unreadCount = typeof c.unreadCount === 'number' ? c.unreadCount : 0;

      return {
        id: c._id,
        name: displayName,
        avatar: avatarSource,
        lastMessage: lastMessageText,
        time,
        unreadStatus: unreadCount > 0,
        online,
        unreadCount,
      };
    });
  }, [chats, me]);

  const openChat = (item) => {
    router.push({
      pathname: '/chatScreen',
      params: { chatId: item.id, name: item.name, me: typeof me === 'string' ? me : me?._id },
    });
  };

  const renderAvatarItem = ({ item }) => (
    <TouchableOpacity style={styles.avatarWrapper} onPress={() => openChat(item)}>
      <View style={[styles.avatarBorder, { borderColor: item.online ? '#4ADE80' : '#E5E7EB' }]}>
        <Image source={item.avatar} style={styles.topAvatar} />
      </View>
      <Text style={styles.avatarName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.messageCard} onPress={() => openChat(item)}>
      <View style={styles.avatarContainer}>
        <Image source={item.avatar} style={styles.listAvatar} />
        {item.online && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.name, item.unreadStatus && styles.unreadText]}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={[styles.lastMessage, item.unreadStatus && styles.unreadSubtext]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadStatus && <View style={styles.unreadBadge} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <UserNavbar title="Smart Poultry" showBell={true} />

      <View style={styles.headerArea}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Messages</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.newMessageBtn}
              onPress={() => router.push('/newChat')}
            >
              <Text style={styles.newMessageText}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.groupBtn}
              onPress={() => router.push('/newGroupChat')}
            >
              <Text style={styles.groupText}>Group</Text>
            </TouchableOpacity>
          </View>
          {/* <TouchableOpacity style={styles.searchIcon}>
            <Text>🔍</Text>
          </TouchableOpacity> */}
        </View>
        <FlatList
          horizontal
          data={uiChats.slice(0, 10)}
          renderItem={renderAvatarItem}
          keyExtractor={(item) => `top-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topAvatarsContent}
        />
      </View>

      <View style={styles.messageSheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sectionTitle}>RECENT CONVERSATIONS</Text>
          <TouchableOpacity><Text style={styles.markRead}>Mark all as read</Text></TouchableOpacity>
        </View>

        <FlatList
          data={uiChats}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}
          ListEmptyComponent={
            loading ? (
              <View style={{ paddingVertical: 30 }}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            ) : error ? (
              <Text style={{ color: '#dc2626', paddingVertical: 20 }}>{error}</Text>
            ) : (
              <Text style={{ color: '#6B7280', paddingVertical: 20 }}>No chats yet</Text>
            )
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginLeft: 20,
    marginVertical: 10,
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newMessageBtn: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  newMessageText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  groupBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  groupText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  topAvatarsContent: { paddingHorizontal: 20, paddingVertical: 10 },
  avatarWrapper: { alignItems: 'center', marginRight: 20 },
  avatarBorder: {
    padding: 3,
    borderRadius: 24, // Modern Squircle-ish
    borderWidth: 2,
  },
  topAvatar: { width: 56, height: 56, borderRadius: 20 },
  avatarName: { fontSize: 12, fontWeight: '500', marginTop: 8, color: '#6B7280' },

  messageSheet: {
    flex: 1,
    backgroundColor: '#f3f6f4', // Lighter grey background
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5 },
  markRead: { fontSize: 12, color: '#10B981', fontWeight: '600' },

  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 24,
    marginBottom: 12,
    // Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: { position: 'relative' },
  listAvatar: { width: 50, height: 50, borderRadius: 18 },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  messageContent: { flex: 1, marginLeft: 15 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  messageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF' },
  lastMessage: { fontSize: 14, color: '#6B7280', flex: 1, marginRight: 10 },
  unreadBadge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  unreadText: { color: '#000' },
  unreadSubtext: { color: '#111827', fontWeight: '700' },
});

export default MessagesScreen;