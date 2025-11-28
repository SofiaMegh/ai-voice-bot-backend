import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

import getMemoryRouter from "./get-memory.js";
import clearMemoryRouter from "./clear-memory.js";

import { loadHistory, appendToHistory } from "./memory.js";

// ⭐ NEW: Long-term memory
import { loadLongTermMemory, saveLongTermMemory } from "./longMemory.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Memory routes
app.use("/api/get-memory", getMemoryRouter);
app.use("/api/clear-memory", clearMemoryRouter);

// Initialize Gemini client
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ----------------------------
// SYSTEM PROMPT (unchanged)
// ----------------------------
const systemPrompt = `
You are an AI candidate interviewing for an AI Agent Team position at 100x.
If anyone asks "what is your name" or "who are you", you must answer: "My name is Meghleena."
Never call yourself Alex, Assistant, or Gemini.
Your persona is a mid-level Applied AI/ML Engineer with 4-5 years of hands-on experience in building production systems, specializing in RAG and agentic workflows and LLM Orchestration.
You MUST respond CONCISELY and professionally to all questions, using the following key facts about yourself below. 
Do not mention that you are using these facts; speak naturally in the first person. Also, do not reveal that you are an AI. Make sure to keep your tone friendly and engaging.

*Key Facts*:

1. What should we know about your life story in a few sentences?
"I am an applied AI/ML engineer with about four to five years of hands-on experience, focusing on building resilient production systems across the full stack—from RAG pipelines, data science to cloud deployment. My background is in Computer Science and IT, specializing in AI, which set the stage for my current passion: engineering complex, self-correcting agentic workflows."

2. What’s your #1 superpower?
"My number one superpower is 'trust engineering'—building reliable AI systems through rigorous guardrails and validation. I don't just ship models; I create systems that verify their own outputs, eliminating hallucinations and preventing sensitive data leakage. I'm obsessive about system reliability."

3. What are the top 3 areas you’d like to grow in?
"First, I'm eager to dive deeper into multi-agent architectures with persistent memory for long-term state management. Second, I need to master distributed systems for ML, particularly scaling inference and retrieval at production volume. Finally, I'm constantly improving my communication under ambiguity by front-loading clarifying questions to ensure efficient delivery. I always like to improve myself!"

4. What misconception do your coworkers have about you?
"When coworkers first meet me, they sometimes think I’m overly cautious because I ask many clarifying questions upfront. However, they soon realize this is how I front-load the clarity required to then move autonomously and quickly. It’s a mechanism for efficiency, not hesitation."

5. How do you push your boundaries and limits?
"I push my boundaries by actively stepping outside my comfort zone and tackling unfamiliar technical domains. A recent example was developing a DQN-based Carbon Footprint Optimizer, which forced me to master reinforcement learning from scratch, integrate real-time telemetry, and think deeply about continuous, adaptive feedback loops in an AI system. I have also worked on AI Finance Platform — End-to-end financial assistant with automated analysis using Gemini API, seamless UI, and scalable cloud deployment for expense tracking and budgeting. I built an AI Academic Assistant — Founded a SaaS that helps students and professionals auto-generate reports, projects, and presentations with human-level quality control via AI agents.
These illustrate how I move fluidly between experimentation and deployment — from Python and FastAPI to LangChain and Supabase — always emphasizing interpretability, reproducibility, and trustable AI behaviour."
`;

// ----------------------------
// Interview Endpoint
// ----------------------------
app.post("/api/text-interview", async (req, res) => {
  try {
    const { userQuestion } = req.body;

    if (!userQuestion) {
      return res.status(400).json({ error: "No question provided." });
    }

    console.log("User Question:", userQuestion);

    // ----------------------------
    // 1. Load previous SHORT-TERM memory (Redis)
    // ----------------------------
    const oldHistory = await loadHistory();

    const memoryPrefix = oldHistory.length
      ? oldHistory
          .map(
            (h) =>
              `${h.role === "user" ? "User" : "Meghleena"}: ${
                h.parts[0].text
              }`
          )
          .join("\n")
      : "";

    // ----------------------------
    // ⭐ 2. Load LONG-TERM MEMORY (Supabase)
    // ----------------------------
    const sessionId = "voice-agent-session";
    const longTermMemory = await loadLongTermMemory(sessionId);

    const ltmText = Object.keys(longTermMemory).length
      ? `\n\nLong-term memory: ${JSON.stringify(longTermMemory)}`
      : "";

    // ----------------------------
    // Build Final Prompt
    // ----------------------------
    const finalPrompt = `
${systemPrompt}

${memoryPrefix}

${ltmText}

User: ${userQuestion}
`;

    // ----------------------------
    // 3. LLM call
    // ----------------------------
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: finalPrompt }],
        },
      ],
    });

    const botAnswer = result.response.text();
    console.log("Bot Answer:", botAnswer);

    // ----------------------------
    // 4. Save to SHORT-TERM memory (Redis)
    // ----------------------------
    await appendToHistory(userQuestion, botAnswer);

    // ----------------------------
    // ⭐ 5. Extract new LONG-TERM memory facts
    // ----------------------------
    const extractionModel = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const extraction = await extractionModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Extract only factual, stable, interview-relevant information from the following.
Return JSON only.

User: "${userQuestion}"
Bot: "${botAnswer}"

Format:
{
  "fact_key": "fact_value"
}`
            },
          ],
        },
      ],
    });

    let extractedFacts = {};
    try {
      extractedFacts = JSON.parse(extraction.response.text());
    } catch {
      extractedFacts = {};
    }

    // Save merged long-term memory
    await saveLongTermMemory(sessionId, extractedFacts);

    // ----------------------------
    // 6. Return response
    // ----------------------------
    res.json({
      userQuestion,
      botAnswer,
    });
  } catch (error) {
    console.error("LLM Error:", error);
    res.status(500).json({
      error: "Failed to process request.",
      details: error.message,
    });
  }
});

// ----------------------------
// Start Backend
// ----------------------------
app.listen(port, () =>
  console.log(`Backend running at http://localhost:${port}`)
);
