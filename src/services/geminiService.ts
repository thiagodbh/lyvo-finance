import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// USANDO A ROTA MAIS ESTÁVEL POSSÍVEL (v1) E O MODELO QUE NÃO SAI DO AR
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
            text: `Você é o LYVO™. Extraia valor numérico, tipo (INCOME ou EXPENSE) e descrição de: "${userMessage}". Responda APENAS o JSON puro, sem textos extras: {"value": 0, "type": "", "description": ""}` 
          }] 
        }]
      })
    });

    const result = await response.json();
    
    // Se o Google der erro, a mensagem aparecerá aqui para sabermos o real motivo
    if (result.error) {
      return { success: false, message: `Erro Google: ${result.error.message}` };
    }

    if (!result.candidates || !result.candidates[0]) {
      throw new Error("Resposta vazia da IA. Tente novamente.");
    }

    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    // Salva direto no Firestore do usuário logado
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      value: parseFloat(data.value),
      type: data.type,
      description: data.description,
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    console.error("Erro Crítico:", e.message);
    return { success: false, message: `Erro: ${e.message}` };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async () => "Indisponível nesta versão";
