// routes/habitRoutes.js
const express = require('express');
const Habit = require('../Models/Habit');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Create Habit
router.post('/', authMiddleware, async (req, res) => {
  const { name, targetDays, startDate } = req.body;
  try {
    const newHabit = new Habit({
      userId: req.user.id, // Reference user ID
      name,
      targetDays,
      startDate,
      logs: []
    });
    await newHabit.save();
    res.json(newHabit);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Get all Habits for User
// Get all Habits for User
router.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });

    const today = new Date();
    today.setHours(0,0,0,0); // normalize today

    const updatedHabits = habits.map(habit => {
      const todayLog = habit.logs.find(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0,0,0,0);
        return logDate.getTime() === today.getTime();
      });

      return {
        ...habit.toObject(),
        todayStatus: todayLog ? todayLog.status : null, // attach today's status dynamically
      };
    });

    res.json(updatedHabits);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// UPDATE a Habit
router.put('/:habitId', authMiddleware, async (req, res) => {
  const { name, targetDays, startDate } = req.body;

  try {
    const habit = await Habit.findById(req.params.habitId);

    if (!habit || habit.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    if (name) habit.name = name;
    if (targetDays) habit.targetDays = targetDays;
    if (startDate) habit.startDate = startDate;

    await habit.save();
    res.json({ message: 'Habit updated successfully', habit });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Update Daily Status
router.post('/:habitId/log', authMiddleware, async (req, res) => {
  const { status } = req.body; // 'completed' or 'missed'
  try {
    const habit = await Habit.findById(req.params.habitId);
    if (!habit || habit.userId.toString() !== req.user.id) { // Corrected userId check
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    const today = new Date();
    today.setHours(0,0,0,0); // Remove time part
    const alreadyLogged = habit.logs.find(log => new Date(log.date).getTime() === today.getTime());

    if (alreadyLogged) {
      alreadyLogged.status = status;
    } else {
      habit.logs.push({ date: today, status });
    }

    if (status === 'completed') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (habit.lastCompleted && new Date(habit.lastCompleted).getTime() === yesterday.getTime()) {
        habit.currentStreak += 1;
      } else {
        habit.currentStreak = 1;
      }
      habit.lastCompleted = today;
      if (habit.currentStreak > habit.longestStreak) {
        habit.longestStreak = habit.currentStreak;
      }
    } else {
      habit.currentStreak = 0;
    }

    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// DELETE a Habit
router.delete('/:habitId/delete', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);

    if (!habit || habit.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Habit not found or unauthorized' });
    }

    await habit.deleteOne();
    res.json({ message: 'Habit deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
