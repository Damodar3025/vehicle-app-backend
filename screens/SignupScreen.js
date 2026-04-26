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

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

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
      await axios.post(`${API_BASE_URL}/api/auth/signup`, form);
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
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Vehicle Management App</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        autoCapitalize="none"
        value={form.username}
        onChangeText={(v) => handleChange('username', v)}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => handleChange('password', v)}
      />

      <Text style={styles.label}>Vehicle Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. KA01AB1234"
        autoCapitalize="characters"
        value={form.vehicleNumber}
        onChangeText={(v) => handleChange('vehicleNumber', v)}
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        value={form.mobileNumber}
        onChangeText={(v) => handleChange('mobileNumber', v)}
      />

      <Text style={styles.label}>Vehicle Type</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
        <Text style={form.vehicleType ? styles.dropdownText : styles.dropdownPlaceholder}>
          {form.vehicleType || 'Select vehicle type'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      {showTypeDropdown && (
        <View style={styles.dropdownList}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.dropdownItem}
              onPress={() => { handleChange('vehicleType', type); setShowTypeDropdown(false); }}
            >
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginTop: 40, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, padding: 14, fontSize: 15, color: '#333'
  },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownText: { fontSize: 15, color: '#333' },
  dropdownPlaceholder: { fontSize: 15, color: '#aaa' },
  dropdownArrow: { color: '#666', fontSize: 12 },
  dropdownList: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 10, marginTop: 4, overflow: 'hidden'
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemText: { fontSize: 15, color: '#333' },
  button: {
    backgroundColor: '#4f46e5', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 28, marginBottom: 16
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkBold: { color: '#4f46e5', fontWeight: '700' },
});
