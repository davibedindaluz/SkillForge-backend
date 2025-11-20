import { Router } from "express";
import Chat from "../models/TeachersChats.js";
import Quiz from "../models/Quiz.js";

const router = Router();

router.get("/user/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const now = new Date();
		const lastMonth = new Date(
			now.getFullYear(),
			now.getMonth() - 1,
			now.getDate()
		);

		// Chats do último mês agrupados por dia
		const chats = await Chat.find({
			userId,
			createdAt: { $gte: lastMonth },
		});

		const chatsByDay: Record<string, number> = {};
		chats.forEach((chat) => {
			const day = chat.createdAt.toISOString().split("T")[0];
			chatsByDay[day] = (chatsByDay[day] || 0) + 1;
		});

		const chatsLastMonth = Object.entries(chatsByDay)
			.map(([date, count]) => ({ date, count }))
			.sort((a, b) => a.date.localeCompare(b.date));

		// Matérias mais interagidas (via quizzes)
		const quizzes = await Quiz.find({ userId });
		const subjectCounts: Record<string, number> = {};

		quizzes.forEach((quiz) => {
			subjectCounts[quiz.subject] = (subjectCounts[quiz.subject] || 0) + 1;
		});

		const subjectInteractions = Object.entries(subjectCounts)
			.map(([subject, count]) => ({ subject, count }))
			.sort((a, b) => b.count - a.count);

		// Quizzes por dificuldade
		const difficultyCounts: Record<string, number> = {};

		quizzes.forEach((quiz) => {
			difficultyCounts[quiz.difficulty] =
				(difficultyCounts[quiz.difficulty] || 0) + 1;
		});

		const quizzesByDifficulty = Object.entries(difficultyCounts).map(
			([difficulty, count]) => ({ difficulty, count })
		);

		res.json({
			chatsLastMonth,
			subjectInteractions,
			quizzesByDifficulty,
		});
	} catch (error) {
		console.error("Error fetching analytics:", error);
		res.status(500).json({ error: "Failed to fetch analytics" });
	}
});

export default router;
