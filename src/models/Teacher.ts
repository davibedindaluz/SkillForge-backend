import mongoose, { Schema, Document } from "mongoose";

export interface ITeacher extends Document {
	name: string;
	subject: string;
	description: string;
	avatar?: string;
	systemPrompt: string;
	isActive: boolean;
	createdAt: Date;
}

const TeacherSchema = new Schema<ITeacher>({
	name: { type: String, required: true },
	subject: { type: String, required: true, unique: true },
	description: { type: String, required: true },
	avatar: String,
	systemPrompt: { type: String, required: true },
	isActive: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITeacher>("Teacher", TeacherSchema);
