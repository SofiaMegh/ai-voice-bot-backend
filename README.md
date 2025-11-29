### 🎙️ 100x AI Agent – Voice Interview Backend

**Node.js + Express + Redis (Short-Term Memory) + Supabase (Long-Term Memory) + Gemini LLM**

This backend powers the Voice Interview AI Agent, handling:
- Short-term conversational memory (Redis)
- Long-term reasoning memory (Supabase)
- LLM querying (Gemini 2.5 Flash)
- Voice-session logic
- Clean separation of API routes
- Persistent AI interview persona

-----
### NOTE:
**I deployed the backend on Render instead of Vercel’s serverless environment because this project requires a persistent Node.js runtime, which Vercel functions cannot provide. 
The backend handles Redis-based short-term memory, Supabase long-term memory, Gemini model calls, and a continuous voice-interview loop—all of which depend on stable state, uninterrupted execution, and libraries that Vercel serverless does not fully support (including @google/generative-ai, @supabase/supabase-js, and certain Redis operations). 
Vercel’s serverless model is stateless, short-lived, and prone to cold starts, which disrupts the conversation flow and breaks memory persistence. 
Render offers an always-on server with full Node compatibility, ensuring predictable performance, stable memory, and smooth interaction across the entire voice-driven interview pipeline.**

-----
### Challenges:

One of the first hurdles I ran into was Whisper. I originally wanted to use it for real-time transcription because of its accuracy, but Whisper immediately hit me with paywalls — it isn’t available on the free tier, requires billing just to test properly, and would’ve made continuous voice loops ridiculously expensive. To keep the project lean and deployable on Netlify, I switched to the browser’s native SpeechRecognition. It gave me real-time speech capture, zero cost, no rate limits, and fast detection right inside the browser — perfect for a frontend-driven voice interface.

The next battle was the OpenAI Realtime API. On paper it sounded perfect, but in practice it was pure WebRTC chaos — constant socket management, bidirectional streams, event syncing, NAT headaches, and random breakages. WebRTC fought with everything I needed: quick restarts, lightweight deployment, and interruptibility. Instead of wrestling WebRTC forever, I dropped it and built a browser-first flow: one recognizer for questions, one recognizer just for interrupt commands, and a clean speech → LLM → speech loop powered by my Render backend and served through Netlify. It was simpler, sturdier, and far more predictable.

Then came the hardest challenge of all: voice interruption. When the bot speaks through speechSynthesis, the browser blocks SpeechRecognition completely — meaning you can’t talk over the bot, can’t interrupt, can’t stop it mid-sentence. This is a browser limitation, not an error. To fix it, I engineered my own override system: during TTS playback, I launch a second recognizer that listens *only* for commands like “stop” or “clear.” If it hears one, it instantly cancels TTS, shuts down both recognizers, resets state, and starts listening again. It feels exactly like interrupting Alexa or Google Assistant — smooth, natural, and instant.

Another challenge was building a reliable memory system using Redis and Supabase while keeping everything compatible with my Render backend. Redis gives the bot short-term memory across turns, and Supabase stores long-term traits, but syncing both in a voice loop required careful planning: connection handling, cold-start behavior, and ensuring the memory stays consistent across requests. With the right structure, both layers now work in harmony.

Finally, I had to fight browser conflicts. Browsers absolutely hate running SpeechRecognition and speechSynthesis at the same time. They stop each other, cancel events, freeze, or restart unpredictably — especially on Chrome. To stabilize everything, I built a coordination layer that manages who’s allowed to speak or listen at any given moment. A unified `stopAllOperations()` kills all active tasks instantly, recognizers are cleaned up after every cycle, and the loop restarts intelligently after each event. This stopped all random glitches and made the system feel buttery-smooth.

---

