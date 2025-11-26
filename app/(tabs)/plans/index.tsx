// app/(tabs)/plans/index.tsx
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { startOfWeekISO, todayISO } from "../../../functions/utils/date";
import { useAuth } from "../../src/context/authContext";
import { db } from "../../src/services/firebase";

export default function WeeklyPlans() {
  const router = useRouter();
  const { user } = useAuth();

  const today = todayISO();
  const weekId = startOfWeekISO(new Date(today));

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const planRef = doc(db, "users", user.uid, "plans", weekId);
        const snap = await getDoc(planRef);

        if (!snap.exists()) {
          setPlan(null);
        } else {
          const data: any = snap.data();
          setPlan(data.json);
          setSummary(data.summary || "");
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, weekId]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Please sign in.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  // ❌ No weekly plan exists
  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-white px-5 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Your Plan</Text>

        <View className="bg-red-50 border border-red-200 rounded-xl p-4">
          <Text className="text-red-700 font-semibold mb-2">No Plan Found</Text>
          <Text className="text-gray-700 mb-3">
            You don’t have a weekly plan yet. Go to the Home tab and complete your daily check-in or generate a plan.
          </Text>
          <Pressable
            onPress={() => router.push("/")}
            className="bg-[#2563EB] py-3 rounded-xl"
          >
            <Text className="text-white text-center font-semibold">Go to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // 🟩 Weekly plan exists — render the plan
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="px-5 py-6"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Week of {plan.meta?.weekStartISO}
        </Text>

        <Text className="text-gray-600 mb-4">
          Source: {plan.meta?.sport} • Goals: {(plan.meta?.goals || []).join(", ")}
        </Text>

        {/* Summary */}
        {summary ? (
          <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <Text className="font-semibold text-gray-800 mb-1">Summary</Text>
            <Text className="text-gray-700">{summary}</Text>
          </View>
        ) : null}

        {/* Training Plan */}
        <Text className="text-xl font-bold text-gray-900 mb-3">
          Training Plan
        </Text>

        {days.map((day) => {
          const data = plan.training[day];
          const label = day.charAt(0).toUpperCase() + day.slice(1);

          return (
            <View
              key={day}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4"
            >
              <Text className="text-lg font-semibold text-gray-900">{label}</Text>

              <Text className="text-gray-700 mt-1">
                <Text className="font-semibold">Focus: </Text>
                {data.focus}
              </Text>

              <Text className="font-semibold text-gray-800 mt-3">Warmup:</Text>
              {data.warmup.map((w: string, i: number) => (
                <Text key={i} className="text-gray-700">• {w}</Text>
              ))}

              <Text className="font-semibold text-gray-800 mt-3">Main:</Text>
              {data.main.map((m: string, i: number) => (
                <Text key={i} className="text-gray-700">• {m}</Text>
              ))}

              <Text className="font-semibold text-gray-800 mt-3">Cooldown:</Text>
              <Text className="text-gray-700">{data.cooldown}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
