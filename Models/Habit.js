const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetDays: [String],  // Days in the week the habit should be completed (e.g., ['Monday', 'Wednesday'])
    startDate: { type: Date, required: true }, // The date from which the habit starts
    logs: [
      {
        date: { type: Date },
        status: { type: String, enum: ['completed', 'missed'] }
      }
    ],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompleted: { type: Date },
  },
  { timestamps: true } // Automatically create createdAt and updatedAt fields
);

module.exports = mongoose.model('Habit', HabitSchema);
