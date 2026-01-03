
import { GoogleGenAI, Type } from "@google/genai";
import { store } from "./mockStore";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const actionSchema = {
    type: Type.OBJECT,
    properties: {
        action: { 
            type: Type.STRING, 
            enum: ["ADD_TRANSACTION", "ADD_CREDIT_TRANSACTION", "ADD_EVENT", "QUERY", "UNKNOWN"],
            description: "The type of action. Use ADD_CREDIT_TRANSACTION if user mentions card or installments."
        },
        transactionDetails: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"] },
                value: { type: Type.NUMBER },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                cardName: { type: Type.STRING },
                installments: { type: Type.NUMBER }
            }
        },
        eventDetails: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "EXACT text provided by the user for the event. DO NOT summarize or change words." },
                dateTime: { type: Type.STRING, description: "ISO 8601 string (YYYY-MM-DDTHH:mm:ss) reflecting the wall-clock time in Brazil (GMT-3). Example: 14:00 becomes T14:00:00." },
                description: { type: Type.STRING },
                category: { type: Type.STRING, description: "Inferred category: Work, Health, Leisure, Personal, etc." }
            }
        },
        responseMessage: {
            type: Type.STRING,
            description: "Friendly summary in Portuguese. MUST use exact template: 'Interpretei: [Título/Descrição] para o dia [Data Formatada] às [Hora] (ou valor [R$]). Correto?'"
        }
    },
    required: ["action", "responseMessage"]
};

/**
 * AI analysis for receipts (OCR/Vision)
 */
export const analyzeReceiptImage = async (base64Data: string) => {
    if (!apiKey) return "Gastei 50 em Compras hoje"; // Fallback

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: "Analise este recibo/comprovante. Extraia o Valor Total e uma Descrição curta (estabelecimento ou item principal). Retorne um comando de texto simples no formato: 'Gastei [Valor] em [Descrição] hoje'." }
                ]
            }
        });
        return response.text?.trim() || "Gastei 0 em Desconhecido hoje";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "Gastei 0 em Erro ao ler recibo hoje";
    }
};

export const processUserCommand = async (inputText: string, imageBase64?: string) => {
    if (!apiKey) return mockFallbackProcessor(inputText);

    try {
        const parts: any[] = [{ text: inputText }];
        if (imageBase64) parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });

        const cardNames = store.creditCards.map(c => c.name).join(', ');
        
        // Contexto temporal exato Brasil/São Paulo (GMT-3)
        const now = new Date();
        const localTimeStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const isoLocalDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: {
                systemInstruction: `
                    You are Lyvo, a high-precision personal assistant. 
                    REFERENCE TIME (America/Sao_Paulo):
                    - Local Time: ${localTimeStr}
                    - Local Date: ${isoLocalDate}
                    - Timezone: GMT-3 (Brasília)

                    PRECISION RULES:
                    1. EVENT TITLE: Use the EXACT words the user provided. Do not summarize "Reunião de negócios importante" to "Reunião".
                    2. TIMEZONE FIX (GMT-3): If user says 14:00, the 'dateTime' hour part must be 14:00:00. Do not convert to UTC 0.
                    3. RELATIVE DATES: Interpret 'amanhã', 'hoje', 'próxima quarta' correctly using the reference date ${isoLocalDate}.
                    4. CONFIRMATION TEMPLATE: You MUST use the exact Portuguese message pattern:
                       "Interpretei: [Título/Descrição] para o dia [DD/MM/AAAA] às [HH:mm] (ou valor [R$]). Correto?"

                    Available Credit Cards: ${cardNames}.
                `,
                responseMimeType: "application/json",
                responseSchema: actionSchema
            }
        });

        const result = JSON.parse(response.text || "{}");
        return { success: true, data: result, message: result.responseMessage };
    } catch (error) {
        console.error("Gemini NLP Error:", error);
        return { success: false, message: "Houve um erro. Pode repetir?", data: null };
    }
};

export const executeAction = (data: any) => {
    let finalMessage = "Ação realizada com sucesso!";

    if (data.action === "ADD_TRANSACTION" && data.transactionDetails) {
        store.addTransaction({
            type: data.transactionDetails.type as any,
            value: data.transactionDetails.value,
            description: data.transactionDetails.description || 'Transação',
            category: data.transactionDetails.category || 'Outros',
            date: new Date().toISOString()
        });
        finalMessage = "✅ Transação registrada!";
    } else if (data.action === "ADD_CREDIT_TRANSACTION" && data.transactionDetails) {
        store.addCreditCardTransaction({
            cardName: data.transactionDetails.cardName || '',
            value: data.transactionDetails.value,
            description: data.transactionDetails.description || 'Compra Crédito',
            category: data.transactionDetails.category || 'Outros',
            installments: data.transactionDetails.installments || 1,
            purchaseDate: new Date()
        });
        finalMessage = "💳 Lançamento de cartão registrado!";
    } else if (data.action === "ADD_EVENT" && data.eventDetails) {
        store.addEvent({
            title: data.eventDetails.title || 'Novo Evento',
            dateTime: data.eventDetails.dateTime || new Date().toISOString(),
            description: data.eventDetails.description,
            category: data.eventDetails.category
        });
        finalMessage = "📅 Evento agendado com sucesso!";
    }
    return { success: true, message: finalMessage };
};

const mockFallbackProcessor = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("agenda") || lower.includes("reunião")) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return { 
            success: true, 
            data: {
                action: 'ADD_EVENT',
                eventDetails: { title: 'Reunião', dateTime: `${d.toISOString().split('T')[0]}T14:30:00`, description: text },
                responseMessage: `Interpretei: Reunião para o dia ${d.toLocaleDateString('pt-BR')} às 14:30. Correto?`
            },
            message: `Interpretei: Reunião para o dia ${d.toLocaleDateString('pt-BR')} às 14:30. Correto?`
        };
    }
    return { success: false, message: "Não entendi.", data: null };
};
