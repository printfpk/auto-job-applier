import React, { useState, useEffect, useRef } from 'react';
import { startBot, stopBot } from './api';
import SettingsForm from './components/SettingsForm';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [botStatus, setBotStatus] = useState('Idle');
  const [logs, setLogs] = useState(['[System] Ready to start.']);
  const logsEndRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('log', (message) => {
      setLogs(prev => [...prev, message]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleStart = async () => {
    setBotStatus('Starting...');
    try {
      await startBot();
      setBotStatus('Running');
    } catch (err) {
      console.error(err);
      setBotStatus('Error Starting');
    }
  };

  const handleStop = async () => {
    try {
      await stopBot();
      setBotStatus('Stopped');
    } catch (err) {
      console.error(err);
      setBotStatus('Error Stopping');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          LinkedIn Auto Applier
        </h1>
        <div className="flex gap-4 items-center">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${botStatus === 'Running' ? 'bg-green-600' : 'bg-gray-600'}`}>
            Status: {botStatus}
          </span>
          <button onClick={handleStart} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white font-bold transition">
            Start Bot
          </button>
          <button onClick={handleStop} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white font-bold transition">
            Stop Bot
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <SettingsForm />
        </section>
        <section className="bg-gray-800 p-4 rounded-lg flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4">Live Logs</h2>
          <div className="bg-black p-4 rounded h-96 overflow-y-auto font-mono text-xs text-green-400 border border-gray-700 shadow-inner">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
