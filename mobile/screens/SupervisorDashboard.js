import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function SupervisorDashboard({ navigation }) {
  const [view, setView] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveNotifications, setLeaveNotifications] = useState(false);
  const [advanceNotifications, setAdvanceNotifications] = useState(false);
  const [supervisorId, setSupervisorId] = useState('');
  const [supervisorName, setSupervisorName] = useState('');

  useEffect(() => {
    checkAuth();
    checkNotifications();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    const id = await AsyncStorage.getItem('supervisorId');
    const name = await AsyncStorage.getItem('name');
    if (!token || role !== 'supervisor') {
      Alert.alert('Error', 'Access denied');
      navigation.replace('Login');
      return;
    }
    setSupervisorId(id);
    setSupervisorName(name);
  };

  const checkNotifications = async () => {
    if (!supervisorId) return;
    try {
      const leaveRes = await axios.get(`${API_BASE_URL}/api/leave/supervisor/${supervisorId}`);
      const advanceRes = await axios.get(`${API_BASE_URL}/api/advance/supervisor/${supervisorId}`);

      if (leaveRes.data?.leaves) {
        const hasUnseenLeave = leaveRes.data.leaves.some(l => l.status === 'Pending' && !l.notificationSeen);
        setLeaveNotifications(hasUnseenLeave);
      }

      if (advanceRes.data?.advances) {
        const hasUnseenAdvance = advanceRes.data.advances.some(a => a.status === 'Pending' && !a.notificationSeen);
        setAdvanceNotifications(hasUnseenAdvance);
      }
    } catch (err) {
      console.error('Notification check error:', err);
    }
  };

  const fetchData = async (type) => {
    setLoading(true);
    const endpoint = type === 'leaves' ? `${API_BASE_URL}/api/leave/supervisor/${supervisorId}` : `${API_BASE_URL}/api/advance/supervisor/${supervisorId}`;

    try {
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
      });

      if (type === 'leaves' && res.data?.leaves) setLeaveRequests(res.data.leaves);
      if (type === 'advances' && res.data?.advances) setAdvanceRequests(res.data.advances);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const handleAction = async (type, id, status) => {
    const endpoint = type === 'leave' ? `${API_BASE_URL}/api/leave/update/${id}` : `${API_BASE_URL}/api/advance/update/${id}`;

    try {
      const res = await axios.put(endpoint, {
        status,
        role: 'Supervisor',
        approverName: supervisorName,
      });
      Alert.alert('Success', res.data.message || 'Status updated successfully');
      fetchData(type === 'leave' ? 'leaves' : 'advances');
      checkNotifications();
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Logged out', 'You have been logged out successfully.');
    navigation.replace('Login');
  };

  const renderLeaveItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.employeeName}</Text>
      <Text style={styles.tableCell}>{item.fromDate}</Text>
      <Text style={styles.tableCell}>{item.toDate}</Text>
      <Text style={styles.tableCell}>{item.reason}</Text>
      <Text style={styles.tableCell}>{item.status}</Text>
      <View style={styles.actionCell}>
        {item.status === 'Pending' ? (
          <>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('leave', item._id, 'Approved')}>
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('leave', item._id, 'Rejected')}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>{item.status}</Text>
        )}
      </View>
    </View>
  );

  const renderAdvanceItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.employeeName}</Text>
      <Text style={styles.tableCell}>₹{item.amount}</Text>
      <Text style={styles.tableCell}>{item.reason}</Text>
      <Text style={styles.tableCell}>{item.status}</Text>
      <View style={styles.actionCell}>
        {item.status === 'Pending' ? (
          <>
            <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction('advance', item._id, 'Approved')}>
              <Text style={styles.btnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction('advance', item._id, 'Rejected')}>
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>{item.status}</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HOMZON EXCEL SERVICES PVT. LTD.</Text>
        <Text style={styles.subtitle}>Supervisor Dashboard</Text>
        <Text style={styles.welcome}>Welcome, {supervisorName}</Text>
      </View>

      {view === '' && (
        <View style={styles.menu}>
          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.mainBtn} onPress={() => { setView('leaves'); fetchData('leaves'); }}>
              <Text style={styles.btnText}>📝 Leave Requests</Text>
            </TouchableOpacity>
            {leaveNotifications && <View style={styles.notifDot} />}
          </View>
          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.mainBtn} onPress={() => { setView('advances'); fetchData('advances'); }}>
              <Text style={styles.btnText}>💰 Advance Requests</Text>
            </TouchableOpacity>
            {advanceNotifications && <View style={styles.notifDot} />}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.btnText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'leaves' && (
        <View style={styles.contentBox}>
          <Text style={styles.viewTitle}>Leave Requests</Text>
          {loading ? (
            <Text>Loading...</Text>
          ) : leaveRequests.length === 0 ? (
            <Text>No leave requests found.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Employee</Text>
                <Text style={styles.tableHeaderCell}>From</Text>
                <Text style={styles.tableHeaderCell}>To</Text>
                <Text style={styles.tableHeaderCell}>Reason</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
                <Text style={styles.tableHeaderCell}>Action</Text>
              </View>
              <FlatList
                data={leaveRequests}
                renderItem={renderLeaveItem}
                keyExtractor={(item) => item._id}
              />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('')}>
            <Text style={styles.btnText}>⬅️ Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'advances' && (
        <View style={styles.contentBox}>
          <Text style={styles.viewTitle}>Advance Requests</Text>
          {loading ? (
            <Text>Loading...</Text>
          ) : advanceRequests.length === 0 ? (
            <Text>No advance requests found.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Employee</Text>
                <Text style={styles.tableHeaderCell}>Amount</Text>
                <Text style={styles.tableHeaderCell}>Reason</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
                <Text style={styles.tableHeaderCell}>Action</Text>
              </View>
              <FlatList
                data={advanceRequests}
                renderItem={renderAdvanceItem}
                keyExtractor={(item) => item._id}
              />
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('')}>
            <Text style={styles.btnText}>⬅️ Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eef2ff',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 16,
    color: '#1e3a8a',
    marginTop: 5,
  },
  welcome: {
    marginTop: 5,
    fontWeight: '500',
    color: '#374151',
  },
  menu: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  btnContainer: {
    position: 'relative',
    width: '80%',
    margin: 10,
  },
  mainBtn: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    backgroundColor: 'red',
    borderRadius: 6,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  contentBox: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  viewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  actionCell: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: 'green',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
  },
  rejectBtn: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  backBtn: {
    backgroundColor: '#6b7280',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
});
