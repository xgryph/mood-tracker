import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

// Ensure data directory and file exist
async function ensureDb() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify({ moods: {} }, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring DB:', error);
  }
}

// Read database
async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Write database with atomic operation
async function writeDb(data) {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, DB_PATH);
}

// GET /api/moods - Get all moods
router.get('/', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json(db.moods);
  } catch (error) {
    next(error);
  }
});

// GET /api/moods/export/all - Export all data (must be before :date route)
router.get('/export/all', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({
      exportDate: new Date().toISOString(),
      moods: db.moods,
      version: '1.0'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/moods/:date - Get mood for specific date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const db = await readDb();

    if (!db.moods[date]) {
      return res.status(404).json({ error: 'Mood not found for this date' });
    }

    res.json({ date, data: db.moods[date] });
  } catch (error) {
    next(error);
  }
});

// POST /api/moods - Create or update mood
router.post('/', async (req, res, next) => {
  try {
    const { date, data } = req.body;

    if (!date || !data) {
      return res.status(400).json({ error: 'Date and data are required' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const db = await readDb();
    db.moods[date] = data;
    await writeDb(db);

    res.json({ date, data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/moods/:date - Delete mood for date
router.delete('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const db = await readDb();

    if (!db.moods[date]) {
      return res.status(404).json({ error: 'Mood not found for this date' });
    }

    delete db.moods[date];
    await writeDb(db);

    res.json({ message: 'Mood deleted', date });
  } catch (error) {
    next(error);
  }
});

export default router;
