import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import UserNavbar from '../../components/UserNavbar';
import { Colors } from '../../constants/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { authFetch } from '../../context/AuthContext';

const categories = [
  { name: 'Feeding', icon: 'restaurant' },     // orange-amber for food
  { name: 'Cleaning', icon: 'cleaning-services'},
  { name: 'Health', icon: 'healing' },          // red for health/medical
  { name: 'Environment', icon: 'eco'},
];

const priorities = [
  { label: 'Low', color: '#748152' },
  { label: 'Medium', color: '#65b62f' },
  { label: 'High', color: '#00c040ea' },
];

const NewTaskScreen = () => {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const taskIdStr = Array.isArray(taskId) ? taskId[0] : taskId;
  const editing = !!taskIdStr;
  const [taskName, setTaskName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0].name);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingTask, setLoadingTask] = useState(false);

  const fromApiCategory = useMemo(
    () => (apiValue) => {
      const v = String(apiValue || '').trim().toLowerCase();
      if (v === 'feeding') return 'Feeding';
      if (v === 'cleaning') return 'Cleaning';
      if (v === 'health check') return 'Health';
      return 'Environment';
    },
    []
  );

  const fromApiPriority = useMemo(
    () => (apiValue) => {
      const v = String(apiValue || '').trim().toLowerCase();
      if (v === 'high') return 'High';
      if (v === 'low') return 'Low';
      return 'Medium';
    },
    []
  );

  const timeStringToDate = useMemo(
    () => (timeStr) => {
      const raw = String(timeStr || '');
      const [hhRaw, mmRaw] = raw.split(':');
      const hh = Number(hhRaw);
      const mm = Number(mmRaw);
      const d = new Date();
      if (!Number.isNaN(hh)) d.setHours(hh);
      if (!Number.isNaN(mm)) d.setMinutes(mm);
      d.setSeconds(0);
      d.setMilliseconds(0);
      return d;
    },
    []
  );

  useEffect(() => {
    let mounted = true;
    if (!editing) return;

    (async () => {
      try {
        setLoadingTask(true);
        const data = await authFetch(`/tasks/${taskIdStr}`, { method: 'GET' });
        if (!mounted) return;

        setTaskName(String(data?.taskName || ''));
        setSelectedCategory(fromApiCategory(data?.category));
        setSelectedPriority(fromApiPriority(data?.priority));
        setNotes(String(data?.notes || ''));

        if (data?.date) {
          const d = new Date(data.date);
          if (!Number.isNaN(d.getTime())) setDate(d);
        }
        if (data?.time) {
          setTime(timeStringToDate(data.time));
        }
      } catch (e) {
        Alert.alert('Failed to load task', e?.message || 'Please try again');
      } finally {
        if (mounted) setLoadingTask(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [editing, taskIdStr, fromApiCategory, fromApiPriority, timeStringToDate]);

  const toApiCategory = (label) => {
    const v = String(label || '').trim().toLowerCase();
    if (v === 'feeding') return 'feeding';
    if (v === 'cleaning') return 'cleaning';
    if (v === 'health') return 'health check';
    if (v === 'environment') return 'other';
    return 'other';
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // Close on Android immediately
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (t) => {
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSave = async () => {
    if (!taskName.trim()) {
      Alert.alert('Missing task name', 'Please enter a task name.');
      return;
    }

    if (submitting || loadingTask) return;

    const payload = {
      taskName: taskName.trim(),
      category: toApiCategory(selectedCategory),
      date: formatDate(date),
      time: formatTime(time),
      priority: String(selectedPriority || '').trim().toLowerCase(),
      notes: String(notes || ''),
    };

    try {
      setSubmitting(true);
      if (editing) {
        await authFetch(`/tasks/${taskIdStr}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.replace('/(tabs)/tasks');
    } catch (e) {
      Alert.alert('Failed to save task', e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{editing ? 'Edit Task' : 'New Task'}</Text>

        {loadingTask ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Colors.light.success} />
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="e.g. Clean the water tanks"
          placeholderTextColor="#AAA"
          value={taskName}
          onChangeText={setTaskName}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.categoryButton,
                selectedCategory === cat.name && {
                  ...styles.selectedCategory, backgroundColor: `${Colors.light.success}10`,
                  borderColor: Colors.light.success,
                },
              ]}
              onPress={() => setSelectedCategory(cat.name)}
            >
              <Icon name={cat.icon} size={24} color={selectedCategory === cat.name ? '#096b00' :'#5c5c5c'} />
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === cat.name ? '#096b00' : '#5c5c5c'},
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerText}>{formatDate(date)}</Text>
              <Icon name="calendar-today" size={20} color="#757575" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateTimeItem}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.pickerText}>{formatTime(time)}</Text>
              <Icon name="access-time" size={20} color="#757575" />
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        )}

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityContainer}>
          {priorities.map((prio) => (
            <TouchableOpacity
              key={prio.label}
              style={[
                styles.priorityButton,
                selectedPriority === prio.label && { ...styles.selectedPriority, backgroundColor: prio.color, borderColor: prio.color },
              ]}
              onPress={() => setSelectedPriority(prio.label)}
            >
              <Text
                style={[
                  styles.priorityText,
                  selectedPriority === prio.label && { color: '#FFF' },
                ]}
              >
                {prio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Add additional details about the task..."
          placeholderTextColor="#AAA"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={[styles.saveButton, (submitting || loadingTask) && { opacity: 0.8 }]} onPress={handleSave} disabled={submitting || loadingTask}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>{editing ? 'Update Task' : 'Save Task'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  notesInput: {
    height: 110,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 12,
    width: '48%',
    backgroundColor: '#F9F9F9',
  },
  selectedCategory: {
    // dynamically set bg & border in render
  },
  categoryText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateTimeItem: {
    width: '48%',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FAFAFA',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  priorityButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    width: '30%',
    backgroundColor: '#F9F9F9',
  },
  selectedPriority: {
    // dynamic bg & border
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default NewTaskScreen;