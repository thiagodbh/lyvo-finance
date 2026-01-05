import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™. Sua missão é identificar transações financeiras.
      Responda EXATAMENTE neste formato JSON:
      {
        "success": true,
        "message": "Sua confirmação aqui",
        "data": {
          "action": "ADD_TRANSACTION",
          "transactionDetails": { "value": 0.0, "type": "INCOME" ou "EXPENSE", "category": "categoria", "description": "descrição" }
        }
      }
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiResponse = result.response.text().trim();
    
    let parsed;
    try {
        const startJson = aiResponse.indexOf('{');
        const endJson = aiResponse.lastIndexOf('}') + 1;
        parsed = JSON.parse(aiResponse.substring(startJson, endJson));
    } catch (e) {
        return { success: false, message: aiResponse, data: { action: 'UNKNOWN' } };
    }

    // TENTATIVA DE SALVAMENTO (Não trava se falhar)
    if (parsed.success && parsed.data?.action === "ADD_TRANSACTION") {
        try {
            await saveTransaction(parsed.data.transactionDetails);
        } catch (dbError) {
            // Se o erro for aqui, avisamos que entendeu, mas o banco falhou
            parsed.message = "Entendi o registro, mas não consegui salvar no Firebase (verifique seu login).";
        }
    }

    return parsed;

  } catch (error) {
    return { success: false, message: "A IA não conseguiu processar. Pode repetir?" };
  }
}

export const executeAction = (data: any) => ({ message: "OK" });
export const analyzeReceiptImage = async (img: string) => "Indisponível";
