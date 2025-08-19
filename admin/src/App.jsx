import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NoteForm from './components/NoteForm';
import NotesTable from './components/NoteTable';
import { createNote, fetchNotes, replayNote } from './api/notes';
import './App.css';
function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = { page };
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const data = await fetchNotes(params);
      setNotes(data.notes);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [filter, page]);

  const handleCreateNote = async (noteData) => {
    try {
      await createNote(noteData);
      await loadNotes(); 
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleReplayNote = async (noteId) => {
    try {
      await replayNote(noteId);
      await loadNotes();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold text-indigo-700 mb-2">
          Webhook Scheduler
        </h1>
        <p className="text-gray-600 text-lg">
          Create and manage scheduled webhook deliveries
        </p>
      </motion.header>

      {/* Note Form */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <NoteForm onSubmit={handleCreateNote} />
      </motion.div>

      {/* Notes Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white shadow-lg rounded-2xl p-6"
      >
        {/* Filter Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Notes</h2>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'delivered', 'failed', 'dead'].map(status => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === status
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center py-12"
            >
              <motion.div
                className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
                aria-label="Loading spinner"
              />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-red-600 font-medium"
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <NotesTable notes={notes} onReplay={handleReplayNote} />
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-500">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;
