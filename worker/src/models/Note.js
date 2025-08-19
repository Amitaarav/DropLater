import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  at: { type: Date, required: true },
  statusCode: { type: Number, required: true },
  ok: { type: Boolean, required: true },
  error: { type: String }
}, { _id: false });

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  body: {
    type: String,
    required: true,
    maxlength: 5000
  },
  releaseAt: {
    type: Date,
    required: true,
    index: true
  },
  webhookUrl: {
    type: String,
    required: true,
    match: /^https?:\/\/.+/
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'failed', 'dead'],
    default: 'pending',
    index: true
  },
  attempts: [attemptSchema],
  deliveredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Note = mongoose.model('Note', noteSchema);

export default Note;