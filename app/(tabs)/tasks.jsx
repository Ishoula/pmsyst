import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

import UserNavbar from '../../components/UserNavbar';
import { Colors } from '../../constants/colors';
import { authFetch } from '../../context/AuthContext';

const priorityStyles = {
    High: { bg: '#FEE2E2', color: '#EF4444', dot: '#EF4444' },
    Medium: { bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
    Low: { bg: '#E0F2FE', color: '#0284C7', dot: '#0284C7' },
};

const TasksScreen = () => {
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('Pending'); // Pending | Completed
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

     const loadTasks = React.useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const data = await authFetch('/tasks', { method: 'GET' });
            setTasks(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    const confirmDeleteTask = React.useCallback(
        (task) => {
            if (!task?.id) return;
            Alert.alert('Delete task', 'This will permanently delete the task.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authFetch(`/tasks/${task.id}`, { method: 'DELETE' });
                            loadTasks();
                        } catch (e) {
                            Alert.alert('Error', e?.message || 'Failed to delete task');
                        }
                    },
                },
            ]);
        },
        [loadTasks]
    );

    const renderRightActions = React.useCallback(
        (task) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => confirmDeleteTask(task)}
                style={styles.deleteAction}
            >
                <Ionicons name="trash-outline" size={22} color="#fff" />
                <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
        ),
        [confirmDeleteTask]
    );

   

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useFocusEffect(
        React.useCallback(() => {
            loadTasks();
        }, [loadTasks])
    );

    const uiTasks = useMemo(() => {
        return tasks.map((t) => {
            const completed = String(t?.taskStatus || '').toLowerCase() === 'completed';
            const time = t?.time || '';
            return {
                id: t?._id,
                title: t?.taskName || 'Task',
                category: t?.category ? String(t.category) : 'Other',
                time,
                priority: t?.priority ? String(t.priority) : 'medium',
                completed,
                raw: t,
            };
        });
    }, [tasks]);

    const toggleTask = async (id) => {
        if (!id) return;
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const existing = uiTasks.find((t) => t.id === id);
        if (!existing) return;
        const nextStatus = existing.completed ? 'pending' : 'completed';

        setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, taskStatus: nextStatus } : t)));

        try {
            const updated = await authFetch(`/tasks/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ taskStatus: nextStatus }),
            });
            if (updated?._id) {
                setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
            } else {
                await loadTasks();
            }
        } catch (e) {
            await loadTasks();
            Alert.alert('Update failed', e?.message || 'Failed to update task status');
        }
    };

    const filteredTasks = uiTasks.filter(t => activeTab === 'Pending' ? !t.completed : t.completed);
    const pendingCount = uiTasks.filter(t => !t.completed).length;

    return (
        <View style={styles.container}>
            <UserNavbar />
            
            <View style={styles.headerSection}>
                <Text style={styles.pageTitle}>Daily Chores</Text>
                <Text style={styles.pageSubtitle}>Keep your flock healthy and your farm organized.</Text>
                
                {/* Segmented Tab Control */}
                <View style={styles.tabBar}>
                    {['Pending', 'Completed'].map((tab) => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab} {tab === 'Pending' && pendingCount > 0 && `(${pendingCount})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.tasksStack}>
                    {loading ? (
                        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={Colors.light.success} />
                        </View>
                    ) : error ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#dc2626', fontWeight: '700', marginBottom: 10 }}>{error}</Text>
                            <TouchableOpacity activeOpacity={0.8} style={styles.retryBtn} onPress={loadTasks}>
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => {
                            const prioKey = String(task.priority || '').toLowerCase();
                            const badgeStyle =
                                prioKey === 'high'
                                    ? priorityStyles.High
                                    : prioKey === 'low'
                                    ? priorityStyles.Low
                                    : priorityStyles.Medium;
                            return (
                                <Swipeable key={task.id} renderRightActions={() => renderRightActions(task)}>
                                    <Pressable
                                        onPress={() => router.push({ pathname: '/(screens)/addTask', params: { taskId: task.id } })}
                                        style={[styles.taskCard, task.completed && styles.taskCardDone]}
                                    >
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            style={[styles.checkbox, task.completed ? styles.checkboxChecked : styles.checkboxDefault]}
                                            onPress={() => toggleTask(task.id)}
                                        >
                                            {task.completed && <Ionicons name="checkmark-sharp" size={20} color="white" />}
                                        </TouchableOpacity>

                                        <View style={styles.cardContent}>
                                            <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>
                                                {task.title}
                                            </Text>
                                            <View style={styles.metaRow}>
                                                <View style={styles.tagBadge}>
                                                    <Text style={styles.tagText}>{task.category}</Text>
                                                </View>
                                                <View style={styles.timeGroup}>
                                                    <Ionicons name="time-outline" size={14} color="#94A3B8" />
                                                    <Text style={styles.timeText}>{task.time}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {!task.completed && (
                                            <View style={[styles.priorityDot, { backgroundColor: badgeStyle.dot }]} />
                                        )}
                                    </Pressable>
                                </Swipeable>
                            );
                        })
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="sparkles-outline" size={40} color={Colors.light.success} />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {activeTab === 'Pending' ? "All caught up!" : "No completed tasks"}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {activeTab === 'Pending' ? "Take a break, you've done everything for now." : "Tasks you finish will show up here."}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.fab} 
                onPress={() => router.push('/(screens)/addTask')}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </View>
    );
};

export default TasksScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    headerSection: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#FFF', paddingBottom: 10 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
    pageSubtitle: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
    
    tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    tabTextActive: { color: Colors.light.success },

    scrollContent: { padding: 20, paddingBottom: 100 },
    tasksStack: { gap: 14 },
    
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
    },
    taskCardDone: { opacity: 0.6, backgroundColor: '#F8FAFC' },
    
    checkbox: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    checkboxDefault: { borderWidth: 2, borderColor: '#E2E8F0' },
    checkboxChecked: { backgroundColor: Colors.light.success },
    
    cardContent: { flex: 1 },
    taskTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
    taskTitleDone: {color: Colors.light.success },
    
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
    tagBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    timeGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
    
    priorityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },

    deleteAction: {
        width: 88,
        backgroundColor: '#EF4444',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        paddingVertical: 10,
        gap: 6,
    },
    deleteActionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },
    retryBtn: { backgroundColor: Colors.light.success, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    retryText: { color: '#FFF', fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 110 : 90, 
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.success,
        zIndex: 999, 
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});