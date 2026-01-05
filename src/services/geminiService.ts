import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// MUDANÇA: v1 e gemini-pro (estável)
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

export async function processUserCommand(userMessage: string) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Sessão expirada. Refaça o login." };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição de: "${userMessage}". Responda APENAS JSON puro: {"value": 0, "type": "", "description": ""}` 
          }] 
        }]
      })
    });

    const result = await response.json();
    
    // Agora pegaremos o erro real se a chave falhar
    if (result.error) {
      return { success: false, message: `Erro Google: ${result.error.message}` };
    }

    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    await addDoc(collection(db, "users", user.uid, "transactions"), {
      value: parseFloat(data.value),
      type: data.type,
      description: data.description,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    return { success: false, message: `Erro: ${e.message}` };
  }
}
