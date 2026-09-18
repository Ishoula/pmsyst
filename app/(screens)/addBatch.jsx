import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import UserNavbar from '../../components/UserNavbar';
import { Colors } from '../../constants/colors';
import { authFetch } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

let DateTimePicker = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const AddBatch = () => {
    const router = useRouter();

    // Form state
    const [selectedBreedId, setSelectedBreedId] = useState(null);
    const [totalBirds, setTotalBirds] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [focusedField, setFocusedField] = useState(null);

    // Breeds fetched from API
    const [breeds, setBreeds] = useState([]);
    const [breedsLoading, setBreedsLoading] = useState(true);
    const [breedsError, setBreedsError] = useState('');

    // Submission state
    const [submitting, setSubmitting] = useState(false);

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setArrivalDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    // Fetch breeds on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setBreedsLoading(true);
                setBreedsError('');
                const data = await authFetch('/breeds', { method: 'GET' });
                const list = Array.isArray(data?.breeds) ? data.breeds : [];
                if (mounted) {
                    setBreeds(list);
                    if (list.length > 0) setSelectedBreedId(list[0]._id);
                }
            } catch (e) {
                if (mounted) setBreedsError(e?.message || 'Failed to load breeds');
            } finally {
                if (mounted) setBreedsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleRegister = async () => {
        if (submitting) return;

        // Validate
        if (!selectedBreedId) {
            Alert.alert('Validation Error', 'Please select a breed.');
            return;
        }
        const birds = parseInt(totalBirds, 10);
        if (!totalBirds || isNaN(birds) || birds < 1) {
            Alert.alert('Validation Error', 'Please enter a valid number of birds (at least 1).');
            return;
        }
        if (!arrivalDate.trim()) {
            Alert.alert('Validation Error', 'Please enter an arrival date.');
            return;
        }
        const parsedDate = new Date(`${arrivalDate.trim()}T00:00:00`);
        if (isNaN(parsedDate.getTime())) {
            Alert.alert('Validation Error', 'Invalid date format. Please use YYYY-MM-DD.');
            return;
        }

        try {
            setSubmitting(true);
            await authFetch('/batchs', {
                method: 'POST',
                body: JSON.stringify({
                    breed: selectedBreedId,
                    total_chickens: birds,
                    start_date: parsedDate.toISOString(),
                    status: isActive ? 'active' : 'inactive',
                }),
            });
            router.replace('/batch');
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to create batch. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <UserNavbar />
                <View style={styles.screenPadding}>
                    <View style={styles.topBar}>
                        <TouchableOpacity style={styles.navIconButton} onPress={() => router.back()}>
                            <Icon name="arrow-back" size={20} color={Colors.light.text} />
                        </TouchableOpacity>
                        <Text style={styles.topBarTitle}>Register Batch</Text>
                    </View>

                    <View style={styles.formCard}>

                        {/* Breed Selector */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Select Breed</Text>
                            {breedsLoading ? (
                                <ActivityIndicator size="small" color={Colors.light.success} />
                            ) : breedsError ? (
                                <Text style={styles.errorText}>{breedsError}</Text>
                            ) : breeds.length === 0 ? (
                                <Text style={styles.emptyText}>No breeds found. Please add a breed first.</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breedRow}>
                                    {breeds.map((breed) => {
                                        const isSelected = breed._id === selectedBreedId;
                                        return (
                                            <TouchableOpacity
                                                key={breed._id}
                                                style={[styles.breedPill, isSelected && styles.breedPillActive]}
                                                onPress={() => setSelectedBreedId(breed._id)}
                                            >
                                                <View style={[styles.breedIconBadge, isSelected && styles.breedIconBadgeActive]}>
                                                    <Icon
                                                        name="egg"
                                                        size={18}
                                                        color={isSelected ? '#ffffff' : '#9CA3AF'}
                                                    />
                                                </View>
                                                <Text style={[styles.breedLabel, isSelected && styles.breedLabelActive]}>
                                                    {breed.breedName}
                                                </Text>
                                                <Text style={styles.breedMeta}>
                                                    {breed.growthPeriod}d · {breed.averageWeight}kg
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        {/* Total Birds */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Total Number of Birds</Text>
                            <View style={[styles.inputShell, focusedField === 'totalBirds' && styles.inputShellFocused]}>
                                <Icon name="tag" size={18} color={Colors.light.icon} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={totalBirds}
                                    onChangeText={setTotalBirds}
                                    placeholder="e.g. 500"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    underlineColorAndroid="transparent"
                                    onFocus={() => setFocusedField('totalBirds')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Arrival / Start Date */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Arrival Date</Text>
                            <View style={[styles.inputShell, styles.inputShellBetween, focusedField === 'arrivalDate' && styles.inputShellFocused]}>
                                <View style={styles.inlineIconText}>
                                    <Icon name="event" size={18} color={Colors.light.icon} style={styles.inputIcon} />
                                    {Platform.OS === 'web' ? (
                                        <TextInput
                                            style={styles.textInput}
                                            value={arrivalDate}
                                            onChangeText={setArrivalDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#9CA3AF"
                                            underlineColorAndroid="transparent"
                                            onFocus={() => setFocusedField('arrivalDate')}
                                            onBlur={() => setFocusedField(null)}
                                            type="date"
                                        />
                                    ) : (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            style={{ flex: 1 }}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Text style={[styles.textInput, { paddingVertical: 0 }, !arrivalDate && { color: '#9CA3AF' }]}>
                                                {arrivalDate || 'Select date'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
                                    <Icon name="calendar-today" size={18} color={Colors.light.icon} />
                                </TouchableOpacity>
                            </View>
                            {showDatePicker && DateTimePicker ? (
                                <DateTimePicker
                                    value={arrivalDate ? new Date(`${arrivalDate}T00:00:00`) : new Date()}
                                    mode="date"
                                    onChange={onDateChange}
                                />
                            ) : null}
                        </View>

                        {/* Active Toggle */}
                        <View style={[styles.fieldGroup, styles.toggleRow]}>
                            <View style={styles.toggleCopy}>
                                <Text style={styles.toggleLabel}>Set as Active</Text>
                                <Text style={styles.toggleDescription}>Active batches allow immediate record entries.</Text>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: '#E5E7EB', true: `${Colors.light.success}55` }}
                                thumbColor={isActive ? Colors.light.success : '#ffffff'}
                            />
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                            onPress={handleRegister}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="check" size={18} color="#ffffff" style={styles.saveIcon} />
                                    <Text style={styles.saveButtonText}>Create Batch</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background || '#f0f2f5',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    screenPadding: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    navIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 2,
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 18,
        elevation: 5,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontStyle: 'italic',
    },
    breedRow: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 4,
    },
    breedPill: {
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
        minWidth: 100,
    },
    breedPillActive: {
        backgroundColor: `${Colors.light.success}10`,
        borderColor: Colors.light.success,
    },
    breedIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
    },
    breedIconBadgeActive: {
        backgroundColor: Colors.light.success,
    },
    breedLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#9CA3AF',
        textAlign: 'center',
    },
    breedLabelActive: {
        color: Colors.light.success,
    },
    breedMeta: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    inputShell: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputShellFocused: {
        borderColor: Colors.light.success,
        backgroundColor: '#fff',
    },
    inputShellBetween: {
        justifyContent: 'space-between',
    },
    inputIcon: {
        marginRight: 12,
    },
    inlineIconText: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
        paddingVertical: 0,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleCopy: {
        flex: 1,
        paddingRight: 16,
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    toggleDescription: {
        fontSize: 12,
        color: '#6B7280',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.light.success,
        borderRadius: 28,
        paddingVertical: 16,
        marginTop: 8,
        shadowColor: '#1A472A',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 4,
    },
    saveButtonDisabled: {
        opacity: 0.65,
    },
    saveIcon: {
        marginRight: 8,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default AddBatch;