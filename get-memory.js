import express from "express";
import { loadHistory } from "./memory.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const history = await loadHistory();
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: "Failed to load memory" });
  }
});

export default router;
