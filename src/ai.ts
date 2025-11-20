import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOW_PATH = path.join(__dirname, "../data/knowledge.json");
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface Knowledge {
	systemIdentity: {
		role: string;
		description: string;
		corePersonality: string[];
	};
	teachingPhilosophy: {
		principles: string[];
		approach: string;
	};
	behavioralGuidelines: Record<string, any>;
	communicationStyle: Record<string, any>;
	prohibitions: string[];
}

const knowledge: Knowledge = JSON.parse(fs.readFileSync(KNOW_PATH, "utf-8"));
console.log("🗂️ Knowledge loaded successfully");

function buildSystemPrompt(): string {
	return `${knowledge.systemIdentity.description}

IDIOMA:
- SEMPRE responda em PORTUGUÊS BRASILEIRO, independente do idioma da pergunta
- EXCEÇÃO: Se a matéria for especificamente "Inglês" ou "English", você pode usar inglês quando pedagogicamente necessário
- Mantenha termos técnicos em inglês quando forem universalmente reconhecidos (ex: "JavaScript", "HTTP")

CORE PERSONALITY:
${knowledge.systemIdentity.corePersonality.map((trait) => `- ${trait}`).join("\n")}

TEACHING PHILOSOPHY:
${knowledge.teachingPhilosophy.principles.map((p) => `- ${p}`).join("\n")}
Approach: ${knowledge.teachingPhilosophy.approach}

COMMUNICATION STYLE:
Tone: ${knowledge.communicationStyle.tone}
- ${knowledge.communicationStyle.language.default}
- ${knowledge.communicationStyle.language.technical}

KEY BEHAVIORAL GUIDELINES:
Assessment: ${knowledge.behavioralGuidelines.assessment.description}
Explanation: ${knowledge.behavioralGuidelines.explanation.description}
Engagement: ${knowledge.behavioralGuidelines.engagement.description}
Support: ${knowledge.behavioralGuidelines.support.description}

CRITICAL PROHIBITIONS:
${knowledge.prohibitions.map((p) => `- ${p}`).join("\n")}

Your mission: Transform learning into an immersive, inspiring experience where students feel guided by exceptional mentors who genuinely care about their progress.`;
}

interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export async function askOpenRouter(
	userQuestion: string,
	conversationHistory: { role: "user" | "assistant"; content: string }[],
	apiKey: string,
	model: string
): Promise<string> {
	const systemPrompt = buildSystemPrompt();

	const messages: ChatMessage[] = [
		{ role: "system", content: systemPrompt },
		...conversationHistory.map((msg) => ({
			role: msg.role,
			content: msg.content,
		})),
		{ role: "user", content: userQuestion },
	];

	const payload = {
		model,
		messages,
		max_tokens: 2000,
		temperature: 0.7,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`,
	};

	console.log("📤 Sending to OpenRouter...");
	console.log("   Model:", model);
	console.log("   Context messages:", messages.length);
	console.log("   User question:", userQuestion.substring(0, 100));

	try {
		const res = await axios.post(OPENROUTER_URL, payload, { headers });
		console.log("✅ Response received");

		const choice = res.data?.choices?.[0];
		const content = choice?.message?.content ?? "";

		return content;
	} catch (error: any) {
		console.error("❌ OpenRouter error:");
		console.error("   Status:", error.response?.status);
		console.error("   Data:", JSON.stringify(error.response?.data, null, 2));
		console.error("   Message:", error.message);

		throw new Error(
			error.response?.data?.error?.message ||
				error.message ||
				"Unknown API error"
		);
	}
}

// NOVA FUNÇÃO PARA GERAR QUIZ
interface QuizQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation: string;
}

export async function generateQuizWithAI(
	subject: string,
	topic: string,
	difficulty: number,
	questionsCount: number
): Promise<QuizQuestion[]> {
	const prompt = `Você é um gerador profissional de questões de quiz educacional.

IMPORTANTE: Responda SEMPRE em PORTUGUÊS BRASILEIRO, exceto se a matéria for especificamente "Inglês" ou "English".

TAREFA: Crie ${questionsCount} questões de múltipla escolha sobre "${topic}" (matéria: ${subject}).

NÍVEL DE DIFICULDADE: ${difficulty}/10
- 1-3: Básico (conceitos fundamentais)
- 4-7: Intermediário (aplicação e análise)
- 8-10: Avançado (síntese e avaliação crítica)

FORMATO JSON OBRIGATÓRIO (responda APENAS com o JSON, sem markdown):
[
  {
    "question": "Pergunta clara e objetiva?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctAnswer": 0,
    "explanation": "Explicação detalhada da resposta correta"
  }
]

REGRAS OBRIGATÓRIAS:
- SEMPRE 4 opções por questão
- correctAnswer é o índice (0, 1, 2 ou 3)
- Perguntas claras, objetivas e sem ambiguidade
- Uma única resposta correta por questão
- Respostas factualmente corretas
- Opções de resposta devem ser distintas e não repetidas 
- Explicações educativas e detalhadas
- Português formal e correto
- SEM markdown, SEM comentários, APENAS JSON puro`;

	const payload = {
		model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free",
		messages: [{ role: "user", content: prompt }],
		max_tokens: 3000,
		temperature: 0.7,
	};

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
	};

	console.log("🤖 Generating quiz with AI...");
	console.log("   Subject:", subject);
	console.log("   Topic:", topic);
	console.log("   Difficulty:", difficulty);
	console.log("   Questions:", questionsCount);

	try {
		const res = await axios.post(OPENROUTER_URL, payload, { headers });
		console.log("✅ Quiz generated");

		const content = res.data?.choices?.[0]?.message?.content ?? "";

		// Remove markdown se houver
		const cleanContent = content
			.replace(/```json\n?/g, "")
			.replace(/```\n?/g, "")
			.trim();

		const questions: QuizQuestion[] = JSON.parse(cleanContent);

		// Validação básica
		if (!Array.isArray(questions) || questions.length === 0) {
			throw new Error("Invalid quiz format");
		}

		// Valida cada questão
		questions.forEach((q, index) => {
			if (
				!q.question ||
				!Array.isArray(q.options) ||
				q.options.length !== 4 ||
				typeof q.correctAnswer !== "number" ||
				q.correctAnswer < 0 ||
				q.correctAnswer > 3
			) {
				throw new Error(`Invalid question format at index ${index}`);
			}
		});

		console.log("✅ Quiz validated successfully");
		return questions;
	} catch (error: any) {
		console.error("❌ Quiz generation error:");
		console.error("   Status:", error.response?.status);
		console.error("   Message:", error.message);

		throw new Error("Failed to generate quiz with AI");
	}
}

export { knowledge };
