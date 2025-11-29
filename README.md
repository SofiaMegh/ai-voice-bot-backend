### 🎙️ 100x AI Agent – Voice Interview Backend

**Node.js + Express + Redis (Short-Term Memory) + Supabase (Long-Term Memory) + Gemini LLM**

This backend powers the Voice Interview AI Agent, handling:
- Short-term conversational memory (Redis)
- Long-term reasoning memory (Supabase)
- LLM querying (Gemini 2.5 Flash)
- Voice-session logic
- Clean separation of API routes
- Persistent AI interview persona

### 🚀 Features
### ✔️ Human-like Interview Loop

The bot listens → thinks → speaks → listens again automatically.

### ✔️ Short-Term Memory (STM)

Stored in Upstash Redis, resets after 1 hour.
Maintains conversational flow like a real interview.

### ✔️ Long-Term Memory (LTM)

Stored in Supabase, one row per session ID.
The model extracts stable facts from each exchange.

### ✔️ Gemini-based LLM Engine

Uses gemini-2.5-flash for both:
- full response generation
- long-term memory extraction

### ✔️ Modular Express API
- Deployed using Render

-----
### NOTE:
**I deployed the backend on Render instead of Vercel’s serverless environment because this project requires a persistent Node.js runtime, which Vercel functions cannot provide. 
The backend handles Redis-based short-term memory, Supabase long-term memory, Gemini model calls, and a continuous voice-interview loop—all of which depend on stable state, uninterrupted execution, and libraries that Vercel serverless does not fully support (including @google/generative-ai, @supabase/supabase-js, and certain Redis operations). 
Vercel’s serverless model is stateless, short-lived, and prone to cold starts, which disrupts the conversation flow and breaks memory persistence. 
Render offers an always-on server with full Node compatibility, ensuring predictable performance, stable memory, and smooth interaction across the entire voice-driven interview pipeline.**
