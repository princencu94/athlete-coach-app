<<<<<<< Updated upstream
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

=======
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
>>>>>>> Stashed changes
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
<<<<<<< Updated upstream
        tabBarButton: HapticTab,
      }}>
=======
        tabBarActiveTintColor: "#16a34a",
      }}
    >
>>>>>>> Stashed changes
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
<<<<<<< Updated upstream
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
=======
        name="plans"
        options={{
          title: "Plans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
>>>>>>> Stashed changes
        }}
      />

      {/* hidden route */}
      <Tabs.Screen name="plans/[id]" options={{ href: null }} />
      <Tabs.Screen name="dailyCheckin" options={{ href: null }} />
      <Tabs.Screen name="workouts" options={{ href: null }} />
    </Tabs>
  );
}
