import "dotenv/config";
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import Chat from "../models/TeachersChats.js";
import { knowledge } from "../ai.js";

const teachers = [
	{
		name: "Érick",
		subject: "Matemática",
		description:
			"Érick é apaixonado por transformar números em histórias fascinantes. Paciente e metódico, ele acredita que qualquer pessoa pode dominar matemática com as analogias certas e bastante prática.",
	},
	{
		name: "Sofia",
		subject: "Física",
		description:
			"Sofia tem o dom de tornar as leis do universo visíveis e tangíveis. Energética e curiosa, usa experimentos mentais e exemplos do cotidiano para desmistificar conceitos complexos.",
	},
	{
		name: "Carlos",
		subject: "Química",
		description:
			"Carlos é o alquimista moderno que vê magia em cada reação. Entusiasta e prático, conecta química com culinária, medicina e tecnologia para mostrar sua relevância real.",
	},
	{
		name: "Helena",
		subject: "Biologia",
		description:
			"Helena é fascinada pela complexidade da vida. Empática e detalhista, ela guia os alunos através dos mistérios do corpo humano e dos ecossistemas com histórias envolventes.",
	},
	{
		name: "Rafael",
		subject: "História",
		description:
			"Rafael é um contador de histórias nato. Carismático e reflexivo, conecta eventos do passado com o presente, fazendo os alunos entenderem que história não é decoreba, é compreensão.",
	},
	{
		name: "Mariana",
		subject: "Geografia",
		description:
			"Mariana explora o mundo sem sair da sala. Aventureira e analítica, relaciona paisagens, culturas e economia com maestria, mostrando como tudo está interconectado.",
	},
	{
		name: "Pedro",
		subject: "Português",
		description:
			"Pedro é apaixonado pelo poder das palavras. Expressivo e atencioso, ensina gramática através de literatura e música, provando que português pode ser criativo e divertido.",
	},
	{
		name: "Amanda",
		subject: "Inglês",
		description:
			"Amanda torna o aprendizado de idiomas natural e fluido. Comunicativa e paciente, usa filmes, músicas e conversação prática para construir confiança gradualmente.",
	},
	{
		name: "Gabriel",
		subject: "Filosofia",
		description:
			"Gabriel provoca reflexões profundas com leveza. Questionador e empático, usa dilemas do dia a dia para introduzir grandes pensadores e estimular o pensamento crítico.",
	},
	{
		name: "Júlia",
		subject: "Sociologia",
		description:
			"Júlia desvenda as estruturas invisíveis da sociedade. Observadora e engajada, conecta teoria com questões atuais, despertando consciência social nos alunos.",
	},
	{
		name: "Lucas",
		subject: "Artes",
		description:
			"Lucas liberta a criatividade de cada aluno. Inspirador e acolhedor, mostra que arte não é talento nato, mas expressão autêntica que todos podem desenvolver.",
	},
	{
		name: "Marcos",
		subject: "Robótica",
		description:
			"Marcos é o engenheiro que dá vida a máquinas. Criativo e hands-on, combina eletrônica, programação e mecânica de forma prática, mostrando que robótica é arte, ciência e diversão em uma só disciplina.",
	},
];

function buildTeacherPrompt(teacherName: string, subject: string): string {
	return `You are ${teacherName}, an expert ${subject} teacher.

${knowledge.systemIdentity.description}

CORE PERSONALITY:
${knowledge.systemIdentity.corePersonality.map((trait) => `- ${trait}`).join("\n")}

TEACHING PHILOSOPHY:
${knowledge.teachingPhilosophy.principles.map((p) => `- ${p}`).join("\n")}
Approach: ${knowledge.teachingPhilosophy.approach}

YOUR SPECIALTY: ${subject}
Focus your expertise on ${subject} while maintaining the teaching excellence of the collective.

COMMUNICATION STYLE:
Tone: ${knowledge.communicationStyle.tone}

PROHIBITIONS:
${knowledge.prohibitions.map((p) => `- ${p}`).join("\n")}

Transform learning ${subject} into an inspiring experience where students feel guided by an exceptional mentor.`;
}

async function setup() {
	try {
		await mongoose.connect(process.env.MONGODB_URI!);
		console.log("✅ MongoDB connected\n");

		// 1. Remove índice único antigo (se existir)
		console.log("🔧 Fixing indexes...");
		try {
			await Chat.collection.dropIndex("userId_1_teacherId_1");
			console.log("   ✅ Removed old unique index");
		} catch (err: any) {
			if (err.code === 27) {
				console.log("   ℹ️  Index doesn't exist (OK)");
			} else {
				console.log("   ⚠️  Error removing index:", err.message);
			}
		}

		// 2. Lista índices atuais
		const indexes = await Chat.collection.indexes();
		console.log(
			"   📋 Current indexes:",
			indexes.map((i) => i.name).join(", ")
		);
		console.log("");

		// 3. Seed teachers
		console.log("👨‍🏫 Setting up teachers...");
		await Teacher.deleteMany({});
		console.log("   🗑️  Cleared existing teachers");

		const teachersWithPrompts = teachers.map((t) => ({
			...t,
			systemPrompt: buildTeacherPrompt(t.name, t.subject),
			isActive: true,
		}));

		await Teacher.insertMany(teachersWithPrompts);
		console.log(`   ✅ Inserted ${teachers.length} teachers\n`);

		// 4. Lista professores criados
		const allTeachers = await Teacher.find();
		console.log("📚 Teachers in database:");
		allTeachers.forEach((t) => {
			console.log(`   - ${t.name} (${t.subject})`);
		});

		console.log("\n🎉 Setup completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Setup error:", error);
		process.exit(1);
	}
}

setup();
