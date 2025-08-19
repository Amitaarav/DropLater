import express from 'express';
import { createNote, listNotes, replayNote, getNote } from '../controllers/notesController.js';

const router = express.Router();

router.post('/', createNote);
router.get('/', listNotes);
router.get('/:id', getNote);
router.post('/:id/replay', replayNote);

export default router;