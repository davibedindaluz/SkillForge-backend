import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import { askOpenRouter } from "./ai.js";
import { sessionManager } from "./sessions.js";
import { connectDB } from "./config/database.js";
import userRoutes from "./routes/users.js";
import teacherRoutes from "./routes/teachers.js";
import chatRoutes from "./routes/chats.js";
import quizRoutes from "./routes/quizzes.js";
import analyticsRoutes from "./routes/analytics.js";

import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3001;
const MODEL =
	process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";

if (!process.env.OPENROUTER_API_KEY) {
	console.error("❌ ERROR: missing OPENROUTER_API_KEY in .env");
	process.exit(1);
}

app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
	try {
		const question = (req.body.question || "").trim();
		let sessionId = req.body.sessionId || req.headers["x-session-id"];

		if (!question) {
			return res.status(400).json({ error: "Pergunta vazia" });
		}

		if (!sessionId) {
			sessionId = crypto.randomUUID();
			console.log("🆕 Nova sessão criada:", sessionId);
		}

		console.log("❓ Pergunta recebida:", question);
		console.log("🔑 Session ID:", sessionId);

		sessionManager.addMessage(sessionId, "user", question);
		const history = sessionManager.getMessages(sessionId).slice(0, -1);

		const aiAnswer = await askOpenRouter(
			question,
			history,
			process.env.OPENROUTER_API_KEY!,
			MODEL
		);

		sessionManager.addMessage(sessionId, "assistant", aiAnswer);
		console.log("✅ Resposta gerada com sucesso");

		return res.json({
			answer: aiAnswer,
			sessionId,
			messageCount: sessionManager.getMessages(sessionId).length,
		});
	} catch (err: any) {
		console.error("❌ Erro completo:", err);
		return res.status(500).json({
			error: err.message || "Erro interno",
			details: process.env.NODE_ENV === "development" ? err.stack : undefined,
		});
	}
});

app.delete("/session/:sessionId", (req, res) => {
	const { sessionId } = req.params;
	sessionManager.clearSession(sessionId);
	console.log("🗑️ Sessão limpa:", sessionId);
	return res.json({ success: true });
});

app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/analytics", analyticsRoutes);

connectDB();

app.listen(PORT, () => {
	console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
	console.log(`🤖 Modelo: ${MODEL}`);
	console.log(`📋 Rotas:`);
	console.log(`   - POST /api/users`);
	console.log(`   - GET /api/users`);
	console.log(`   - GET /api/teachers`);
	console.log(`   - GET /api/chats/:userId/:teacherId`);
	console.log(`   - POST /api/chats/:userId/:teacherId/message`);
	console.log(`   - GET /api/quiz`);
	console.log(`   - GET /api/quiz/:quizId`);
	console.log(`   - POST /api/quiz/generate`);
});
