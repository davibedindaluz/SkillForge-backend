import mongoose, { Schema, Document } from "mongoose";

interface IQuestion {
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

export interface IQuiz extends Document {
	userId: string;
	subject: string;
	topic: string;
	difficulty: number;
	questions: IQuestion[];
	questionsCount: number;
	createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
	{
		question: { type: String, required: true },
		options: [{ type: String, required: true }],
		correctAnswer: { type: Number, required: true },
		explanation: String,
	},
	{ _id: false }
);

const QuizSchema = new Schema<IQuiz>({
	userId: { type: String, required: true },
	subject: { type: String, required: true },
	topic: { type: String, required: true },
	difficulty: { type: Number, required: true },
	questions: [QuestionSchema],
	questionsCount: { type: Number, required: true },
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IQuiz>("Quiz", QuizSchema);
