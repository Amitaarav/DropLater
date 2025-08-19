import { z } from 'zod';
import dayjs from 'dayjs';
import Note from '../models/Note.js';
import logger from '../utils/logger.js';
import { enqueueNote } from '../services/queueService.js';

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  releaseAt: z.string().datetime(),
  webhookUrl: z.string().url().regex(/^https?:\/\/.+/)
});

const listNotesSchema = z.object({
  status: z.enum(['pending', 'delivered', 'failed', 'dead']).optional(),
  page: z.coerce.number().min(1).default(1)
});

export const createNote = async (req, res, next) => {
  try {
    const validatedData = createNoteSchema.parse(req.body);
    
    const note = new Note({
      ...validatedData,
      releaseAt: dayjs(validatedData.releaseAt).toDate()
    });

    await note.save();
    
    // Enqueue the note for processing
    await enqueueNote(note);
    
    logger.info('Note created', { noteId: note._id, releaseAt: note.releaseAt });
    
    res.status(201).json({
      id: note._id,
      message: 'Note created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const listNotes = async (req, res, next) => {
  try {
    const { status, page } = listNotesSchema.parse(req.query);
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const filter = status ? { status } : {};
    
    const [notes, total] = await Promise.all([
      Note.find(filter)
        .select('title status releaseAt deliveredAt attempts')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Note.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      notes: notes.map(note => ({
        id: note._id,
        title: note.title,
        status: note.status,
        releaseAt: note.releaseAt,
        deliveredAt: note.deliveredAt,
        lastAttempt: note.attempts.length > 0 
          ? note.attempts[note.attempts.length - 1]
          : null
      })),
      pagination: {
        page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const replayNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (note.status === 'delivered') {
      return res.status(400).json({ 
        error: 'Cannot replay delivered note',
        details: ['Note has already been successfully delivered']
      });
    }
    
    // Reset note status and re-enqueue
    note.status = 'pending';
    await note.save();
    
    await enqueueNote(note);
    
    logger.info('Note replayed', { noteId: note._id });
    
    res.json({
      message: 'Note queued for replay',
      id: note._id,
      status: note.status
    });
  } catch (error) {
    next(error);
  }
};

export const getNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const note = await Note.findById(id).lean();
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({
      id: note._id,
      title: note.title,
      body: note.body,
      status: note.status,
      releaseAt: note.releaseAt,
      webhookUrl: note.webhookUrl,
      deliveredAt: note.deliveredAt,
      attempts: note.attempts,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });
  } catch (error) {
    next(error);
  }
};