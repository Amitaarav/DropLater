import  { Schema, model } from 'mongoose'

const EventSchema = new Schema(
  {
    type: { type: String, required: true },
    payload: { type: Object, required: true }
  },
  { timestamps: true }
);

module.exports = model('Event', EventSchema);
