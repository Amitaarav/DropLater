import { Note } from '../models/notes_model';
import { createQueue } from "."

const queue = createQueue();

// POST /api/notes
export async function createNote(req, res, next) {
  try {
    const { title, body, releaseAt, webhookUrl } = req.validated; // set by validation middleware
    const note = await Note.create({ title, body, releaseAt, webhookUrl });
    
    // enqueue job with delay
    const delay = Math.max(0, new Date(releaseAt).getTime() - Date.now());
    await queue.add('deliver', { id: note._id.toString() }, { delay });

    return res.status(201).json({ id: note._id });
  } catch (err) {
    next(err);
  }
}

// GET /api/notes?status=&page=
export async function listNotes(req, res, next) {
  try {
    const { status, page = 1 } = req.query;
    const filter = status ? { status } : {};
    const limit = 20;
    const skip = (page - 1) * limit;

    const notes = await Note.find(filter).sort({ releaseAt: 1 }).skip(skip).limit(limit);
    return res.json({ notes });
  } catch (err) {
    next(err);
  }
}

// POST /api/notes/:id/replay
export async function replayNote(req, res, next) {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!['failed', 'dead'].includes(note.status)) {
      return res.status(400).json({ error: 'Note is not failed/dead, cannot replay' });
    }

    // reset status + requeue
    note.status = 'pending';
    await note.save();

    await queue.add('deliver', { id: note._id.toString() }, { delay: 0 });
    return res.json({ ok: true, id: note._id });
  } catch (err) {
    next(err);
  }
}

