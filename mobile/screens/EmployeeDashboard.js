import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function EmployeeDashboard({ navigation }) {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [leaveStatus, setLeaveStatus] = useState([]);
  const [advanceStatus, setAdvanceStatus] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [view, setView] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNewLeave, setHasNewLeave] = useState(false);
  const [hasNewAdvance, setHasNewAdvance] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    const id = await AsyncStorage.getItem('employeeId');
    const name = await AsyncStorage.getItem('employeeName');
    if (!token || role !== 'employee') {
      Alert.alert('Error', 'Access denied');
      navigation.replace('Login');
      return;
    }
    setEmployeeId(id);
    setEmployeeName(name);
  };

  const fetchNotifications = async () => {
    if (!employeeId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications/employee/${employeeId}`);
      if (res.data.success) {
        const leaves = res.data.notifications.filter(n => n.type === 'Leave' && !n.seen);
        const advs = res.data.notifications.filter(n => n.type === 'Advance' && !n.seen);
        setHasNewLeave(leaves.length > 0);
        setHasNewAdvance(advs.length > 0);
      }
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  const fetchAllData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const startDate = `${filterYear}-${filterMonth.toString().padStart(2, '0')}-01`;
      const endDateObj = new Date(filterYear, filterMonth, 0);
      const endDate = endDateObj.toISOString().split('T')[0];

      const attendanceRes = await axios.get(`${API_BASE_URL}/api/attendance?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${await AsyncStorage.getItem('token')}` },
      });
      const allRecords = Array.isArray(attendanceRes.data) ? attendanceRes.data : attendanceRes.data.attendance || [];
      const records = allRecords.filter(record => record.employee && record.employee._id === employeeId);
      setAttendance(records);
      const summary = { present: 0, absent: 0, late: 0, halfday: 0 };
      records.forEach(a => {
        const status = a.status.toLowerCase();
        if (status === 'present') {
          summary.present += 1;
          if (a.isLate) summary.late += 1;
        } else if (status === 'absent') summary.absent += 1;
        else if (status === 'halfday') summary.halfday += 1;
      });
      setMonthSummary(summary);

      const leaveRes = await axios.get(`${API_BASE_URL}/api/leave/employee/${employeeId}`);
      setLeaveStatus(leaveRes.data.leaves || []);

      const advStatusRes = await axios.get(`${API_BASE_URL}/api/advance/employee/${employeeId}`);
      setAdvanceStatus(advStatusRes.data.advances || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const markLeaveSeen = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/seen/${employeeId}`);
      setHasNewLeave(false);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking leave seen:', err);
    }
  };

  const markAdvanceSeen = async () => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/seen/${employeeId}`);
      setHasNewAdvance(false);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking advance seen:', err);
    }
  };

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  const handleLogout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Logged out', 'You have been logged out successfully.');
    navigation.replace('Login');
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{formatDate(item.date)}</Text>
      <Text style={styles.tableCell}>{item.status}</Text>
    </View>
  );

  const renderLeaveItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.tableCell}>{item.reason}</Text>
      <Text style={styles.tableCell}>{formatDate(item.fromDate)}</Text>
      <Text style={styles.tableCell}>{formatDate(item.toDate)}</Text>
      <Text style={[styles.tableCell, { color: item.status === 'Approved' ? 'green' : item.status === 'Rejected' ? 'red' : 'orange' }]}>{item.status}</Text>
    </View>
  );

  const renderAdvanceItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{formatDate(item.createdAt)}</Text>
      <Text style={styles.tableCell}>₹{item.amount}</Text>
      <Text style={styles.tableCell}>{item.reason}</Text>
      <Text style={[styles.tableCell, { color: item.status === 'Approved' ? 'green' : item.status === 'Rejected' ? 'red' : 'orange' }]}>{item.status}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>HOMZON EXCEL SERVICES PVT. LTD.</Text>
      <Text style={styles.welcome}>Welcome, <Text style={{ fontWeight: 'bold' }}>{employeeName}</Text> (ID: {employeeId})</Text>

      {view === '' && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('ApplyLeave')}>
            <Text style={styles.btnText}>📝 Apply Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('ApplyAdvance')}>
            <Text style={styles.btnText}>💰 Apply Advance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => { setView('attendance'); fetchAllData(); }}>
            <Text style={styles.btnText}>Attendance</Text>
          </TouchableOpacity>
          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => { setView('leave'); fetchAllData(); markLeaveSeen(); }}>
              <Text style={styles.btnText}>Leave Status</Text>
            </TouchableOpacity>
            {hasNewLeave && <View style={styles.notifDot} />}
          </View>
          <View style={styles.btnContainer}>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => { setView('advance'); fetchAllData(); markAdvanceSeen(); }}>
              <Text style={styles.btnText}>Advance Status</Text>
            </TouchableOpacity>
            {hasNewAdvance && <View style={styles.notifDot} />}
          </View>
          <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
            <Text style={styles.btnText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && <Text style={styles.loading}>Loading data...</Text>}

      {view === 'attendance' && (
        <View style={styles.viewContainer}>
          <Text style={styles.viewTitle}>Monthly Attendance Summary</Text>
          <View style={styles.filterRow}>
            <Text>Month: {filterMonth}</Text>
            <Text>Year: {filterYear}</Text>
            <TouchableOpacity style={styles.showBtn} onPress={fetchAllData}>
              <Text style={styles.btnText}>Show</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryBox}>
            <Text>Present: {monthSummary.present || 0}</Text>
            <Text>Absent: {monthSummary.absent || 0}</Text>
            <Text>Late: {monthSummary.late || 0}</Text>
            <Text>Halfday: {monthSummary.halfday || 0}</Text>
          </View>
          <Text style={styles.viewTitle}>Daily Attendance</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            <FlatList
              data={attendance}
              renderItem={renderAttendanceItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('')}>
            <Text style={styles.btnText}>⬅️ Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'leave' && (
        <View style={styles.viewContainer}>
          <Text style={styles.viewTitle}>Leave Applications</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Reason</Text>
              <Text style={styles.tableHeaderCell}>From</Text>
              <Text style={styles.tableHeaderCell}>To</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            <FlatList
              data={leaveStatus}
              renderItem={renderLeaveItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('')}>
            <Text style={styles.btnText}>⬅️ Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {view === 'advance' && (
        <View style={styles.viewContainer}>
          <Text style={styles.viewTitle}>Advance Requests</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Date</Text>
              <Text style={styles.tableHeaderCell}>Amount</Text>
              <Text style={styles.tableHeaderCell}>Reason</Text>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            <FlatList
              data={advanceStatus}
              renderItem={renderAdvanceItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setView('')}>
            <Text style={styles.btnText}>⬅️ Back</Text>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcome: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  menu: {
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    width: '80%',
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#9ca3af',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    width: '80%',
    alignItems: 'center',
  },
  btnContainer: {
    position: 'relative',
    width: '80%',
    margin: 5,
  },
  notifDot: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 10,
    height: 10,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  btnLogout: {
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    width: '80%',
    alignItems: 'center',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    margin: 20,
  },
  viewContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  viewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  showBtn: {
    backgroundColor: '#2563eb',
    padding: 5,
    borderRadius: 5,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ccc',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e7ff',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backBtn: {
    backgroundColor: '#6b7280',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
});
