// src/functions/generateDailyAdjustment.ts

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../app/src/services/firebase";
import { startOfWeekISO, todayISO } from "./utils/date";

export async function generateDailyAdjustment({ uid }: { uid: string }) {
  const today = todayISO();
  const weekId = startOfWeekISO(new Date(today));
  const dayName = new Date(today).toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase();

  const planRef = doc(db, "users", uid, "plans", weekId);
  const planSnap = await getDoc(planRef);
  if (!planSnap.exists()) throw new Error("Weekly plan not found");

  const weekly = planSnap.data().json;
  const todayWorkout = weekly.training[dayName];

  if (!todayWorkout) throw new Error("Today's training block missing");

  const dailyRef = doc(db, "users", uid, "daily", today);
  const dailySnap = await getDoc(dailyRef);
  if (!dailySnap.exists()) throw new Error("Daily check-in missing");

  const daily = dailySnap.data();

  const adjPrompt = `
You are an elite S&C coach. Adjust today's workout based on:

Workout:
${JSON.stringify(todayWorkout, null, 2)}

Daily Check-in:
Energy ${daily.energy}/5
Soreness ${daily.soreness}/5
Motivation ${daily.motivation}/5
Stress ${daily.stress}/5
Notes: ${daily.notes}

Rules:
- Reduce intensity if soreness > 3 or stress > 3
- Increase intensity if energy > 3 and motivation > 3
- Keep workouts safe
- Return JSON ONLY:

{
  "adjustedFocus": "...",
  "main": ["...", "..."],
  "coachNotes": "..."
}
`;

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You adjust workouts safely" },
        { role: "user", content: adjPrompt },
      ],
    }),
  });

  const data = await resp.json();
  const text = data.choices[0].message.content;

  const jsonMatch = text.match(/```json([\s\S]*?)```/i);
  if (!jsonMatch) throw new Error("Adjustment JSON missing");

  const plan = JSON.parse(jsonMatch[1].trim());

  await setDoc(
    doc(db, "users", uid, "plans", weekId, "adjustments", today),
    {
      plan,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return plan;
}
