import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveTransaction } from "./mockStore";
import { auth } from "./firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Você é o LYVO™. Extraia valor, tipo (INCOME/EXPENSE) e descrição em JSON.",
      userMessage
    ]);
    
    const text = result.response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const data = JSON.parse(cleanJson);

    if (auth.currentUser) {
      await saveTransaction(data);
      return { success: true, message: `✅ R$ ${data.value} registrado com sucesso!`, data };
    }
    
    return { success: false, message: "Por favor, faça login para salvar." };
  } catch (e) {
    return { success: false, message: "Erro ao processar comando." };
  }
}
