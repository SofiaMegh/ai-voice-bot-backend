import express from "express";
import { clearMemory } from "./memory.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await clearMemory();
    res.json({ success: true, message: "Memory cleared." });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear memory" });
  }
});

export default router;
