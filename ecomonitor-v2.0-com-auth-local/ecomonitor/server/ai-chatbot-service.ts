import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  metadata?: Record<string, any>;
  tokenCount?: number;
}

export interface SuggestedAction {
  type: "navigate" | "create_occurrence" | "run_simulator" | "view_map";
  label: string;
  data?: Record<string, any>;
}

const SYSTEM_PROMPTS = {
  general: `Você é o EcoBot, assistente do EcoMonitor. Seja conciso, educativo e em português.`,
  identify_occurrence: `Você é especialista em identificação de ocorrências ambientais.`,
  fire_help: `Você é especialista em incêndios. Cite prevenção e 193 em emergências.`,
  physics_education: `Você é professor de física ambiental. Explique com exemplos.`,
  simulator_help: `Você é tutor dos simuladores do EcoMonitor.`,
  report_guidance: `Você é guia de reportes. Ensine checklist e boas práticas.`,
  water_help: `Você é especialista em qualidade da água.`,
  air_help: `Você é especialista em qualidade do ar.`,
};

export class EcoBotService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENAI_API_KEY;
    if (!this.apiKey) {
      console.warn("[EcoBot] OpenAI API key não configurada.");
    }
  }

  async chat(
    messages: ChatMessage[],
    context: keyof typeof SYSTEM_PROMPTS = "general"
  ): Promise<ChatResponse> {
    try {
      if (!this.apiKey) {
        return this.getMockResponse(messages[messages.length - 1]?.content || "", context);
      }

      const systemPrompt = SYSTEM_PROMPTS[context];
      const fullMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: MODEL,
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const assistantMessage = response.data.choices?.[0]?.message?.content || "";
      const tokenCount = response.data.usage?.total_tokens || 0;

      return {
        message: assistantMessage,
        tokenCount,
        metadata: { model: MODEL, context },
      };
    } catch (error) {
      return this.getMockResponse(messages[messages.length - 1]?.content || "", context);
    }
  }

  generateConversationTitle(firstMessage: string): string {
    return "Conversa Geral";
  }

  private getMockResponse(userMessage: string, context: string): ChatResponse {
    return { message: "Olá! Sou o EcoBot. Como posso ajudar?" };
  }
}

let ecoBotInstance: EcoBotService | null = null;
export function getEcoBotService(): EcoBotService {
  if (!ecoBotInstance) ecoBotInstance = new EcoBotService();
  return ecoBotInstance;
}
