import { Router } from "express";
import Chat from "../models/TeachersChats.js";
import Teacher from "../models/Teacher.js";
import { askOpenRouter } from "../ai.js";

const router = Router();

// Lista todos os chats do usuário
router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const chats = await Chat.find({ userId })
			.populate("teacherId")
			.sort({ updatedAt: -1 });
		res.json(chats);
	} catch (error) {
		console.error("Error fetching user chats:", error);
		res.status(500).json({ error: "Failed to fetch chats" });
	}
});

// Lista todos os chats do usuário com um professor específico
router.get("/user/:userId/teacher/:teacherId", async (req, res) => {
	try {
		const { userId, teacherId } = req.params;
		const chats = await Chat.find({ userId, teacherId })
			.populate("teacherId")
			.sort({ updatedAt: -1 });
		res.json(chats);
	} catch (error) {
		console.error("Error fetching chats:", error);
		res.status(500).json({ error: "Failed to fetch chats" });
	}
});

// Busca um chat específico por ID
router.get("/:chatId", async (req, res) => {
	try {
		const { chatId } = req.params;
		const chat = await Chat.findById(chatId).populate("teacherId");

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		res.json(chat);
	} catch (error) {
		console.error("Error fetching chat:", error);
		res.status(500).json({ error: "Failed to fetch chat" });
	}
});

// Cria novo chat
router.post("/", async (req, res) => {
	try {
		const { userId, teacherId, title } = req.body;

		if (!userId || !teacherId) {
			return res.status(400).json({ error: "userId and teacherId required" });
		}

		const chat = await Chat.create({
			userId,
			teacherId,
			title: title || "Nova conversa",
			messages: [],
		});

		await chat.populate("teacherId");
		res.status(201).json(chat);
	} catch (error) {
		console.error("Error creating chat:", error);
		res.status(500).json({ error: "Failed to create chat" });
	}
});

// Envia mensagem em um chat específico
router.post("/:chatId/message", async (req, res) => {
	try {
		const { chatId } = req.params;
		const { content } = req.body;

		if (!content?.trim()) {
			return res.status(400).json({ error: "Message content required" });
		}

		let chat = await Chat.findById(chatId).populate("teacherId");

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		chat.messages.push({
			role: "user",
			content: content.trim(),
			timestamp: new Date(),
		});
		await chat.save();

		const teacher = await Teacher.findById(chat.teacherId);
		if (!teacher) {
			return res.status(404).json({ error: "Teacher not found" });
		}

		const conversationHistory = chat.messages
			.slice(-10)
			.map((msg) => ({ role: msg.role, content: msg.content }));

		const aiAnswer = await askOpenRouter(
			content.trim(),
			conversationHistory.slice(0, -1),
			process.env.OPENROUTER_API_KEY!,
			process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free"
		);

		chat.messages.push({
			role: "assistant",
			content: aiAnswer,
			timestamp: new Date(),
		});
		await chat.save();

		res.json(chat);
	} catch (error) {
		console.error("Error sending message:", error);
		res.status(500).json({ error: "Failed to send message" });
	}
});

// Atualiza título do chat
router.patch("/:chatId/title", async (req, res) => {
	try {
		const { chatId } = req.params;
		const { title } = req.body;

		if (!title?.trim()) {
			return res.status(400).json({ error: "Title required" });
		}

		const chat = await Chat.findByIdAndUpdate(
			chatId,
			{ title: title.trim() },
			{ new: true }
		).populate("teacherId");

		if (!chat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		res.json(chat);
	} catch (error) {
		console.error("Error updating chat title:", error);
		res.status(500).json({ error: "Failed to update chat title" });
	}
});

// Deleta chat
router.delete("/:chatId", async (req, res) => {
	try {
		const { chatId } = req.params;
		const deletedChat = await Chat.findByIdAndDelete(chatId);

		if (!deletedChat) {
			return res.status(404).json({ error: "Chat not found" });
		}

		res.json({ success: true });
	} catch (error) {
		console.error("Error deleting chat:", error);
		res.status(500).json({ error: "Failed to delete chat" });
	}
});

export default router;
