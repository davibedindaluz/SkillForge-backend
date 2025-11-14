import { Router } from "express";
import Teacher from "../models/Teacher";

const router = Router();

router.get("/", async (req, res) => {
	try {
		const teachers = await Teacher.find({ isActive: true });
		res.json(teachers);
	} catch (error) {
		console.error("Error fetching teachers:", error);
		res.status(500).json({ error: "Failed to fetch teachers" });
	}
});

router.post("/", async (req, res) => {
	try {
		const teacher = await Teacher.create(req.body);
		console.log("✅ Teacher created:", teacher);
		res.status(201).json(teacher);
	} catch (error) {
		console.error("Error creating teacher:", error);
		res.status(400).json({ error: "Failed to create teacher" });
	}
});

router.get("/:id", async (req, res) => {
	try {
		const teacher = await Teacher.findById(req.params.id);
		if (!teacher) {
			return res.status(404).json({ error: "Teacher not found" });
		}
		res.json(teacher);
	} catch (error) {
		console.error("Error fetching teacher:", error);
		res.status(500).json({ error: "Failed to fetch teacher" });
	}
});

export default router;
