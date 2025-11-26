// src/functions/generatePlan.ts

import { doc, setDoc } from "firebase/firestore";
import { db } from "../app/src/services/firebase";
import { startOfWeekISO } from "./utils/date";

export type GeneratePlanInput = {
  uid: string;
  profile: any;
  latestDaily: {
    energy: number;
    soreness: number;
    motivation: number;
    stress: number;
    notes?: string;
  };
};

function buildPrompt(input: GeneratePlanInput) {
  const { profile, latestDaily } = input;

  return `
You are an elite Strength & Conditioning coach and sports scientist.  

Generate a **1-week training plan (Mon–Sun)** tailored to:
- Athlete profile (sport, goals, equipment, match day, experience)
- **Today's fatigue data** (energy, soreness, motivation, stress)
- Injury notes, recovery habits, etc.

ATHLETE PROFILE:
Sport: ${profile.sport}
Age: ${profile.age}
Gender: ${profile.gender}
Height: ${profile.height} cm
Weight: ${profile.weight} kg
Bio: ${profile.bio}
Goals: ${(profile.training?.goals || []).join(", ")}
Experience: ${profile.training?.experience}
Days Available: ${profile.training?.daysPerWeek}
Match Day: ${profile.training?.matchDay}
Equipment: ${(profile.training?.equipment || []).join(", ")}

DAILY CHECK-IN:
Energy: ${latestDaily.energy}/5
Soreness: ${latestDaily.soreness}/5
Motivation: ${latestDaily.motivation}/5
Stress: ${latestDaily.stress}/5
Notes: ${latestDaily.notes}

RULES FOR COACHING:
- Reduce intensity if soreness > 3  
- Increase intensity if energy > 3 and motivation > 3  
- Keep sessions simple if stress > 3  
- Include sport-specific drills  
- Consider match day tapering  
- Include warm-up, main, cooldown each day  
- Keep output safe and progressive  

OUTPUT FORMAT (REQUIRED):

1) A JSON block fenced with \`\`\`json containing EXACT shape:
{
  "meta": {...},
  "training": {...seven days...},
  "nutrition": {...seven days...}
}

2) Then a readable summary in a second fenced block.

Return **ONLY** the 2 fenced blocks.
`;
}

function parseHybridOutput(text: string) {
  const jsonMatch = text.match(/```json([\s\S]*?)```/i);
  const summaryMatch = text.match(/```(?!json)([\s\S]*?)```/i);

  if (!jsonMatch) throw new Error("Weekly plan JSON missing");

  const jsonRaw = jsonMatch[1].trim();
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  const plan = JSON.parse(jsonRaw);
  return { plan, summary };
}

export async function generateWeeklyPlan(input: GeneratePlanInput) {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing Groq API key");

  const prompt = buildPrompt(input);

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      messages: [
        { role: "system", content: "You are a precise S&C AI coach." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) throw new Error(await resp.text());
  const data = await resp.json();

  const text = data.choices[0].message.content;
  const { plan, summary } = parseHybridOutput(text);

  const weekId = plan.meta?.weekStartISO || startOfWeekISO(new Date());

  await setDoc(
    doc(db, "users", input.uid, "plans", weekId),
    {
      json: plan,
      summary,
      createdAt: new Date().toISOString(),
      source: "groq-llama-3.3-70b",
    },
    { merge: true }
  );

  return { planId: weekId };
}
