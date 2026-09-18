import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import UserNavbar from '../../components/UserNavbar';
import { Colors } from '../../constants/colors';
import { authFetch } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const eventOptions = [
    { id: 'death', label: 'Death ', icon: 'heart-broken', color: '#EF4444' },
    { id: 'feed', label: 'Feed ', icon: 'grass', color: '#F59E0B' },
    { id: 'weight', label: 'Weight ', icon: 'monitor-weight', color: '#3B82F6' },
    { id: 'vaccine', label: 'Vaccine', icon: 'vaccines', color: '#10B981' },
];

const AddGrowthLog = () => {
    const router = useRouter();

    const [selectedEvent, setSelectedEvent] = useState(eventOptions[0].id);
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState(selectedEvent === 'death' || selectedEvent === 'vaccine' ? 'count' : 'kg');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [note, setNote] = useState('');

    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [batchesLoading, setBatchesLoading] = useState(true);
    const [batchesError, setBatchesError] = useState('');

    const [submitting, setSubmitting] = useState(false);

    const selectedOption = useMemo(() => eventOptions.find(opt => opt.id === selectedEvent), [selectedEvent]);

    useEffect(() => {
        if (selectedEvent === 'death' || selectedEvent === 'vaccine') {
            setUnit('count');
        } else {
            setUnit('kg');
        }
    }, [selectedEvent]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setBatchesError('');
                setBatchesLoading(true);
                const data = await authFetch('/batchs', { method: 'GET' });
                const list = Array.isArray(data?.batches) ? data.batches : [];
                if (mounted) {
                    setBatches(list);
                    if (list[0]?._id) setSelectedBatchId(list[0]._id);
                }
            } catch (e) {
                if (mounted) setBatchesError(e?.message || 'Failed to load batches');
            } finally {
                if (mounted) setBatchesLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const formatDate = (inputDate) => {
        if (!inputDate || !(inputDate instanceof Date) || isNaN(inputDate.getTime())) {
            return 'Select date';
        }
        try {
            return inputDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (err) {
            console.warn('Date formatting failed:', err);
            return 'Invalid date';
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
            setDate(new Date(selectedDate));
        }
    };

    const getValueLabel = () => {
        switch (selectedEvent) {
            case 'death': return 'Number of birds died';
            case 'feed': return 'Feed amount (kg)';
            case 'weight': return 'Average weight (kg)';
            case 'vaccine': return 'Number vaccinated';
            default: return 'Value';
        }
    };

    const getValuePlaceholder = () => {
        switch (selectedEvent) {
            case 'death': return 'e.g. 15';
            case 'feed': return 'e.g. 25';
            case 'weight': return 'e.g. 2.4';
            case 'vaccine': return 'e.g. 200';
            default: return 'e.g. 12';
        }
    };

    const handleSave = async () => {
        if (submitting) return;

        if (!selectedBatchId) {
            Alert.alert('Validation Error', 'Please select a batch.');
            return;
        }

        const numericValue = Number(value);
        if (!value.trim() || Number.isNaN(numericValue)) {
            Alert.alert('Validation Error', 'Please enter a valid value.');
            return;
        }
        if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
            Alert.alert('Validation Error', 'Please select a valid date.');
            return;
        }

        try {
            setSubmitting(true);
            await authFetch('/growthLog', {
                method: 'POST',
                body: JSON.stringify({
                    batch: selectedBatchId,
                    type: selectedEvent,
                    value: numericValue,
                    unit,
                    date: date.toISOString(),
                    notes: note.trim(),
                }),
            });
            router.replace('/(tabs)/growthLog');
        } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to save record');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <UserNavbar />

                <View style={styles.screenPadding}>
                    <Text style={styles.title}>Add Growth Record</Text>

                    <Text style={styles.label}>Batch</Text>
                    {batchesLoading ? (
                        <ActivityIndicator size="small" color={Colors.light.success} />
                    ) : batchesError ? (
                        <Text style={styles.errorText}>{batchesError}</Text>
                    ) : batches.length === 0 ? (
                        <Text style={styles.emptyText}>No batches found. Please create a batch first.</Text>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.batchRow}
                        >
                            {batches.map((b, idx) => {
                                const isSelected = b._id === selectedBatchId;
                                return (
                                    <TouchableOpacity
                                        key={b._id}
                                        style={[styles.batchPill, isSelected && styles.batchPillActive]}
                                        onPress={() => setSelectedBatchId(b._id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.batchLabel, isSelected && styles.batchLabelActive]}>
                                            {`Batch ${idx + 1}`}
                                        </Text>
                                        <Text style={styles.batchMeta} numberOfLines={1}>
                                            {b?.breed?.breedName || 'Unknown'}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* EVENT TYPE - kept more pill-style, but you can simplify if needed */}
                    <Text style={styles.label}>Event Type</Text>
                    <View style={styles.eventGrid}>
                        {eventOptions.map((option) => {
                            const isActive = option.id === selectedEvent;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.eventPill,
                                        isActive && { ...styles.eventPillActive },
                                    ]}
                                    onPress={() => {
                                        setSelectedEvent(option.id);
                                        setValue('');
                                    }}
                                >
                                    <Icon name={option.icon} size={24} color={isActive ? selectedOption?.color : '#5c5c5c'} />
                                    <Text style={[styles.eventLabel, isActive && { color: isActive ? selectedOption?.color : '#5c5c5c' }]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* VALUE */}
                    <Text style={styles.label}>{getValueLabel()}</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            value={value}
                            onChangeText={setValue}
                            placeholder={getValuePlaceholder()}
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                        />
                    </View>

                    <Text style={styles.label}>Unit</Text>
                    <View style={styles.unitRow}>
                        <TouchableOpacity
                            style={[styles.unitPill, unit === 'count' && styles.unitPillActive]}
                            onPress={() => setUnit('count')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitLabel, unit === 'count' && styles.unitLabelActive]}>Count</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitPill, unit === 'kg' && styles.unitPillActive]}
                            onPress={() => setUnit('kg')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.unitLabel, unit === 'kg' && styles.unitLabelActive]}>Kg</Text>
                        </TouchableOpacity>
                    </View>

                    {/* DATE */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>DATE</Text>
                        <TouchableOpacity
                            style={[
                                styles.inputShell,

                            ]}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name="event"
                                size={20}
                                color={Colors.light.icon || '#6B7280'}
                                style={styles.inputIcon}
                            />

                            <Text
                                style={[
                                    styles.dateText,
                                    !date || isNaN(date.getTime()) ? styles.datePlaceholder : null,
                                ]}
                            >
                                {formatDate(date)}
                            </Text>

                            <Icon
                                name="calendar-today"
                                size={20}
                                color={Colors.light.icon || '#6B7280'}
                            />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>

                    {/* NOTE */}
                    <Text style={styles.label}>Note </Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, styles.notesInput]}
                            value={note}
                            onChangeText={setNote}
                            placeholder="Symptoms, treatment used, buyer name, vaccine type, observations..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={submitting}>
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.buttonText}>Save Record</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    screenPadding: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#444',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        marginBottom: 12,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14,
        marginBottom: 12,
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    input: {
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    notesInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    batchRow: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 4,
        marginBottom: 20,
    },
    batchPill: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        paddingVertical: 10,
        paddingHorizontal: 14,
        minWidth: 110,
    },
    batchPillActive: {
        backgroundColor: `${Colors.light.success}10`,
        borderColor: Colors.light.success,
    },
    batchLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 2,
    },
    batchLabelActive: {
        color: Colors.light.success,
    },
    batchMeta: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    eventGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    eventPill: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        marginBottom: 12,
        gap: 8,
        backgroundColor: '#f9f9f9',
    },
    eventPillActive: {
        backgroundColor: `${Colors.light.success}10`,
        borderColor: Colors.light.success,
    },
    eventLabel: {
        fontSize: 14,
        color: '#555',
    },
    unitRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    unitPill: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#f9f9f9',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    unitPillActive: {
        borderColor: Colors.light.success,
        backgroundColor: `${Colors.light.success}10`,
    },
    unitLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    unitLabelActive: {
        color: Colors.light.success,
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
    saveButton: {
        backgroundColor: Colors.light.success,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputShell: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputIcon: {
        marginRight: 12,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text || '#111827',
    },
    datePlaceholder: {
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
});

export default AddGrowthLog;