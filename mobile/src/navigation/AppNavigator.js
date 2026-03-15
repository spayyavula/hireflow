import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { colors, roleColors } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import JobsScreen from '../screens/JobsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import IdeasScreen from '../screens/IdeasScreen';
import ChatScreen from '../screens/ChatScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import CandidatesScreen from '../screens/CandidatesScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Simple icon component using text symbols
const TabIcon = ({ name, color, size }) => {
  const icons = {
    jobs: '💼', resume: '📄', chat: '💬', analytics: '📊',
    ideas: '💡', matcher: '🎯', candidates: '👥', pipeline: '📋',
    dashboard: '🏠', profile: '👤',
  };
  return <Text style={{ fontSize: size - 4 }}>{icons[name] || '•'}</Text>;
};

// ─── Seeker Tabs ────────────────────────────────────────
function SeekerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Jobs" component={JobsScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="jobs" color={color} size={size} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} /> }}
      />
      <Tab.Screen name="Chat" component={ChatScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="chat" color={color} size={size} /> }}
      />
      <Tab.Screen name="Ideas" component={IdeasScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="ideas" color={color} size={size} /> }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="analytics" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Recruiter Tabs ─────────────────────────────────────
function RecruiterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Candidates" component={CandidatesScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="candidates" color={color} size={size} /> }}
      />
      <Tab.Screen name="Chat" component={ChatScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="chat" color={color} size={size} /> }}
      />
      <Tab.Screen name="Ideas" component={IdeasScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="ideas" color={color} size={size} /> }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="analytics" color={color} size={size} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Company Tabs ───────────────────────────────────────
function CompanyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: colors.lavender,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="dashboard" color={color} size={size} /> }}
      />
      <Tab.Screen name="Chat" component={ChatScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="chat" color={color} size={size} /> }}
      />
      <Tab.Screen name="Ideas" component={IdeasScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="ideas" color={color} size={size} /> }}
      />
      <Tab.Screen name="Analytics" component={AnalyticsScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="analytics" color={color} size={size} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Auth Stack ─────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Navigator ─────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 56, height: 56, borderRadius: 12, backgroundColor: colors.ink,
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <Text style={{ color: colors.cream, fontSize: 20, fontWeight: '800' }}>JS</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 8 }}>JobsSearch</Text>
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  switch (user.role) {
    case 'recruiter':
      return <RecruiterTabs />;
    case 'company':
      return <CompanyTabs />;
    default:
      return <SeekerTabs />;
  }
}
