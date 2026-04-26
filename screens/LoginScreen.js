import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return Alert.alert('Error', 'Enter username and password');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      await login(res.data.token, res.data.user);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Vehicle Management App</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>New user? <Text style={styles.linkBold}>Register here</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 14, fontSize: 15, color: '#333', backgroundColor: '#fafafa'
  },
  button: {
    backgroundColor: '#4f46e5', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 28, marginBottom: 16
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkBold: { color: '#4f46e5', fontWeight: '700' },
});
