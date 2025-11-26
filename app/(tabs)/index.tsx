<<<<<<< Updated upstream
import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
=======
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateDailyAdjustment } from "../../functions/generateDailyAdjustment";
import {
  dayNameFromISO,
  startOfWeekISO,
  todayISO,
} from "../../functions/utils/date";
import { useAuth } from "../src/context/authContext";
import { db } from "../src/services/firebase";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const today = todayISO();

  const [loading, setLoading] = useState(true);
  const [daily, setDaily] = useState<any>(null);
  const [adjustment, setAdjustment] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  // Daily check-in form state
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [motivation, setMotivation] = useState(3);
  const [stress, setStress] = useState(2);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);

      try {
        // Load profile
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);
        setProfile(profileSnap.exists() ? profileSnap.data() : null);

        // Check if onboarding done — but do NOT load daily/adjustments yet
        if (!profileSnap.exists() || !profileSnap.data().onboardingCompletedAt) {
          setLoading(false);
          return; // stop here so UI can show onboarding gate
        }

        // Load today's daily check-in
        const dailyRef = doc(db, "users", user.uid, "daily", today);
        const dailySnap = await getDoc(dailyRef);
        if (dailySnap.exists()) setDaily(dailySnap.data());

        // Load adjustment (requires weekly plan)
        const weekId = startOfWeekISO(new Date(today));
        const adjRef = doc(
          db,
          "users",
          user.uid,
          "plans",
          weekId,
          "adjustments",
          today
        );
        const adjSnap = await getDoc(adjRef);
        if (adjSnap.exists()) setAdjustment(adjSnap.data());
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  //-----------------------------
  // DAILY CHECK-IN SUBMIT
  //-----------------------------
  const handleCheckinSubmit = async () => {
    if (!user) return;

    try {
      setSubmitting(true);

      // 1) Save the check-in
      const dailyRef = doc(db, "users", user.uid, "daily", today);
      await setDoc(dailyRef, {
        sleepQuality: 3,
        soreness,
        energy,
        motivation,
        stress,
        notes,
        createdAt: new Date().toISOString(),
      });

      setDaily({ energy, soreness, motivation, stress, notes });

      // 2) Require weekly plan BEFORE generating daily adjustment
      const weekId = startOfWeekISO(new Date(today));
      const planRef = doc(db, "users", user.uid, "plans", weekId);
      const planSnap = await getDoc(planRef);

      if (!planSnap.exists()) {
        Alert.alert(
          "No weekly plan found",
          "You must generate a weekly plan first (from the Dashboard)."
        );
        return;
      }

      // 3) Generate today's adjustment
      await generateDailyAdjustment({ uid: user.uid });
      Alert.alert("Check-in saved", "Your plan has been adjusted for today!");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  //-----------------------------
  // RENDER
  //-----------------------------

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

  //-----------------------------
  //  🔒 ONBOARDING GATE
  //-----------------------------
  if (!profile?.onboardingCompletedAt) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-3">
          Complete Your Onboarding
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          We need a few details to personalise your training & nutrition plan.
        </Text>

        <Pressable
          onPress={() => router.push("/onboarding")}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white text-lg font-semibold">Start Onboarding</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  //-----------------------------
  //  MAIN DASHBOARD VIEW
  //-----------------------------
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-5 py-6" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.displayName || "Athlete"} 👋
        </Text>

        <Text className="text-gray-600 mb-6">
          {dayNameFromISO(today)} · {today}
        </Text>

        {/* Already checked in */}
        {daily ? (
          <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <Text className="font-semibold text-gray-800 mb-2">
              Daily Check-in Complete ✅
            </Text>
            <Text className="text-gray-600">
              Energy {daily.energy}/5 · Soreness {daily.soreness}/5 · Motivation{" "}
              {daily.motivation}/5
            </Text>
          </View>
        ) : (
          // Check-in form
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <Text className="font-semibold text-gray-800 mb-3">
              How do you feel today?
            </Text>

            {/* Rating Inputs */}
            {[
              { label: "Energy", value: energy, setter: setEnergy },
              { label: "Soreness", value: soreness, setter: setSoreness },
              { label: "Motivation", value: motivation, setter: setMotivation },
              { label: "Stress", value: stress, setter: setStress },
            ].map(({ label, value, setter }) => (
              <View key={label} className="mb-3">
                <Text className="text-gray-700 mb-1">
                  {label}: {value}/5
                </Text>
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setter(n)}
                      className={`px-3 py-1 mr-2 rounded-full border ${
                        n === value
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      <Text
                        className={
                          n === value ? "text-white" : "text-gray-700"
                        }
                      >
                        {n}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            {/* Notes */}
            <Text className="text-gray-700 mb-1">Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Slept poorly, slight soreness..."
              className="border border-gray-300 rounded-xl px-4 py-2 bg-white text-gray-800 mb-3"
            />

            {/* Submit */}
            <Pressable
              onPress={handleCheckinSubmit}
              disabled={submitting}
              className={`rounded-xl py-3 ${
                submitting ? "bg-gray-400" : "bg-blue-600"
              }`}
            >
              <Text className="text-center text-white font-semibold">
                {submitting ? "Saving..." : "Submit Check-in"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Adjustment Loader */}
        {daily && !adjustment && (
          <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <Text className="font-semibold text-gray-800 mb-2">
              Generating your adjusted plan...
            </Text>
            <ActivityIndicator color="#2563EB" />
          </View>
        )}

        {/* Adjustment Display */}
        {adjustment && (
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Today’s Adjusted Plan 📋
            </Text>

            <Text className="text-gray-700">
              Focus: {adjustment?.plan?.adjustedFocus}
            </Text>

            <Text className="font-semibold text-gray-800 mt-3">Main</Text>
            {adjustment?.plan?.main?.map((m: string, i: number) => (
              <Text key={i} className="text-gray-700">
                • {m}
              </Text>
            ))}

            <Text className="font-semibold text-gray-800 mt-3">Coach Notes</Text>
            <Text className="text-gray-700">
              {adjustment?.plan?.coachNotes}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
>>>>>>> Stashed changes
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
