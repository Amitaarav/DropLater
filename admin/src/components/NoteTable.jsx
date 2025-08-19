import React, { useState } from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

function NotesTable({ notes, onReplay }) {
  const [replayingNotes, setReplayingNotes] = useState(new Set());

  const handleReplay = async (noteId) => {
    setReplayingNotes(prev => new Set(prev).add(noteId));
    
    try {
      const result = await onReplay(noteId);
      if (!result.success) {
        alert(result.error || 'Failed to replay note');
      }
    } finally {
      setReplayingNotes(prev => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
    }
  };

  const getStatusBadge = (status) => (
    <span className={`status-badge status-${status}`}>
      {status}
    </span>
  );

  if (notes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <p style={{ fontSize: '1.125rem' }}>No notes found</p>
        <p>Create your first scheduled note above</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Release Time</th>
            <th>Delivered At</th>
            <th>Last Attempt</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note, index) => (
            <motion.tr
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                backgroundColor: note.status === 'delivered' && Date.now() - new Date(note.deliveredAt).getTime() < 3000 
                  ? '#ecfdf5' 
                  : 'transparent'
              }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.1,
                backgroundColor: { duration: 2 }
              }}
            >
              <td>
                <div style={{ maxWidth: '200px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                    {note.title}
                  </div>
                </div>
              </td>
              <td>{getStatusBadge(note.status)}</td>
              <td>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {dayjs(note.releaseAt).format('MMM D, YYYY HH:mm')}
                </div>
              </td>
              <td>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {note.deliveredAt ? dayjs(note.deliveredAt).format('MMM D, YYYY HH:mm') : '-'}
                </div>
              </td>
              <td>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {note.lastAttempt ? (
                    <span style={{ 
                      color: note.lastAttempt.ok ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {note.lastAttempt.statusCode}
                    </span>
                  ) : '-'}
                </div>
              </td>
              <td>
                {(note.status === 'failed' || note.status === 'dead') && (
                  <motion.button
                    onClick={() => handleReplay(note.id)}
                    disabled={replayingNotes.has(note.id)}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.375rem 0.75rem', 
                      fontSize: '0.75rem',
                      opacity: replayingNotes.has(note.id) ? 0.5 : 1
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {replayingNotes.has(note.id) ? 'Replaying...' : 'Replay'}
                  </motion.button>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NotesTable;