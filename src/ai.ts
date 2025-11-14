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

export { knowledge };
