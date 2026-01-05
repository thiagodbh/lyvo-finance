import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// A URL correta para v1beta não deve ter o prefixo 'models/' se o modelo for especificado assim
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
            text: `Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição de: "${userMessage}". Responda APENAS o JSON puro, sem markdown: {"value": 0, "type": "", "description": ""}` 
          }] 
        }]
      })
    });

    const result = await response.json();
    
    // Se o Google responder erro, agora pegaremos a mensagem real
    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.candidates || !result.candidates[0]) {
      throw new Error("Resposta vazia da IA. Tente novamente.");
    }

    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    // Gravação direta no Firebase
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      value: parseFloat(data.value),
      type: data.type,
      description: data.description,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    console.error("Erro LYVO:", e.message);
    return { success: false, message: `Erro: ${e.message}` };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Off";
