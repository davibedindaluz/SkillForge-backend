import { Router } from "express";
import Quiz from "../models/Quiz.js";
import { generateQuizWithAI } from "../ai.js";

const router = Router();

router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const quizzes = await Quiz.find({ userId }).sort({ createdAt: -1 });
		res.json(quizzes);
	} catch (error) {
		console.error("Error fetching user quizzes:", error);
		res.status(500).json({ error: "Failed to fetch quizzes" });
	}
});

router.get("/", async (req, res) => {
	try {
		const quizzes = await Quiz.find();
		res.json(quizzes);
	} catch (error) {
		console.error("Error fetching quizzes:", error);
		res.status(500).json({ error: "Failed to fetch quizzes" });
	}
});

router.get("/:quizId", async (req, res) => {
	try {
		const quiz = await Quiz.findById(req.params.quizId);
		if (!quiz) {
			return res.status(404).json({ error: "Quiz not found" });
		}
		res.json(quiz);
	} catch (error) {
		console.error("Error fetching quiz:", error);
		res.status(500).json({ error: "Failed to fetch quiz" });
	}
});

router.post("/generate", async (req, res) => {
	try {
		const { subject, topic, difficulty, questionsCount, userId } = req.body;

		console.log("📥 Request body:", req.body);

		if (!subject || !topic || !difficulty || !questionsCount || !userId) {
			return res.status(400).json({
				error: "Missing required fields",
				received: { subject, topic, difficulty, questionsCount, userId },
			});
		}

		console.log("🤖 Generating quiz with AI...", {
			subject,
			topic,
			difficulty,
			questionsCount,
		});

		const questions = await generateQuizWithAI(
			subject,
			topic,
			difficulty,
			questionsCount
		);

		const quiz = await Quiz.create({
			userId,
			subject,
			topic,
			difficulty,
			questions,
			questionsCount,
		});

		console.log("✅ Quiz created:", quiz._id);
		res.status(201).json(quiz);
	} catch (error: any) {
		console.error("❌ Error creating quiz:", error);
		res.status(500).json({
			error: "Failed to create quiz",
			details: error.message,
		});
	}
});

export default router;
