import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './screens/Login';
import EmployeeDashboard from './screens/EmployeeDashboard';
import SupervisorDashboard from './screens/SupervisorDashboard';
import ApplyLeave from './screens/ApplyLeave';
import ApplyAdvance from './screens/ApplyAdvance';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboard} />
        <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
        <Stack.Screen name="ApplyLeave" component={ApplyLeave} />
        <Stack.Screen name="ApplyAdvance" component={ApplyAdvance} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
