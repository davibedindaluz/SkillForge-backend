import mongoose, { Schema, Document, Types } from "mongoose";

interface IMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
}

export interface IChat extends Document {
	userId: Types.ObjectId;
	teacherId: Types.ObjectId;
	title: string;
	messages: IMessage[];
	createdAt: Date;
	updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
	{
		role: { type: String, enum: ["user", "assistant"], required: true },
		content: { type: String, required: true },
		timestamp: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const ChatSchema = new Schema<IChat>(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
		title: { type: String, default: "Nova conversa" }, // ADICIONAR
		messages: [MessageSchema],
	},
	{ timestamps: true }
);

ChatSchema.index({ userId: 1 });
ChatSchema.index({ teacherId: 1 });

export default mongoose.model<IChat>("Chat", ChatSchema);
