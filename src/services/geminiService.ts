import { GoogleGenerativeAI } from "@google/generative-ai";
import { getTransactions } from "./mockStore"; 

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function processUserCommand(userMessage: string) {
  try {
    // 1. Buscamos os dados (por enquanto focados em transações)
    const transactions = await getTransactions() || [];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Criamos um Contexto Mestre que explica TODAS as suas funcionalidades para a IA
    const masterContext = `
      Você é o cérebro do LYVO™, um ecossistema de produtividade pessoal.
      O aplicativo possui as seguintes áreas que você deve gerenciar:
      1. FINANCEIRO: Registro de ganhos (INCOME) e gastos (EXPENSE).
      2. AGENDA: Gestão de compromissos e calendários sincronizados.
      3. CARTÕES: Controle de faturas e limites de crédito.
      4. PREVISIBILIDADE: Análise de gastos futuros e metas.

      DADOS REAIS ATUAIS (JSON): ${JSON.stringify(transactions)}

      DIRETRIZES DE RESPOSTA:
      - Se o usuário disser algo como "recebi", "ganhei", "paguei", "comprei", confirme que você entendeu o valor e que, assim que a função de gravação for liberada, você salvará no Financeiro.
      - Se ele perguntar sobre compromissos, diga que você está acessando a Agenda dele.
      - Responda de forma curta, executiva e SEMPRE em Português Brasil.
      - Caso os dados acima estejam vazios [], diga: "Ainda não vejo registros no seu banco de dados, mas estou pronto para ajudar a organizar suas finanças e agenda!"
    `;

    // 3. Enviamos para a IA
    const result = await model.generateContent([masterContext, userMessage]);
    const response = await result.response;
    
    return { text: response.text() }; 
  } catch (error) {
    console.error("Erro Crítico no Gemini:", error);
    return { text: "Estou tendo dificuldade em acessar seu banco de dados agora. Pode tentar novamente em um instante?" };
  }
}

export const executeAction = async () => {};
export const analyzeReceiptImage = async () => ({ text: "Análise de imagem em manutenção." });
