import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveTransaction } from "./mockStore";
import { auth } from "./firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Função para garantir que o Firebase carregou o usuário
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

export async function processUserCommand(userMessage: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Você precisa estar logado para salvar." };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição em JSON. Responda APENAS o JSON.",
      userMessage
    ]);
    
    const text = result.response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    await saveTransaction(data);
    return { success: true, message: `✅ R$ ${data.value} registrado!`, data };

  } catch (e: any) {
    console.error(e);
    return { success: false, message: `Erro: ${e.message}` };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Indisponível";
