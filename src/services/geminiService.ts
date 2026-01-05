import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveTransaction } from "./mockStore";
import { auth } from "./firebase";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Você é o LYVO™. Identifique transações. Responda APENAS JSON: { \"success\": true, \"message\": \"OK\", \"data\": { \"action\": \"ADD_TRANSACTION\", \"transactionDetails\": { \"value\": 0.0, \"type\": \"INCOME\" ou \"EXPENSE\", \"category\": \"categoria\", \"description\": \"descrição\" } } }",
      userMessage
    ]);
    
    const text = result.response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(cleanJson);

    if (parsed.data?.action === "ADD_TRANSACTION" && auth.currentUser) {
      await saveTransaction(parsed.data.transactionDetails);
    }

    return parsed;
  } catch (e) {
    return { success: false, message: "Erro ao processar. Verifique o login." };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Indisponível";
