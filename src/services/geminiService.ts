import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string, imageBase64?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™, assistente financeiro. 
      Sua missão é identificar transações financeiras (ganhos e gastos).
      
      IMPORTANTE: Responda APENAS com o JSON abaixo, sem textos antes ou depois.
      {
        "success": true,
        "message": "Sua confirmação aqui",
        "data": {
          "action": "ADD_TRANSACTION",
          "transactionDetails": {
            "value": 0.0,
            "type": "INCOME" ou "EXPENSE",
            "category": "categoria",
            "description": "descrição"
          }
        }
      }
      Se não for uma transação, use success: false.
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiResponse = result.response.text().trim();
    
    let parsed;
    try {
        const startJson = aiResponse.indexOf('{');
        const endJson = aiResponse.lastIndexOf('}') + 1;
        const jsonString = aiResponse.substring(startJson, endJson);
        parsed = JSON.parse(jsonString);
    } catch (e) {
        return { success: false, message: aiResponse, data: { action: 'UNKNOWN' } };
    }

    // INTEGRAÇÃO COM FIREBASE
    if (parsed.success && parsed.data && parsed.data.action === "ADD_TRANSACTION") {
        try {
            await saveTransaction(parsed.data.transactionDetails);
        } catch (dbError) {
            console.error("Erro no Firebase:", dbError);
            return { 
              success: true, // Mantemos true para mostrar o card, mas avisamos do erro
              message: "Entendi o valor, mas não consegui salvar no banco. Verifique se você está logado.",
              data: parsed.data 
            };
        }
    }

    return parsed;

  } catch (error) {
    console.error("Erro Geral:", error);
    return { success: false, message: "Erro ao processar. Pode repetir?" };
  }
}

export const executeAction = (data: any) => ({ message: "Ação concluída!" });
export const analyzeReceiptImage = async (img: string) => "Análise indisponível.";
