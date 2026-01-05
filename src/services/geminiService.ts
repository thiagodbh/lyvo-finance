import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Sessão expirada. Refaça o login." };

    // gemini-1.0-pro é o modelo estável para a rota v1 da biblioteca
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" }); 
    
    const result = await model.generateContent([
      "Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição. Responda APENAS JSON puro: {\"value\": 0, \"type\": \"\", \"description\": \"\"}",
      userMessage
    ]);
    
    const text = result.response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    await addDoc(collection(db, "users", user.uid, "transactions"), {
      ...data,
      value: parseFloat(data.value),
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    // Retorna o erro real para sabermos se é banco ou API
    return { success: false, message: `Erro: ${e.message.includes('404') ? 'Modelo incompatível' : e.message}` };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Indisponível nesta versão";
