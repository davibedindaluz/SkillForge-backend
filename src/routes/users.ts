import { Router } from "express";
import User from "../models/User";
import Chat from "../models/TeachersChats";
import Quiz from "../models/Quiz";

console.log("✅ User routes loaded");

const router = Router();

router.get("/", async (req, res) => {
	try {
		const users = await User.find();
		res.json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

router.post("/", async (req, res) => {
	try {
		console.log("📥 Dados recebidos:", req.body);
		const user = await User.create(req.body);
		console.log("✅ User criado:", user);
		res.status(201).json(user);
	} catch (error) {
		console.error("Error creating user:", error);
		res.status(400).json({ error: "Failed to create user" });
	}
});

router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		await Chat.deleteMany({ userId: id });

		await Quiz.deleteMany({ userId: id });

		const deletedUser = await User.findByIdAndDelete(id);

		if (!deletedUser) {
			return res.status(404).json({ error: "User not found" });
		}

		console.log("❌ User e dados relacionados deletados", deletedUser);
		res.status(200).json(deletedUser);
	} catch (error) {
		console.error("Error deleting user:", error);
		res.status(500).json({ error: "Failed to delete user" });
	}
});

export default router;
