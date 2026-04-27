import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../config';

const VEHICLE_TYPES = ['Truck', 'Lorry', 'Tractor', 'Mini Truck', 'Other'];

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '', password: '', vehicleNumber: '', mobileNumber: '', vehicleType: ''
  });
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    const { username, password, vehicleNumber, mobileNumber, vehicleType } = form;
    if (!username || !password || !vehicleNumber || !mobileNumber || !vehicleType) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
      return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        ...form,
        vehicleNumber: vehicleNumber.toUpperCase(),
      });
      Alert.alert('Success', 'Registration successful! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.logoIcon}>🚛</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Vehicle Management App</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} placeholder="Enter username" autoCapitalize="none"
          value={form.username} onChangeText={v => handleChange('username', v)} />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Enter password" secureTextEntry
          value={form.password} onChangeText={v => handleChange('password', v)} />

        <Text style={styles.label}>Vehicle Number</Text>
        <TextInput style={styles.input} placeholder="e.g. KA01AB1234" autoCapitalize="characters"
          value={form.vehicleNumber} onChangeText={v => handleChange('vehicleNumber', v)} />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput style={styles.input} placeholder="10-digit mobile number"
          keyboardType="phone-pad" maxLength={10}
          value={form.mobileNumber} onChangeText={v => handleChange('mobileNumber', v)} />

        <Text style={styles.label}>Vehicle Type</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
          <Text style={form.vehicleType ? styles.dropdownText : styles.dropdownPlaceholder}>
            {form.vehicleType || 'Select vehicle type'}
          </Text>
          <Text style={styles.arrow}>{showTypeDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showTypeDropdown && (
          <View style={styles.dropdownList}>
            {VEHICLE_TYPES.map(type => (
              <TouchableOpacity key={type} style={styles.dropdownItem}
                onPress={() => { handleChange('vehicleType', type); setShowTypeDropdown(false); }}>
                <Text style={styles.dropdownItemText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f0f0ff', padding: 24 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  logoIcon: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 13, fontSize: 15, color: '#333', backgroundColor: '#fafafa' },
  dropdown: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  dropdownText: { fontSize: 15, color: '#333' },
  dropdownPlaceholder: { fontSize: 15, color: '#aaa' },
  arrow: { color: '#888', fontSize: 12 },
  dropdownList: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, marginTop: 4, backgroundColor: '#fff', overflow: 'hidden' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28, marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkBold: { color: '#4f46e5', fontWeight: '700' },
});
