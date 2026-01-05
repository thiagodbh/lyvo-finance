import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions, saveTransaction } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é o LYVO™, assistente financeiro. 
      Sua missão é identificar transações.
      
      Se o usuário informar um valor e uma ação (ganhei, recebi, paguei, gastei), você DEVE responder EXATAMENTE este JSON:
      {
        "action": "SAVE",
        "data": {
          "value": 0.0,
          "type": "INCOME" ou "EXPENSE",
          "description": "descrição",
          "category": "categoria"
        },
        "message": "Texto de confirmação amigável"
      }
      
      Se for apenas conversa, use este formato:
      { "action": "UNKNOWN", "message": "Sua resposta aqui" }
    `;

    const result = await model.generateContent([systemPrompt, userMessage]);
    const aiResponse = result.response.text().trim();
    
    // Limpeza de possíveis formatações Markdown da IA
    const jsonClean = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonClean);

    // Se a IA identificou uma transação, salvamos no Firebase agora
    if (parsed.action === "SAVE") {
        await saveTransaction(parsed.data);
        return {
            success: true,
            data: parsed.data,
            message: `✅ Perfeito! Já registrei seu ${parsed.data.type === 'INCOME' ? 'ganho' : 'gasto'} de R$ ${parsed.data.value} aqui no LYVO™.`
        };
    }

    // Se for apenas conversa
    return {
        success: false,
        data: { action: 'UNKNOWN' },
        message: parsed.message || aiResponse
    };

  } catch (error) {
    console.error("Erro no Gemini:", error);
    return {
        success: false,
        message: "Ops, tive um erro técnico. Pode repetir o valor?"
    };
  }
}

export const executeAction = (data: any) => ({ message: "Ação executada com sucesso!" });
export const analyzeReceiptImage = async (img: string) => "Análise de imagem em manutenção.";
