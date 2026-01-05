import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function processUserCommand(userMessage: string) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Sessão expirada. Refaça o login." };

    // TESTANDO O MODELO FLASH NA ROTA BETA COM URL LIMPA
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `Extraia valor, tipo (INCOME/EXPENSE) e descrição de: "${userMessage}". Responda apenas o JSON puro: {"value": 0, "type": "", "description": ""}` 
            }] 
          }]
        })
      }
    );

    const result = await response.json();
    
    // Se o Google der erro, vamos capturar a mensagem exata dele
    if (result.error) {
      throw new Error(`Google diz: ${result.error.message}`);
    }

    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    // Gravação no Firebase
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      value: parseFloat(data.value),
      type: data.type,
      description: data.description,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    console.error("Erro Crítico LYVO:", e.message);
    return { success: false, message: e.message };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async () => "OFF";
