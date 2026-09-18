import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

/** Screens that live inside (tabs)/ but should NOT appear in the tab bar */

// Custom Tab Button to inject Haptic Feedback
const TabBarButton = (props) => (
  <Pressable
    {...props}
    onPress={(e) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      props.onPress?.(e);
    }}
  />
);

// Custom tab bar label
function TabLabel({ label, focused }) {
  return (
    <Text
      style={[
        styles.tabLabel,
        focused ? styles.tabLabelActive : styles.tabLabelInactive,
      ]}
    >
      {label}
    </Text>
  );
}

// Custom tab bar icon wrapper with the "Pill" effect
function TabIcon({ name, focused, color, size }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? name.replace('-outline', '') : name}
        size={focused ? size - 2 : size - 4}
        color={color}
      />
    </View>
  );
}

export default function Layout() {
  const { initializing, isSignedIn } = useAuth();

  if (!initializing && !isSignedIn) {
    return <Redirect href={'/(auth)/login'} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.success,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarButton: TabBarButton,
        tabBarItemStyle: { flex: 1 },
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : undefined,
      }}
    >
      {/* ── VISIBLE TABS ─────────────────────────────── */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="home-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />

      {/* <Tabs.Screen
        name="batch"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Batches" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="egg-outline" focused={focused} color={color} size={size} />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="tasks"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Tasks" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="checkbox-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Chats" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="chatbubble-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Orders" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="cart-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="growthLog"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="GrowthLog" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="receipt" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="breeds"
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Breeds" focused={focused} />,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="paw-outline" focused={focused} color={color} size={size} />
          ),
        }}
      />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#ffffff',
    borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
    borderTopColor: '#F3F4F6',
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingHorizontal: 8,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: `${Colors.light.success}15`,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  tabLabelActive: {
    color: Colors.light.success,
  },
  tabLabelInactive: {
    color: '#9CA3AF',
  },
});