import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import UserNavbar from '../../components/UserNavbar';
import { authFetch } from '../../context/AuthContext';

import community from '../../assets/images/racoo.jpeg';

const NewChat = () => {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const [meData, usersData] = await Promise.all([
        authFetch('/auth/me', { method: 'GET' }),
        authFetch('/users', { method: 'GET' }),
      ]);

      setMe(meData?.user?._id || null);
      setUsers(Array.isArray(usersData?.users) ? usersData.users : []);
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const username = String(u?.username || '').toLowerCase();
      const email = String(u?.email || '').toLowerCase();
      return username.includes(q) || email.includes(q);
    });
  }, [users, query]);

  const startChat = async (user) => {
    if (!user?._id) return;
    try {
      setCreating(true);
      const data = await authFetch('/chats', {
        method: 'POST',
        body: JSON.stringify({ userId: user._id }),
      });

      const chat = data?.chat;
      if (!chat?._id) {
        throw new Error('Failed to create chat');
      }

      router.replace({
        pathname: '/chatScreen',
        params: { chatId: chat._id, name: user?.username || 'Chat', me: typeof me === 'string' ? me : undefined },
      });
    } catch (e) {
      setError(e?.message || 'Failed to create chat');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }) => {
    const avatarSource = item?.photo ? { uri: item.photo } : community;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.userRow}
        onPress={() => startChat(item)}
        disabled={creating}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>{item?.username || 'User'}</Text>
          <Text style={styles.email} numberOfLines={1}>{item?.email || ''}</Text>
        </View>
        <Text style={styles.cta}>Message</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <UserNavbar title="Smart Poultry" showBell={true} />

      <View style={styles.header}>
        <Text style={styles.title}>New message</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search users"
          placeholderTextColor="#9CA3AF"
          style={styles.search}
          autoCapitalize="none"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 30 }}>
              <ActivityIndicator size="small" color="#10B981" />
            </View>
          ) : (
            <Text style={styles.empty}>No users found</Text>
          )
        }
      />

      {creating ? (
        <View style={styles.creatingBar}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.creatingText}>Opening chat…</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  back: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  searchWrap: { paddingHorizontal: 20, paddingVertical: 10 },
  search: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
  },
  error: { color: '#dc2626', paddingHorizontal: 20, paddingBottom: 10 },
  empty: { color: '#6B7280', paddingVertical: 20, paddingHorizontal: 20 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 18 },
  userInfo: { flex: 1, marginLeft: 12 },
  username: { fontSize: 16, fontWeight: '800', color: '#111827' },
  email: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  cta: { fontSize: 12, fontWeight: '800', color: '#10B981' },
  creatingBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  creatingText: { marginLeft: 10, color: '#111827', fontWeight: '700' },
});

export default NewChat;
