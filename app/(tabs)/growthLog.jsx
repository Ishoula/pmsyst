import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserNavbar from '../../components/UserNavbar';
import { Colors } from '../../constants/colors';
import { useRouter } from 'expo-router';
import React, { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { authFetch } from '../../context/AuthContext';

// 1. Move configuration constants outside the component to prevent re-definitions
const LOG_CONFIG = {
    death: { icon: 'heart-broken', iconColor: '#EF4444' },
    feed: { icon: 'leaf', iconColor: '#F59E0B' },
    weight: { icon: 'scale', iconColor: '#3B82F6' },
    vaccine: { icon: 'needle', iconColor: '#10B981' },
    default: { icon: 'clipboard-text', iconColor: '#6B7280' }
};

const GrowthLogScreen = () => {
    const router = useRouter();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 2. Optimized data fetching
    const loadLogs = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const data = await authFetch('/growthLog', { method: 'GET' });
            setLogs(Array.isArray(data?.logs) ? data.logs : []);
        } catch (e) {
            setError(e?.message || 'Failed to load logs');
        } finally {
            setLoading(false);
        }
    }, []);

    // 3. useFocusEffect is enough to handle initial load and refresh on return
    useFocusEffect(
        useCallback(() => {
            loadLogs();
        }, [loadLogs])
    );

    // 4. Memoize the UI data transformation
    const uiLogs = useMemo(() => {
        return logs.map((l) => {
            const logDate = l.date ? new Date(l.date) : null;
            const formattedDate = logDate && !Number.isNaN(logDate.getTime()) 
                ? logDate.toLocaleDateString() 
                : 'N/A';
            
            const config = LOG_CONFIG[l.type] || LOG_CONFIG.default;
            const unitLabel = l.unit === 'count' ? 'birds' : l.unit;

            return {
                id: l._id,
                title: (l.type || 'log').toUpperCase(),
                value: `${l.value} ${unitLabel}`,
                date: formattedDate,
                note: l.notes || 'No notes added',
                ...config,
            };
        });
    }, [logs]);

    const renderLog = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                    <View style={[styles.iconBadge, { backgroundColor: `${item.iconColor}1A` }]}>
                        <Icon name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <View style={styles.titleTextWrap}>
                        <Text style={styles.logTitle}>{item.title}</Text>
                        <Text style={styles.logMetaLabel}>Value</Text>
                        <Text style={styles.logMetaValue}>{item.value}</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {/* Handle Edit */}}>
                    <Icon name="pencil" size={20} color={Colors.light.icon} />
                </TouchableOpacity>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{item.date}</Text>
                </View>
            </View>

            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{item.note}</Text>
        </View>
    );

    return (
        <View style={styles.safeArea}>
            <UserNavbar />
            
            <FlatList
                data={uiLogs}
                renderItem={renderLog}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.sectionMeta}>No records found.</Text>
                        </View>
                    )
                }
                ListHeaderComponent={
                    <View style={styles.pageHeader}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity 
                                style={styles.headerIconButton} 
                                onPress={() => router.back()}
                            >
                                <Icon name="arrow-left" size={20} color={Colors.light.text} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Growth Log</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {loading && <ActivityIndicator color={Colors.light.success} />}
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>My records</Text>
                            <Text style={styles.sectionMeta}>{`${uiLogs.length} Total`}</Text>
                        </View>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/(screens)/addGrowthLog')}
                activeOpacity={0.8}
            >
                <Icon name="plus" size={32} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default GrowthLogScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Extra space for FAB
    },
    pageHeader: {
        paddingVertical: 16,
        gap: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    sectionMeta: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
        letterSpacing: 0.6,
    },
    logCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 16, // Reduced from 50 for better list density
        elevation: 4,
        shadowColor: '#0F172A',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    iconBadge: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    titleTextWrap: {
        flex: 1,
    },
    logTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    logMetaLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    logMetaValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
    },
    metaRow: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    metaBlock: {
        marginRight: 20,
    },
    metaLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    noteLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.light.success,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        marginBottom: 40,
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    }
});