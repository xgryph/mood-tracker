const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class Storage {
  async get(key) {
    try {
      // Parse "mood:YYYY-MM-DD" format
      const date = key.replace('mood:', '');

      const response = await fetch(`${API_URL}/api/moods/${date}`);

      if (response.status === 404) {
        return null; // No data for this date
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return {
        key,
        value: JSON.stringify(result.data),
        shared: false
      };
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  async set(key, value) {
    try {
      const date = key.replace('mood:', '');
      const data = JSON.parse(value);

      const response = await fetch(`${API_URL}/api/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, data })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { key, value, shared: false };
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  async list(prefix) {
    try {
      const response = await fetch(`${API_URL}/api/moods`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const moods = await response.json();
      const keys = Object.keys(moods).map(date => `mood:${date}`);

      return { keys, prefix };
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [], prefix };
    }
  }

  async delete(key) {
    try {
      const date = key.replace('mood:', '');

      const response = await fetch(`${API_URL}/api/moods/${date}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return { key, deleted: true, shared: false };
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  }
}

// Initialize global storage API
if (typeof window !== 'undefined') {
  window.storage = new Storage();
}

export default Storage;
