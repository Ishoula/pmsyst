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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import UserNavbar from '../../components/UserNavbar';
import { authFetch } from '../../context/AuthContext';

import community from '../../assets/images/racoo.jpeg';

const NewGroupChat = () => {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [name, setName] = useState('');

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const toggleUser = (userId) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      return [...prev, userId];
    });
  };

  const createGroup = async () => {
    const groupName = name.trim();
    if (!groupName) {
      Alert.alert('Missing group name', 'Please enter a group name.');
      return;
    }
    if (selectedIds.length < 2) {
      Alert.alert('Select members', 'Please select at least 2 members to create a group.');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const data = await authFetch('/chats/group', {
        method: 'POST',
        body: JSON.stringify({ name: groupName, memberIds: selectedIds }),
      });

      const chat = data?.chat;
      if (!chat?._id) {
        throw new Error('Failed to create group');
      }

      router.replace({
        pathname: '/chatScreen',
        params: { chatId: chat._id, name: chat?.name || groupName, me: typeof me === 'string' ? me : undefined },
      });
    } catch (e) {
      setError(e?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedIds.includes(item._id);
    const avatarSource = item?.photo ? { uri: item.photo } : community;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.userRow, isSelected && styles.userRowSelected]}
        onPress={() => toggleUser(item._id)}
        disabled={creating}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>{item?.username || 'User'}</Text>
          <Text style={styles.email} numberOfLines={1}>{item?.email || ''}</Text>
        </View>
        <View style={[styles.check, isSelected && styles.checkSelected]}>
          <Text style={[styles.checkText, isSelected && styles.checkTextSelected]}>{isSelected ? '✓' : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <UserNavbar title="Smart Poultry" showBell={true} />

      <View style={styles.header}>
        <Text style={styles.title}>New group</Text>
        <TouchableOpacity onPress={() => router.back()} disabled={creating}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Group name"
          placeholderTextColor="#9CA3AF"
          style={styles.groupName}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={createGroup}
          disabled={creating}
          style={[styles.createBtn, creating && { opacity: 0.7 }]}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createText}>Create</Text>
          )}
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

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{selectedIds.length} selected</Text>
        <Text style={styles.metaHint}>Select at least 2 members</Text>
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

  formRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    marginRight: 10,
  },
  createBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },

  searchWrap: { paddingHorizontal: 20, paddingVertical: 10 },
  search: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
  },

  metaRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { color: '#111827', fontWeight: '800' },
  metaHint: { color: '#6B7280', fontWeight: '600' },

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
  userRowSelected: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  avatar: { width: 48, height: 48, borderRadius: 18 },
  userInfo: { flex: 1, marginLeft: 12 },
  username: { fontSize: 16, fontWeight: '800', color: '#111827' },
  email: { marginTop: 2, fontSize: 12, color: '#6B7280' },

  check: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
  checkText: { fontWeight: '900', color: '#111827' },
  checkTextSelected: { color: '#FFFFFF' },
});

export default NewGroupChat;
