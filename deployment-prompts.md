# LLM Coding Agent Prompts: Mood Tracker Full-Stack Deployment

These prompts transform the React mood tracker into a fully functional application with Node.js backend for local network deployment.

**Key Changes from Original:**
- Data stored on Node.js/Express server instead of browser storage
- Simple JSON file-based database (no auth needed for local network)
- Complete separation of frontend and backend
- Docker deployment option for easy local network setup

---

## STARTING POINT: Mood Tracker Component Code

**IMPORTANT:** Provide this complete React component code to the coding agent as the starting point. This is production-ready and should not be modified - only integrated into the new project structure.

Save this as `client/src/components/MoodTracker.jsx` in the final project:

```jsx
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart3, X } from 'lucide-react';

export default function MoodTracker() {
  const [view, setView] = useState('log');
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const dimensions = [
    { id: 'overall', label: 'Overall', emoji: '😊', left: 'Low', right: 'Great' },
    { id: 'home', label: 'Home', emoji: '🏠', left: 'Conflict', right: 'Harmony' },
    { id: 'work', label: 'Work', emoji: '💼', left: 'Stressed', right: 'Flow' },
    { id: 'health', label: 'Health', emoji: '🍎', left: 'Sluggish', right: 'Energized' },
    { id: 'sleep', label: 'Sleep', emoji: '💤', left: 'Restless', right: 'Restorative' },
    { id: 'social', label: 'Social', emoji: '👥', left: 'Isolated', right: 'Connected' }
  ];

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const getHistoryMap = () => {
    const map = {};
    history.forEach(entry => {
      map[entry.date] = entry.data;
    });
    return map;
  };

  const getAverageForDay = (data) => {
    if (!data) return null;
    const values = Object.values(data);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  };

  const generateCalendarGrid = () => {
    const weeks = [];
    const historyMap = getHistoryMap();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 83);
    
    const firstDay = new Date(startDate);
    while (firstDay.getDay() !== 0) {
      firstDay.setDate(firstDay.getDate() - 1);
    }
    
    let currentDate = new Date(firstDay);
    let week = [];
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = historyMap[dateStr];
      const avg = getAverageForDay(data);
      
      week.push({
        date: dateStr,
        data: data,
        avg: avg,
        isToday: dateStr === getTodayKey(),
        isFuture: currentDate > endDate
      });
      
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (week.length > 0) {
      weeks.push(week);
    }
    
    return weeks;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const todayKey = getTodayKey();
      const result = await window.storage.get(`mood:${todayKey}`);
      
      if (result?.value) {
        setToday(JSON.parse(result.value));
      } else {
        const defaultMood = dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 0 }), {});
        setToday(defaultMood);
      }

      const keys = await window.storage.list('mood:');
      if (keys?.keys) {
        const entries = await Promise.all(
          keys.keys.slice(0, 90).map(async (key) => {
            try {
              const result = await window.storage.get(key);
              return result?.value ? { date: key.replace('mood:', ''), data: JSON.parse(result.value) } : null;
            } catch {
              return null;
            }
          })
        );
        setHistory(entries.filter(e => e !== null).sort((a, b) => b.date.localeCompare(a.date)));
      }
    } catch (error) {
      const defaultMood = dimensions.reduce((acc, dim) => ({ ...acc, [dim.id]: 0 }), {});
      setToday(defaultMood);
    }
  };

  const handleSliderChange = async (dimensionId, value) => {
    const numValue = parseInt(value);
    const updated = { ...today, [dimensionId]: numValue };
    setToday(updated);
    
    setSaving(true);
    try {
      const todayKey = getTodayKey();
      await window.storage.set(`mood:${todayKey}`, JSON.stringify(updated));
      await loadData();
    } catch (error) {
      console.error('Save failed:', error);
    }
    setSaving(false);
  };

  const handleDayClick = (dayData) => {
    if (!dayData.data) return;
    setSelectedDate(dayData);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };

  const getGradientForValue = (value) => {
    if (value <= -2) return 'from-rose-400 to-red-500';
    if (value === -1) return 'from-orange-300 to-orange-400';
    if (value === 0) return 'from-amber-200 to-yellow-300';
    if (value === 1) return 'from-lime-300 to-green-400';
    return 'from-emerald-400 to-teal-500';
  };

  const getOverallMood = () => {
    if (!today) return 0;
    const avg = Object.values(today).reduce((sum, val) => sum + val, 0) / Object.values(today).length;
    return avg;
  };

  if (!today) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-purple-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      <div className={`bg-gradient-to-r ${getGradientForValue(getOverallMood())} text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg`}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h1>
          <p className="text-white/90 text-sm">How's your day?</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-4">
        {view === 'log' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            {saving && (
              <div className="text-center text-sm text-green-600 font-medium animate-pulse">
                Saved ✓
              </div>
            )}
            
            {dimensions.map((dim, idx) => (
              <div key={dim.id} className="space-y-3" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{dim.emoji}</span>
                    <span className="font-semibold text-gray-800" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      {dim.label}
                    </span>
                  </div>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientForValue(today[dim.id])} flex items-center justify-center text-white font-bold shadow-md`}>
                    {today[dim.id] > 0 ? '+' : ''}{today[dim.id]}
                  </div>
                </div>
                
                <div className="relative">
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    value={today[dim.id]}
                    onChange={(e) => handleSliderChange(dim.id, e.target.value)}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, 
                        #fb7185 0%, 
                        #fb923c 25%, 
                        #fbbf24 50%, 
                        #84cc16 75%, 
                        #10b981 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{dim.left}</span>
                    <span>{dim.right}</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 text-center text-sm text-gray-500">
              Changes saved automatically
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Your Journey
            </h2>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Start logging to see your history</p>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto pb-2">
                  <div className="inline-block min-w-full">
                    <div className="flex gap-1 mb-2 text-xs text-gray-500 pl-8">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="w-7 text-center">{day}</div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {generateCalendarGrid().map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-1">
                          {week.map((day, dayIdx) => {
                            const color = day.isFuture 
                              ? 'bg-gray-100' 
                              : !day.data 
                                ? 'bg-gray-200' 
                                : day.avg <= -1.5 ? 'bg-red-500'
                                : day.avg <= -0.5 ? 'bg-orange-400'
                                : day.avg <= 0.5 ? 'bg-yellow-300'
                                : day.avg <= 1.5 ? 'bg-green-400'
                                : 'bg-emerald-500';
                            
                            return (
                              <button
                                key={dayIdx}
                                onClick={() => handleDayClick(day)}
                                disabled={!day.data}
                                className={`w-7 h-7 rounded ${color} ${
                                  day.isToday ? 'ring-2 ring-purple-500 ring-offset-1' : ''
                                } ${
                                  day.data ? 'hover:ring-2 hover:ring-purple-300 cursor-pointer transform hover:scale-110' : 'cursor-default'
                                } transition-all duration-150`}
                                title={day.data ? `${day.date}: ${day.avg.toFixed(1)}` : day.date}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center mt-4 text-xs text-gray-600">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                        <div className="w-4 h-4 bg-green-400 rounded"></div>
                        <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recent Entries</h3>
                  {history.slice(0, 7).map((entry) => {
                    const avg = getAverageForDay(entry.data);
                    return (
                      <button
                        key={entry.date}
                        onClick={() => handleDayClick({ date: entry.date, data: entry.data, avg })}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-purple-50 hover:shadow-md transition-all text-left"
                      >
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getGradientForValue(avg)} flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0`}>
                          {avg.toFixed(1)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {dimensions.slice(1).map(dim => (
                              <div key={dim.id} className="flex items-center gap-1 text-xs">
                                <span>{dim.emoji}</span>
                                <span className={`font-medium ${entry.data[dim.id] >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                                  {entry.data[dim.id] > 0 ? '+' : ''}{entry.data[dim.id]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'insights' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Insights
            </h2>
            {history.length < 3 ? (
              <p className="text-gray-500 text-center py-8">Log at least 3 days to see insights</p>
            ) : (
              <div className="space-y-4">
                {dimensions.map((dim) => {
                  const values = history.map(h => h.data[dim.id]);
                  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
                  const trend = values.length >= 7 
                    ? (values.slice(0, 3).reduce((s, v) => s + v, 0) / 3) - (values.slice(-3).reduce((s, v) => s + v, 0) / 3)
                    : 0;
                  
                  return (
                    <div key={dim.id} className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{dim.emoji}</span>
                          <span className="font-semibold text-gray-800">{dim.label}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${avg >= 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          Avg: {avg.toFixed(1)}
                        </div>
                      </div>
                      {Math.abs(trend) > 0.3 && (
                        <div className="text-xs text-gray-600 flex items-center gap-1">
                          {trend > 0 ? '📈 Improving' : '📉 Declining'} recently
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-around items-center shadow-lg">
        <button
          onClick={() => setView('log')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'log' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-xs font-medium">Today</span>
        </button>
        
        <button
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'history' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">History</span>
        </button>
        
        <button
          onClick={() => setView('insights')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
            view === 'insights' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>
      </div>

      {showDayModal && selectedDate && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={closeDayModal}
        >
          <div 
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
                  {new Date(selectedDate.date + 'T00:00:00').toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <div className={`inline-block mt-2 px-4 py-2 rounded-full bg-gradient-to-br ${getGradientForValue(selectedDate.avg)} text-white font-bold text-lg shadow-md`}>
                  Overall: {selectedDate.avg.toFixed(1)}
                </div>
              </div>
              <button
                onClick={closeDayModal}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {dimensions.map((dim) => {
                const value = selectedDate.data[dim.id];
                return (
                  <div key={dim.id} className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-purple-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{dim.emoji}</span>
                        <span className="font-semibold text-gray-800">{dim.label}</span>
                      </div>
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradientForValue(value)} flex items-center justify-center text-white font-bold shadow-md`}>
                        {value > 0 ? '+' : ''}{value}
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full bg-gradient-to-r ${getGradientForValue(value)} transition-all`}
                        style={{ 
                          width: `${((value + 2) / 4) * 100}%`,
                          left: 0
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{dim.left}</span>
                      <span>{dim.right}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={closeDayModal}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #8b5cf6;
          transition: transform 0.15s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        
        .slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #8b5cf6;
          transition: transform 0.15s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        @media (max-width: 640px) {
          button {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}
```

---

## Prompt 1: Initialize Full-Stack Project Structure

```
Create a full-stack mood tracker application with the following structure:

mood-tracker/
├── server/
│   ├── package.json
│   ├── server.js
│   ├── data/
│   │   └── db.json
│   ├── routes/
│   │   └── moods.js
│   └── .env.example
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── components/
│   │   │   └── MoodTracker.jsx
│   │   └── api/
│   │       └── storage.js
│   ├── public/
│   │   └── manifest.json
│   └── .env.example
├── package.json (root with workspaces)
├── .gitignore
└── README.md

Server dependencies (server/package.json):
{
  "name": "mood-tracker-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}

Client dependencies (client/package.json):
{
  "name": "mood-tracker-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5",
    "tailwindcss": "^3.3.3",
    "postcss": "^8.4.27",
    "autoprefixer": "^10.4.14"
  }
}

Root package.json:
{
  "name": "mood-tracker",
  "private": true,
  "workspaces": ["server", "client"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "build": "npm run build --workspace=client",
    "start:server": "npm run start --workspace=server",
    "start:client": "npm run preview --workspace=client"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}

.gitignore:
node_modules/
dist/
.env
server/data/db.json
server/data/backups/
*.log
```

---

## Prompt 2: Create Node.js/Express Backend

```
Implement the Express server in server/server.js:

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moodRoutes from './routes/moods.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/moods', moodRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access from network: http://[your-ip]:${PORT}`);
});

Create server/.env.example:
PORT=3001
CLIENT_URL=http://localhost:5173
DB_PATH=./data/db.json
```

---

## Prompt 3: Implement Mood API Routes

```
Create server/routes/moods.js with full CRUD operations:

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

// GET /api/moods/export/all - Export all data
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

export default router;

Initialize server/data/db.json:
{
  "moods": {}
}
```

---

## Prompt 4: Create Frontend API Client

```
Create client/src/api/storage.js that bridges the React component to the backend:

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

Create client/.env.example:
VITE_API_URL=http://localhost:3001
```

---

## Prompt 5: Configure Vite and Tailwind

```
Create client/vite.config.js:

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow network access
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

Create client/tailwind.config.js:

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 }
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: []
};

Create client/postcss.config.js:

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

Create client/src/index.css:

@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Prompt 6: Create React Entry Points

```
Create client/index.html:

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#a855f7" />
    <meta name="description" content="Track your daily mood in under 10 seconds" />
    <link rel="manifest" href="/manifest.json" />
    <title>Mood Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

Create client/src/main.jsx:

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Storage from './api/storage';
import './index.css';

// Initialize storage before rendering
if (!window.storage) {
  window.storage = new Storage();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

Create client/src/App.jsx:

import React, { useState, useEffect } from 'react';
import MoodTracker from './components/MoodTracker';

function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check server connection
    const checkConnection = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/health`);
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-purple-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Server Offline</h1>
          <p className="text-gray-600">
            Cannot connect to the mood tracker server. Please ensure the server is running.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <MoodTracker />;
}

export default App;

Copy the MoodTracker.jsx component code (from the beginning of this document) to client/src/components/MoodTracker.jsx
```

---

## Prompt 7: Add PWA Manifest

```
Create client/public/manifest.json:

{
  "name": "Mood Tracker",
  "short_name": "Mood",
  "description": "Track your daily mood in under 10 seconds",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf5ff",
  "theme_color": "#a855f7",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["health", "lifestyle", "productivity"],
  "screenshots": []
}

Note: Create simple icons or use emoji-based icons for now. For production, generate proper PNG icons at 192x192 and 512x512.
```

---

## Prompt 8: Add Data Export/Import Features

```
Create client/src/components/DataManager.jsx:

import React, { useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';

export default function DataManager() {
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/moods/export/all`);
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mood-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.moods) {
        throw new Error('Invalid backup file format');
      }

      // Import each mood entry
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const entries = Object.entries(data.moods);
      
      for (const [date, moodData] of entries) {
        await fetch(`${apiUrl}/api/moods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, data: moodData })
        });
      }
      
      alert(`Successfully imported ${entries.length} mood entries!`);
      window.location.reload();
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
      
      <button
        onClick={handleExport}
        className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl hover:shadow-lg transition-all"
      >
        <Download className="w-5 h-5" />
        Export All Data
      </button>

      <label className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:shadow-lg transition-all cursor-pointer">
        <Upload className="w-5 h-5" />
        {importing ? 'Importing...' : 'Import Data'}
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
      </label>

      <p className="text-xs text-gray-500 text-center">
        Export your data as a backup or import from a previous backup
      </p>
    </div>
  );
}

Update client/src/components/MoodTracker.jsx insights view to include DataManager:

// Add import at top
import DataManager from './DataManager';

// In the insights view section, after the dimensions mapping, add:
<div className="pt-6 border-t border-gray-200">
  <DataManager />
</div>
```

---

## Prompt 9: Create Docker Deployment (Optional)

```
Create Dockerfile for server (server/Dockerfile):

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]

Create Dockerfile for client (client/Dockerfile):

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

Create client/nginx.conf:

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

Create docker-compose.yml in root:

version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    volumes:
      - ./server/data:/app/data
    environment:
      - PORT=3001
      - CLIENT_URL=http://localhost
    restart: unless-stopped
    networks:
      - mood-tracker

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - mood-tracker

networks:
  mood-tracker:
    driver: bridge

volumes:
  mood-data:

Usage:
docker-compose up -d
Access at: http://localhost or http://[your-local-ip]
```

---

## Prompt 10: Create Documentation

```
Create comprehensive README.md in root:

# Mood Tracker

Zero-friction daily mood tracking with local network server storage.

## Features

- ⚡ Track 6 mood dimensions in under 10 seconds
- 📊 GitHub-style calendar visualization showing your mood history
- 💾 Server-based storage - access from any device on your network
- 📱 Mobile-optimized, installable as PWA
- 📦 Export/Import your data anytime
- 🐳 Docker support for easy deployment

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Storage**: JSON file (no database required)
- **Deployment**: Docker or Node.js

## Quick Start

### Development Setup

1. Clone and install:
\`\`\`bash
git clone [your-repo]
cd mood-tracker
npm install
\`\`\`

2. Configure environment:
\`\`\`bash
# Server
cp server/.env.example server/.env

# Client  
cp client/.env.example client/.env
\`\`\`

3. Start development servers:
\`\`\`bash
npm run dev
\`\`\`

This starts both server (port 3001) and client (port 5173).

Access at: http://localhost:5173

### Docker Deployment

Easiest way to deploy on your local network:

\`\`\`bash
docker-compose up -d
\`\`\`

Access at:
- Local: http://localhost
- Network: http://[your-ip]

## Network Access

To access from other devices on your local network:

1. Find your server's IP address:
   - Windows: \`ipconfig\`
   - Mac/Linux: \`ifconfig\` or \`ip addr\`

2. Update client/.env:
   \`\`\`
   VITE_API_URL=http://[your-server-ip]:3001
   \`\`\`

3. Ensure firewall allows ports 3001 and 5173 (or 80 for Docker)

4. Access from any device: http://[your-server-ip]:5173

5. Install as PWA on mobile for app-like experience

## Data Management

### Storage Location

Data is stored in \`server/data/db.json\`

### Backup

**Automatic**: Server keeps data in a simple JSON file

**Manual**:
1. Click "Export Data" in the Insights tab
2. Downloads: \`mood-tracker-backup-YYYY-MM-DD.json\`

**Restore**:
1. Click "Import Data" in the Insights tab
2. Select your backup file
3. Data will be merged with existing entries

### Cloud Sync (Optional)

Setup a cron job or sync tool to copy \`server/data/db.json\` to:
- Dropbox
- Google Drive  
- NAS
- Any cloud storage

## API Endpoints

Base URL: \`http://localhost:3001/api\`

- \`GET /moods\` - Get all mood entries
- \`GET /moods/:date\` - Get mood for specific date (YYYY-MM-DD)
- \`POST /moods\` - Create/update mood entry
- \`DELETE /moods/:date\` - Delete mood entry
- \`GET /moods/export/all\` - Export all data as JSON

## Development

### Project Structure

\`\`\`
mood-tracker/
├── server/          # Express API
│   ├── routes/      # API routes
│   └── data/        # JSON database
└── client/          # React frontend
    ├── src/
    │   ├── components/
    │   └── api/     # Storage abstraction
    └── public/
\`\`\`

### Scripts

\`\`\`bash
npm run dev              # Start both server and client
npm run build            # Build client for production
npm run start:server     # Start production server
npm run start:client     # Preview production client
\`\`\`

## Troubleshooting

**Server won't start:**
- Check port 3001 is not in use
- Verify server/.env exists
- Check server/data/ directory exists

**Client can't connect:**
- Verify server is running on 3001
- Check VITE_API_URL in client/.env
- Ensure CORS is allowing your client URL

**Network access not working:**
- Check firewall settings
- Verify server is bound to 0.0.0.0
- Try accessing http://[ip]:3001/health directly

## License

Personal use

## Credits

Built for tracking daily mood with minimal friction.

Create API.md documenting all endpoints:

# Mood Tracker API Documentation

Base URL: \`http://localhost:3001/api\`

## Endpoints

### Health Check

\`\`\`
GET /health
\`\`\`

Returns server status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

### Get All Moods

\`\`\`
GET /moods
\`\`\`

Returns all mood entries.

**Response:**
\`\`\`json
{
  "2024-01-15": {
    "overall": 1,
    "home": 2,
    "work": 0,
    "health": 1,
    "sleep": -1,
    "social": 1
  },
  "2024-01-16": { ... }
}
\`\`\`

### Get Mood for Date

\`\`\`
GET /moods/:date
\`\`\`

**Parameters:**
- \`date\` - Date in YYYY-MM-DD format

**Response:**
\`\`\`json
{
  "date": "2024-01-15",
  "data": {
    "overall": 1,
    "home": 2,
    "work": 0,
    "health": 1,
    "sleep": -1,
    "social": 1
  }
}
\`\`\`

**Error (404):**
\`\`\`json
{
  "error": "Mood not found for this date"
}
\`\`\`

### Create/Update Mood

\`\`\`
POST /moods
\`\`\`

**Body:**
\`\`\`json
{
  "date": "2024-01-15",
  "data": {
    "overall": 1,
    "home": 2,
    "work": 0,
    "health": 1,
    "sleep": -1,
    "social": 1
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "date": "2024-01-15",
  "data": { ... }
}
\`\`\`

### Delete Mood

\`\`\`
DELETE /moods/:date
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Mood deleted",
  "date": "2024-01-15"
}
\`\`\`

### Export All Data

\`\`\`
GET /moods/export/all
\`\`\`

**Response:**
\`\`\`json
{
  "exportDate": "2024-01-15T10:30:00.000Z",
  "moods": { ... },
  "version": "1.0"
}
\`\`\`

## Error Responses

All endpoints may return:

**400 Bad Request:**
\`\`\`json
{
  "error": "Invalid request"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "error": "Resource not found"
}
\`\`\`

**500 Internal Server Error:**
\`\`\`json
{
  "error": "Internal server error"
}
\`\`\`
```

---

## Quick Start Sequence

Run these prompts in order for fastest deployment:

1. **Prompt 1** - Project structure
2. **Prompt 2** - Express server
3. **Prompt 3** - API routes
4. **Prompt 4** - Frontend API client
5. **Prompt 5** - Vite + Tailwind
6. **Prompt 6** - React entry points
7. **Test**: \`npm run dev\`

Optional enhancements:
8. **Prompt 7** - PWA manifest
9. **Prompt 8** - Export/import
10. **Prompt 9** - Docker
11. **Prompt 10** - Documentation

---

## Testing Checklist

After setup, verify:

- [ ] Server starts on port 3001
- [ ] Client starts on port 5173
- [ ] Can log mood for today
- [ ] Data saves to server/data/db.json
- [ ] Calendar grid shows logged days
- [ ] Clicking day shows detail modal
- [ ] Works on mobile browser
- [ ] Export downloads valid JSON
- [ ] Import restores data
- [ ] Health check responds: http://localhost:3001/health
- [ ] Accessible from other devices on network

---

## Network Setup Guide

### Step 1: Find Your IP

Windows:
\`\`\`powershell
ipconfig
# Look for IPv4 Address under your active network adapter
\`\`\`

Mac/Linux:
\`\`\`bash
ifconfig
# or
ip addr show
\`\`\`

### Step 2: Configure Firewall

**Windows:**
- Open Windows Defender Firewall
- Allow ports 3001 and 5173 (or 80 for Docker)

**Mac:**
- System Preferences → Security & Privacy → Firewall
- Add Node.js to allowed apps

**Linux:**
\`\`\`bash
sudo ufw allow 3001
sudo ufw allow 5173
\`\`\`

### Step 3: Update Environment

Edit \`client/.env\`:
\`\`\`
VITE_API_URL=http://192.168.1.100:3001
\`\`\`
(Replace with your actual IP)

### Step 4: Access from Devices

- Desktop: \`http://192.168.1.100:5173\`
- Mobile: \`http://192.168.1.100:5173\`
- Install as PWA on mobile for best experience

---

## Backup Strategy

### Recommended Approach

1. **Daily manual export** (1-click in app)
2. **Automated file sync** of \`server/data/db.json\`:

\`\`\`bash
# Example: Daily backup to Dropbox (Mac/Linux)
#!/bin/bash
cp /path/to/mood-tracker/server/data/db.json ~/Dropbox/mood-backup-$(date +%Y-%m-%d).json

# Add to crontab: 0 2 * * *  /path/to/backup.sh
\`\`\`

3. **Git backup** (if desired):

\`\`\`bash
cd server/data
git init
git add db.json
git commit -m "Backup $(date)"
git push
\`\`\`

---

## Production Deployment

For a permanent local network server:

1. Use Docker for reliability:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

2. Access at http://[server-ip] (port 80)

3. Setup automatic restart on boot:
   - Add docker-compose to startup
   - Or use systemd service (Linux)

4. Regular backups via cron/scheduled task

5. Consider static IP for your server

---

## Mobile PWA Installation

### iOS (Safari)

1. Open http://[server-ip]:5173 in Safari
2. Tap share button
3. "Add to Home Screen"
4. App icon appears on home screen

### Android (Chrome)

1. Open http://[server-ip]:5173 in Chrome
2. Tap menu (3 dots)
3. "Install app" or "Add to Home screen"
4. App appears in app drawer

### Benefits

- Launches like a native app
- No browser chrome
- Fast access
- Offline capable (with service worker)

---

## Troubleshooting

### "Server Offline" Message

1. Check server is running: \`curl http://localhost:3001/health\`
2. Verify VITE_API_URL in client/.env
3. Check firewall settings
4. Restart services: \`npm run dev\`

### Data Not Saving

1. Check server/data/ directory exists
2. Verify write permissions
3. Check server logs for errors
4. Ensure db.json is valid JSON

### Mobile Can't Connect

1. Ensure mobile is on same network
2. Verify server IP address
3. Check router doesn't block inter-device communication
4. Try pinging server from mobile
5. Check firewall on server allows connections from local network

### Docker Issues

1. Check containers running: \`docker-compose ps\`
2. View logs: \`docker-compose logs\`
3. Rebuild: \`docker-compose up --build\`
4. Reset: \`docker-compose down -v && docker-compose up -d\`

---

This completes the full deployment guide for the mood tracker with Node.js backend!
