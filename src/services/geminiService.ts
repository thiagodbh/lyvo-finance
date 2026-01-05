import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// A URL deve ser EXATAMENTE esta para não dar erro de "not found"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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
            text: `Extraia valor, tipo (INCOME/EXPENSE) e descrição de: "${userMessage}". Responda apenas JSON puro: {"value": 0, "type": "", "description": ""}` 
          }] 
        }]
      })
    });

    const result = await response.json();
    
    // Se o Google recusar a chave ou o modelo, o erro virá aqui
    if (result.error) {
      return { success: false, message: `Google: ${result.error.message}` };
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

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "OFF";
