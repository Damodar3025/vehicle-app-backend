import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

const FACTORY_PLACES = ['Mandya', 'Shivamogga', 'Hospet'];

export default function HomeScreen() {
  const { user, token, logout } = useAuth();
  const [form, setForm] = useState({
    vehicleNumber: user?.vehicleNumber || '',
    numberOfTons: '',
    amount: '',
    factoryPlace: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const { vehicleNumber, numberOfTons, amount, factoryPlace } = form;
    if (!vehicleNumber || !numberOfTons || !amount || !factoryPlace) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (isNaN(numberOfTons) || Number(numberOfTons) <= 0) {
      return Alert.alert('Error', 'Enter a valid number of tons');
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      return Alert.alert('Error', 'Enter a valid amount');
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/submissions`,
        { vehicleNumber: vehicleNumber.toUpperCase(), numberOfTons: Number(numberOfTons), amount: Number(amount), factoryPlace },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLastSubmission(res.data.submission);
      Alert.alert('Success ✅', res.data.message);
      setForm({ vehicleNumber: user?.vehicleNumber || '', numberOfTons: '', amount: '', factoryPlace: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.username} 👋</Text>
          <Text style={styles.subGreeting}>{user?.vehicleNumber} • {user?.vehicleType}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>New Submission</Text>

        <Text style={styles.label}>Vehicle Number</Text>
        <TextInput style={styles.input} placeholder="Vehicle number" autoCapitalize="characters"
          value={form.vehicleNumber} onChangeText={v => handleChange('vehicleNumber', v)} />

        <Text style={styles.label}>Number of Tons</Text>
        <TextInput style={styles.input} placeholder="e.g. 5" keyboardType="decimal-pad"
          value={form.numberOfTons} onChangeText={v => handleChange('numberOfTons', v)} />

        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput style={styles.input} placeholder="e.g. 5000" keyboardType="decimal-pad"
          value={form.amount} onChangeText={v => handleChange('amount', v)} />

        <Text style={styles.label}>Factory Place</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
          <Text style={form.factoryPlace ? styles.dropdownText : styles.dropdownPlaceholder}>
            {form.factoryPlace || 'Select factory place'}
          </Text>
          <Text style={styles.arrow}>{showDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdownList}>
            {FACTORY_PLACES.map(place => (
              <TouchableOpacity key={place} style={styles.dropdownItem}
                onPress={() => { handleChange('factoryPlace', place); setShowDropdown(false); }}>
                <Text style={styles.dropdownItemText}>{place}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Submit & Send SMS 📱</Text>
          }
        </TouchableOpacity>
      </View>

      {lastSubmission && (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✅ Last Submission</Text>
          <Text style={styles.successText}>Vehicle: {lastSubmission.vehicleNumber}</Text>
          <Text style={styles.successText}>Tons: {lastSubmission.numberOfTons}</Text>
          <Text style={styles.successText}>Amount: ₹{lastSubmission.amount}</Text>
          <Text style={styles.successText}>Factory: {lastSubmission.factoryPlace}</Text>
          <Text style={styles.successText}>SMS: {lastSubmission.smsSent ? '✅ Sent' : '❌ Failed'}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f0ff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 24 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  subGreeting: { fontSize: 13, color: '#888', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 22, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, marginBottom: 20 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 13, fontSize: 15, color: '#333', backgroundColor: '#fafafa' },
  dropdown: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  dropdownText: { fontSize: 15, color: '#333' },
  dropdownPlaceholder: { fontSize: 15, color: '#aaa' },
  arrow: { color: '#888', fontSize: 12 },
  dropdownList: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successCard: { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', borderRadius: 16, padding: 18 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#166534', marginBottom: 10 },
  successText: { fontSize: 14, color: '#15803d', marginBottom: 4 },
});
