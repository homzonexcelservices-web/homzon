import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Change to your backend IP

export default function ApplyLeave({ navigation }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!fromDate || !toDate || !reason) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const employeeId = await AsyncStorage.getItem('employeeId');
    const employeeName = await AsyncStorage.getItem('employeeName');
    const supervisorId = await AsyncStorage.getItem('supervisorId');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/leave/apply`, {
        employeeId,
        employeeName,
        supervisorId,
        fromDate,
        toDate,
        reason,
      });

      Alert.alert('Success', 'Leave application submitted successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Apply leave error:', err);
      Alert.alert('Error', 'Failed to submit application');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Apply for Leave</Text>
      <View style={styles.form}>
        <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={fromDate}
          onChangeText={setFromDate}
          placeholder="e.g., 2023-10-01"
        />
        <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={toDate}
          onChangeText={setToDate}
          placeholder="e.g., 2023-10-05"
        />
        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Enter reason for leave"
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit Application</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Back</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 30,
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
    marginBottom: 10,
  },
  backBtn: {
    backgroundColor: '#6b7280',
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
