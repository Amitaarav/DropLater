import express from 'express';
const { createNote, listNotes, replayNote } = require('../controllers/notes_controller.js');
const { createNoteSchema } = require('../validators/noteSchema');

const router = express.Router();

// Validation middleware (pattern)
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.issues });
    }
    req.validated = result.data;
    next();
  };
}

router.post('/', validate(createNoteSchema), createNote);
router.get('/', listNotes);
router.post('/:id/replay', replayNote);

module.exports = router;
