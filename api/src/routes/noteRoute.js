import { Router } from "express";
import { createNote, listNotes, replayNote, healthCheck } from "../controllers/notesController";
import { authMiddleware } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/health", healthCheck);

router.use(authMiddleware, apiLimiter); 

router.post("/notes", createNote);
router.get("/notes", listNotes);
router.post("/notes/:id/replay", replayNote);

export default router;
