import React, { useEffect, useMemo, useState, useRef } from "react";
import { Entypo, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator, Animated } from "react-native";
import UserNavbar from "../../components/UserNavbar";
import { Colors } from "../../constants/colors";
import { authFetch } from '../../context/AuthContext';
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

// --- Skeleton Component for Loading States ---
const Skeleton = ({ width, height, borderRadius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View 
      style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]} 
    />
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [batches, setBatches] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = React.useCallback(async () => {
    let mounted = true;
    try {
      setError("");
      setLoading(true);
      const [meRes, batchesRes, breedsRes, tasksRes, ordersRes] = await Promise.all([
        authFetch('/auth/me', { method: 'GET' }),
        authFetch('/batchs', { method: 'GET' }),
        authFetch('/breeds', { method: 'GET' }),
        authFetch('/tasks', { method: 'GET' }),
        authFetch('/orders', { method: 'GET' }),
      ]);

      const user = meRes?.user || null;
      const fetchedBatches = Array.isArray(batchesRes?.batches) ? batchesRes.batches : [];
      const fetchedBreeds = Array.isArray(breedsRes?.breeds) ? breedsRes.breeds : [];
      const fetchedTasks = Array.isArray(tasksRes) ? tasksRes : [];
      const fetchedOrders = Array.isArray(ordersRes) ? ordersRes : [];

      if (mounted) {
        setMe(user);
        setBatches(fetchedBatches);
        setBreeds(fetchedBreeds);
        setTasks(fetchedTasks);
        setOrders(fetchedOrders);
      }

      if (fetchedBatches[0]?._id) {
        const logsRes = await authFetch(`/batchs/${fetchedBatches[0]._id}/logs?limit=2&page=1`, { method: 'GET' });
        if (mounted) setRecentLogs(Array.isArray(logsRes?.logs) ? logsRes.logs : []);
      } else if (mounted) {
        setRecentLogs([]);
      }
    } catch (e) {
      if (mounted) setError(e?.message || 'Failed to load dashboard data');
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  // --- Logic & Memoization ---
  const firstName = me?.username?.split(' ')[0] || 'User';
  const batchCount = batches.length;
  const ordersCount = orders.length;

  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => String(o?.status || '').toLowerCase() === 'pending').length;
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (typeof o?.price === 'number' ? o.price : Number(o?.price) || 0), 0);
  }, [orders]);

  const upcomingTasks = useMemo(() => {
    const pending = tasks.filter((t) => String(t?.taskStatus || '').toLowerCase() !== 'completed');
    const withDate = pending
      .map((t) => ({
        _id: t?._id,
        taskName: t?.taskName,
        time: t?.time,
        date: t?.date,
      }))
      .filter((t) => t?._id);

    withDate.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      const ta = da.getTime();
      const tb = db.getTime();
      if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
      return String(a.time || '').localeCompare(String(b.time || ''));
    });
    return withDate.slice(0, 3);
  }, [tasks]);

  const deadCount = useMemo(() => {
    return batches.reduce((sum, b) => sum + Math.max(0, (b?.total_chickens || 0) - (b?.current_chickens || 0)), 0);
  }, [batches]);

  const previewBatch = batches[0];

  // Helper for Section Headers
  const SectionHeader = ({ 
    title, onClear }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onClear}>
        <Text style={styles.viewAllText}>View All</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.screen}>
      <UserNavbar />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View>
            <View style={styles.headerContainer}>
              <View>
                <Skeleton width={140} height={28} />
                <Skeleton width={180} height={16} style={{ marginTop: 8 }} />
              </View>
              <Skeleton width={45} height={45} borderRadius={22.5} />
            </View>
            <View style={styles.bentoGrid}>
              <Skeleton width="60%" height={160} borderRadius={24} />
              <View style={{ flex: 1, gap: 12 }}>
                <Skeleton width="100%" height={74} borderRadius={24} />
                <Skeleton width="100%" height={74} borderRadius={24} />
              </View>
            </View>
            <Skeleton width={120} height={20} style={{ marginVertical: 20 }} />
            {[1, 2].map((i) => <Skeleton key={i} width="100%" height={70} borderRadius={18} style={{ marginBottom: 10 }} />)}
          </View>
        ) : (
          <>
            {/* Welcome Header */}
            <View style={styles.headerContainer}>
              <View>
                <Text style={styles.welcomeText}>Hello, {firstName} 👋</Text>
                <Text style={styles.dateText}>Here's your farm overview</Text>
              </View>
              <View style={styles.profileCircle}>
                <Text style={styles.profileLetter}>{firstName[0]}</Text>
              </View>
            </View>

            {/* Bento Grid Stats */}
            <View style={styles.bentoGrid}>
              <Pressable onPress={() => router.push('/orders')} style={[styles.statCard, styles.largeCard]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="cart" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.ordersLinkText}>Details →</Text>
                </View>
                <Text style={styles.statVal}>${totalRevenue.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{pendingOrdersCount} Pending</Text></View>
                  <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{ordersCount} Total</Text></View>
                </View>
              </Pressable>

              <View style={styles.sideCol}>
                <View style={[styles.statCard, styles.smallCard]}>
                  <Ionicons name="egg" size={20} color={Colors.light.pending} />
                  <Text style={styles.smallStatVal}>{batchCount}</Text>
                  <Text style={styles.statLabel}>Batches</Text>
                </View>
                <View style={[styles.statCard, styles.smallCard]}>
                  <Ionicons name="trending-down" size={20} color="#EF4444" />
                  <Text style={styles.smallStatVal}>{deadCount}</Text>
                  <Text style={styles.statLabel}>Mortality</Text>
                </View>
              </View>
            </View>

            {/* Tasks Section */}
            <SectionHeader title="Immediate Tasks" onClear={() => router.push('/tasks')} />
            <View style={styles.tasksWrapper}>
              {upcomingTasks.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>All caught up!</Text></View>
              ) : (
                upcomingTasks.map((t) => (
                  <Pressable key={t._id} style={styles.taskRow} onPress={() => router.push({ pathname: '/(screens)/addTask', params: { taskId: t._id } })}>
                    <View style={styles.taskTimeBox}>
                      <Text style={styles.taskTimeText}>{t.time?.split(':')[0] || '00'}</Text>
                      <Text style={styles.taskAMPM}>{t.time?.includes('PM') ? 'PM' : 'AM'}</Text>
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskNameText} numberOfLines={1}>{t.taskName}</Text>
                      <Text style={styles.taskDateText}>{new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </Pressable>
                ))
              )}
            </View>

            {/* Active Batch Highlight */}
            <SectionHeader title="Active Batch" onClear={() => router.push('/batch')} />
            <Pressable style={styles.mainCard}>
              {previewBatch ? (
                <View style={styles.cardInner}>
                  <View style={styles.iconCircle}>
                    <FontAwesome5 name="kiwi-bird" size={20} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.batchCardTitle}>{previewBatch.name || 'Batch Overview'}</Text>
                    <Text style={styles.batchCardSubtitle}>
                      {previewBatch.current_chickens} / {previewBatch.total_chickens} Chickens Alive
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>ACTIVE</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No active batches found.</Text>
              )}
            </Pressable>

            {/* Growth Performance (Progress Bars) */}
            <SectionHeader title="Growth Performance" onClear={() => router.push('/growthLog')} />
            <View style={styles.growthContainer}>
              {recentLogs.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No data logged yet</Text></View>
              ) : (
                recentLogs.map((log) => {
                  const target = 2.5; 
                  const numericValue = parseFloat(log.value) || 0;
                  const progress = Math.min((numericValue / target) * 100, 100);
                  return (
                    <View key={log._id} style={styles.growthCard}>
                      <View style={styles.growthHeader}>
                        <View>
                          <Text style={styles.logTypeLabel}>{log.type?.toUpperCase()}</Text>
                          <Text style={styles.logValueText}>{log.value} {log.unit}</Text>
                        </View>
                        <View style={styles.dateBadge}>
                          <Text style={styles.logDateText}>{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                        </View>
                      </View>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                      </View>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressSubtext}>Current Weight</Text>
                        <Text style={styles.progressSubtext}>Target: {target}kg</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Breeds (Category Chips) */}
            <SectionHeader title="Breeds" onClear={() => router.push('/breeds')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breedScroll} contentContainerStyle={{ paddingRight: 20 }}>
              <Pressable style={[styles.breedChip, styles.activeBreedChip]}>
                <Text style={[styles.breedChipText, styles.activeBreedChipText]}>All Breeds</Text>
              </Pressable>
              {breeds.map((breed) => (
                <Pressable key={breed._id} style={styles.breedChip} onPress={() => router.push('/breeds')}>
                  <MaterialIcons name="pets" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={styles.breedChipText}>{breed.breedName}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {error ? (
          <Pressable onPress={loadDashboard} style={{ marginTop: 20 }}>
            <Text style={styles.errorText}>{error} (Tap to retry)</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  welcomeText: { fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 },
  dateText: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  profileCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: Colors.light.success, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  profileLetter: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  // Bento Grid
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  largeCard: { flex: 1.5, minHeight: 160 },
  sideCol: { flex: 1, gap: 12 },
  smallCard: { flex: 1, padding: 12, justifyContent: 'center' },
  statCard: { backgroundColor: "white", borderRadius: 24, padding: 16, borderWidth: 1, borderColor: "#F3F4F6", elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconBox: { padding: 8, borderRadius: 12 },
  statVal: { fontSize: 28, fontWeight: "800", color: "#111827" },
  smallStatVal: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 4 },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  miniBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniBadgeText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
  ordersLinkText: { fontSize: 12, fontWeight: '800', color: '#D97706' },

  // Sections
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  viewAllText: { fontSize: 14, color: Colors.light.success, fontWeight: "600" },

  // Tasks
  tasksWrapper: { backgroundColor: 'white', borderRadius: 24, padding: 8, marginBottom: 24 },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 18, marginBottom: 8 },
  taskTimeBox: { width: 50, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB', marginRight: 12 },
  taskTimeText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  taskAMPM: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  taskInfo: { flex: 1 },
  taskNameText: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  taskDateText: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Active Batch Card
  mainCard: { backgroundColor: "#366d2f", borderRadius: 24, padding: 20, marginBottom: 24, elevation: 8 },
  cardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(23, 66, 52, 0.1)", alignItems: "center", justifyContent: "center" },
  batchCardTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  batchCardSubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  statusBadge: { backgroundColor: "rgba(16, 185, 129, 0.2)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: "#10B981", fontSize: 11, fontWeight: "800" },

  // Growth Logs
  growthContainer: { gap: 12, marginBottom: 24 },
  growthCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  logTypeLabel: { fontSize: 11, fontWeight: "800", color: Colors.light.success, marginBottom: 2 },
  logValueText: { fontSize: 20, fontWeight: "700", color: "#111827" },
  dateBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  logDateText: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  progressTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.light.success, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressSubtext: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },

  // Chips
  breedScroll: { marginBottom: 20 },
  breedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50, marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  activeBreedChip: { backgroundColor: Colors.light.success, borderColor: Colors.light.success },
  breedChipText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  activeBreedChipText: { color: 'white' },

  emptyCard: { padding: 20, alignItems: "center" },
  emptyText: { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  errorText: { color: '#EF4444', fontWeight: '700', textAlign: 'center' }
});