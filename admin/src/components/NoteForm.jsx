import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

function NoteForm({ onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      releaseAt: dayjs().add(5, 'minute').format('YYYY-MM-DDTHH:mm'),
      webhookUrl: 'http://localhost:4000/sink'
    }
  });

  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const result = await onSubmit({
        ...data,
        releaseAt: dayjs(data.releaseAt).toISOString()
      });

      if (result.success) {
        setSubmitMessage(' Note created successfully!');
        reset();
      } else {
        setSubmitMessage(result.error || ' Failed to create note');
      }
    } catch (err) {
      setSubmitMessage(err.message || ' Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="max-w-lg mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Create New Note
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
            Title
          </label>
          <input
            {...register('title', { required: 'Title is required', maxLength: { value: 200, message: 'Title too long' } })}
            type="text"
            id="title"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="Enter note title"
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="body">
            Body
          </label>
          <textarea
            {...register('body', { required: 'Body is required', maxLength: { value: 5000, message: 'Body too long' } })}
            id="body"
            rows="4"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
            placeholder="Enter note content"
          />
          {errors.body && <p className="text-sm text-red-500 mt-1">{errors.body.message}</p>}
        </div>

        {/* Release At */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="releaseAt">
            Release Time
          </label>
          <input
            {...register('releaseAt', { required: 'Release time is required' })}
            type="datetime-local"
            id="releaseAt"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
          {errors.releaseAt && <p className="text-sm text-red-500 mt-1">{errors.releaseAt.message}</p>}
        </div>

        {/* Webhook URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="webhookUrl">
            Webhook URL
          </label>
          <input
            {...register('webhookUrl', { 
              required: 'Webhook URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be a valid HTTP/HTTPS URL'
              }
            })}
            type="url"
            id="webhookUrl"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="http://localhost:4000/sink"
          />
          {errors.webhookUrl && <p className="text-sm text-red-500 mt-1">{errors.webhookUrl.message}</p>}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? 'Creating...' : 'Create Note'}
        </motion.button>

        {/* Submit Message */}
        {submitMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`text-center font-medium mt-3 ${
              submitMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {submitMessage}
          </motion.div>
        )}
      </form>
    </motion.div>
  );
}

export default NoteForm;
