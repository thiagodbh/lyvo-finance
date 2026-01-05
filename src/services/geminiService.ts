import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Sessão perdida. Faça login novamente." };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([
      "Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição em JSON.",
      userMessage
    ]);
    
    const text = result.response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    // SALVAMENTO DIRETO NO FIRESTORE (SEM INTERMEDIÁRIOS)
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      ...data,
      value: parseFloat(data.value),
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true, message: `✅ R$ ${data.value} salvo no seu perfil!`, data };

  } catch (e: any) {
    return { success: false, message: `Erro: ${e.message}` };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Off";
