import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import TasksScreen from '../screens/main/TasksScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import HealthScreen from '../screens/main/HealthScreen';
import FinanceScreen from '../screens/main/FinanceScreen';
import NotesScreen from '../screens/main/NotesScreen';
import CalendarScreen from '../screens/main/CalendarScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator({ user, onLogout }) {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard">
        {(props) => <DashboardScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Tasks">
        {(props) => <TasksScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Goals">
        {(props) => <GoalsScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Health">
        {(props) => <HealthScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Finance">
        {(props) => <FinanceScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Notes">
        {(props) => <NotesScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Calendar">
        {(props) => <CalendarScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
