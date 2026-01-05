import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function processUserCommand(userMessage: string) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Sessão expirada. Faça login." };

    // URL usando v1beta para garantir compatibilidade com o modelo flash 1.5
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Aja como LYVO. Extraia valor, tipo (INCOME/EXPENSE) e descrição de: "${userMessage}". Responda APENAS JSON: {"value": 0, "type": "", "description": ""}` }] }]
        })
      }
    );

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const text = result.candidates[0].content.parts[0].text;
    const data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));

    await addDoc(collection(db, "users", user.uid, "transactions"), {
      ...data,
      value: parseFloat(data.value),
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} salvo!` };
  } catch (e: any) {
    return { success: false, message: `Google diz: ${e.message}` };
  }
}
