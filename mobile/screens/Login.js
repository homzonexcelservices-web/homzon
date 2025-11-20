import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function Login({ navigation }) {
  const [role, setRole] = useState('employee');
  const [mobileOrId, setMobileOrId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkLoggedIn();
  }, []);

  const checkLoggedIn = async () => {
    const token = await AsyncStorage.getItem('token');
    const dashboardRoute = await AsyncStorage.getItem('dashboardRoute');
    if (token && dashboardRoute) {
      navigation.replace(dashboardRoute);
    }
  };

  const handleSubmit = async () => {
    if (!mobileOrId || !password) {
      Alert.alert('Error', 'Enter ID and Password');
      return;
    }

    try {
      const payload = { role, mobileOrId, password };

      const res = await axios.post(`${API_BASE_URL}/api/login`, payload);

      if (res.status === 200) {
        Alert.alert('Success', `Login successful as ${res.data.role}`);

        await AsyncStorage.setItem('token', res.data.token);
        await AsyncStorage.setItem('role', res.data.role);
        await AsyncStorage.setItem('name', res.data.name);
        await AsyncStorage.setItem('empId', res.data.empId);

        let dashboardRoute = 'EmployeeDashboard';

        if (res.data.role === 'supervisor') {
          await AsyncStorage.setItem('userId', res.data.userId);
          await AsyncStorage.setItem('supervisorId', res.data.supervisorId);
          dashboardRoute = 'SupervisorDashboard';
        } else if (res.data.role === 'employee') {
          if (res.data.employee) {
            await AsyncStorage.setItem('employeeId', res.data.employee._id);
            await AsyncStorage.setItem('employeeName', res.data.employee.name);
            await AsyncStorage.setItem('supervisorId', res.data.employee.supervisorId || '');
            await AsyncStorage.setItem('supervisorName', res.data.employee.supervisorName || '');
          }
          dashboardRoute = 'EmployeeDashboard';
        }

        await AsyncStorage.setItem('dashboardRoute', dashboardRoute);
        navigation.replace(dashboardRoute);
      } else {
        Alert.alert('Error', res.data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'Connection failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HOMZON EXCEL SERVICES PVT. LTD.</Text>
        <Text style={styles.subtitle}>
          Address-640, Narsingh Ward, Above Bandhan Bank, Madan Mahal, Jabalpur (M.P.)-482001
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Login as</Text>
        <View style={styles.pickerContainer}>
          <TextInput
            style={styles.picker}
            value={role}
            onChangeText={setRole}
            placeholder="employee or supervisor"
          />
        </View>

        <Text style={styles.label}>ID</Text>
        <TextInput
          style={styles.input}
          value={mobileOrId}
          onChangeText={setMobileOrId}
          placeholder={`Enter ${role.toUpperCase()} ID`}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  picker: {
    padding: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
