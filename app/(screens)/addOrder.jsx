import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { ScrollView } from 'react-native';
import UserNavbar from '../../components/UserNavbar';
import { authFetch } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

let DateTimePicker = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const AddOrder = () => {
  const router = useRouter();

  const [breeds, setBreeds] = useState([]);
  const [loadingBreeds, setLoadingBreeds] = useState(true);
  const [breedsError, setBreedsError] = useState('');

  const [breedType, setBreedType] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [basis, setBasis] = useState('per chick');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadBreeds = async () => {
    try {
      setBreedsError('');
      setLoadingBreeds(true);
      const data = await authFetch('/breeds', { method: 'GET' });
      const list = Array.isArray(data?.breeds) ? data.breeds : [];
      setBreeds(list);
      if (!breedType && list.length > 0) {
        setBreedType(list[0]._id);
      }
    } catch (e) {
      setBreedsError(e?.message || 'Failed to load breeds');
    } finally {
      setLoadingBreeds(false);
    }
  };

  useEffect(() => {
    loadBreeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBreedName = useMemo(() => {
    const found = breeds.find((b) => b?._id === breedType);
    return found?.breedName || '';
  }, [breeds, breedType]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]); // YYYY-MM-DD
    }
  };

  const handleRegister = () => {
    // Deprecated by submitOrder
  };

  const submitOrder = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a customer name.');
      return;
    }
    if (!breedType) {
      Alert.alert('Missing breed', 'Please select a breed type.');
      return;
    }
    if (!basis) {
      Alert.alert('Missing basis', 'Please select basis.');
      return;
    }
    if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Invalid quantity', 'Quantity must be a positive number.');
      return;
    }
    if (!price || Number.isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Invalid price', 'Price must be a positive number.');
      return;
    }
    if (!date) {
      Alert.alert('Missing delivery date', 'Please select a delivery date.');
      return;
    }

    try {
      setSubmitting(true);
      await authFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          breedType,
          basis,
          quantity: Number(quantity),
          price: Number(price),
          deliveryDate: date,
        }),
      });
      router.replace('/(tabs)/orders');
    } catch (e) {
      Alert.alert('Failed to create order', e?.message || 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <UserNavbar />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add Order</Text>

        {/* Name */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. John Doe"
          placeholderTextColor="#AAA"
          underlineColorAndroid="transparent"
        />

        {/* Breed Type */}
        <Text style={styles.label}>Breed Type</Text>
        {loadingBreeds ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={Colors.light.success} />
          </View>
        ) : breedsError ? (
          <TouchableOpacity activeOpacity={0.8} onPress={loadBreeds} style={styles.inlineErrorBtn}>
            <Text style={styles.inlineErrorText}>{breedsError} (Tap to retry)</Text>
          </TouchableOpacity>
        ) : breeds.length === 0 ? (
          <Text style={styles.emptyText}>No breeds found. Please create breeds first.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            {breeds.map((b) => {
              const isSelected = b?._id === breedType;
              return (
                <TouchableOpacity
                  key={b._id}
                  style={[styles.pill, isSelected && styles.pillActive]}
                  onPress={() => setBreedType(b._id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillTitle, isSelected && styles.pillTitleActive]} numberOfLines={1}>
                    {b?.breedName || 'Unknown'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Basis */}
        <Text style={styles.label}>Basis</Text>
        <View style={styles.basisRow}>
          <TouchableOpacity
            style={[styles.basisPill, basis === 'per chick' && styles.basisPillActive]}
            onPress={() => setBasis('per chick')}
            activeOpacity={0.8}
          >
            <Text style={[styles.basisLabel, basis === 'per chick' && styles.basisLabelActive]}>Per Chick</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.basisPill, basis === 'per kg' && styles.basisPillActive]}
            onPress={() => setBasis('per kg')}
            activeOpacity={0.8}
          >
            <Text style={[styles.basisLabel, basis === 'per kg' && styles.basisLabelActive]}>Per Kg</Text>
          </TouchableOpacity>
        </View>

        {/* Quantity */}
        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 100"
          placeholderTextColor="#AAA"
          keyboardType="numeric"
          underlineColorAndroid="transparent"
        />

        {/* Price */}
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 200"
          placeholderTextColor="#AAA"
          keyboardType="numeric"
          underlineColorAndroid="transparent"
        />

        {/* Date */}
        <Text style={styles.label}>Delivery Date</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#AAA"
            type="date"
            underlineColorAndroid="transparent"
          />
        ) : (
          <>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickerText, !date && styles.pickerPlaceholder]}>{date || 'Select date'}</Text>
            </TouchableOpacity>

            {showDatePicker && DateTimePicker && (
              <DateTimePicker
                value={date ? new Date(date) : new Date()}
                mode="date"
                onChange={onDateChange}
              />
            )}
          </>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.saveButton, (submitting || loadingBreeds || !!breedsError) && { opacity: 0.8 }]}
          onPress={submitOrder}
          disabled={submitting || loadingBreeds || !!breedsError}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

export default AddOrder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    color: '#333',
    ...Platform.select({
      web: {
        outlineWidth: 0,
        outlineColor: 'transparent',
        outlineStyle: 'none', // Fully remove browser focus outline
      },
    }),
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
  },
  pillActive: {
    backgroundColor: `${Colors.light.success}10`,
    borderColor: Colors.light.success,
  },
  pillTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  pillTitleActive: {
    color: Colors.light.success,
  },
  pillMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  basisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  basisPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#f9f9f9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  basisPillActive: {
    borderColor: Colors.light.success,
    backgroundColor: `${Colors.light.success}10`,
  },
  basisLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  basisLabelActive: {
    color: Colors.light.success,
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
    marginBottom: 20,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    color: '#AAA',
  },
  inlineLoader: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inlineErrorBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inlineErrorText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Colors.light.success || '#4CAF50',
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