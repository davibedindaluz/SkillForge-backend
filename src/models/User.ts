import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
	name: string;
	lastName: string;
	age: number;
	goal?: string;
	hoursPerDay?: number;
	deadline?: string;
	currentLevel?: string;
	learningStyle?: string;
	difficulties?: string[];
	createdAt: Date;
}

const UserSchema = new Schema<IUser>({
	name: { type: String, required: true },
	lastName: { type: String, required: true },
	age: { type: Number, required: true },
	goal: String,
	hoursPerDay: Number,
	deadline: String,
	currentLevel: String,
	learningStyle: String,
	difficulties: [String],
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
