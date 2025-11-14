interface Message {
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface Session {
	id: string;
	messages: Message[];
	createdAt: number;
	lastActivity: number;
}

class SessionManager {
	private sessions: Map<string, Session> = new Map();
	private readonly maxMessages = 16;
	private readonly sessionTimeout = 3600000;

	getOrCreateSession(sessionId: string): Session {
		let session = this.sessions.get(sessionId);

		if (!session) {
			session = {
				id: sessionId,
				messages: [],
				createdAt: Date.now(),
				lastActivity: Date.now(),
			};
			this.sessions.set(sessionId, session);
		}

		return session;
	}

	addMessage(
		sessionId: string,
		role: "user" | "assistant",
		content: string
	): void {
		const session = this.getOrCreateSession(sessionId);

		session.messages.push({
			role,
			content,
			timestamp: Date.now(),
		});

		if (session.messages.length > this.maxMessages) {
			session.messages = session.messages.slice(-this.maxMessages);
		}

		session.lastActivity = Date.now();
	}

	getMessages(sessionId: string): Message[] {
		const session = this.sessions.get(sessionId);
		return session?.messages || [];
	}

	clearSession(sessionId: string): void {
		this.sessions.delete(sessionId);
	}

	cleanupInactiveSessions(): void {
		const now = Date.now();
		for (const [id, session] of this.sessions.entries()) {
			if (now - session.lastActivity > this.sessionTimeout) {
				this.sessions.delete(id);
			}
		}
	}
}

export const sessionManager = new SessionManager();

setInterval(() => {
	sessionManager.cleanupInactiveSessions();
}, 600000);
