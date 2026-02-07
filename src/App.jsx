import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Menu,
  Bell,
  Command,
  Fingerprint,
  Link,
  Wifi
} from 'lucide-react';
import TaskItem from './components/TaskItem';
import SyncOverlay from './components/SyncOverlay';
import DocsOverlay from './components/DocsOverlay';
import InstallPrompt from './components/InstallPrompt';
import { broadcastData } from './lib/sync/peer';

import * as chrono from 'chrono-node';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Analytics } from '@vercel/analytics/react';

const App = () => {
  // Initialize Tasks from LocalStorage
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('echo_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showSyncToast, setShowSyncToast] = useState(false);

  // Sync State
  const [isSyncOverlayOpen, setIsSyncOverlayOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Request Notification Permission
  // Request Notification Permission
  useEffect(() => {
    const requestPerms = async () => {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.requestPermissions();
      } else if (Notification && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    };
    requestPerms();
  }, []);

  // Check for Reminders Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      // Check for due reminders
      tasks.forEach(task => {
        if (task.reminderTime && !task.reminderSent) {
          const reminderDate = new Date(task.reminderTime);
          // Check if it's time (within last minute to avoid double firing if interval drifts slightly)
          if (now >= reminderDate && now - reminderDate < 60000) {

            // Send Notification
            if ((typeof Notification !== 'undefined' && Notification.permission === 'granted') || Capacitor.isNativePlatform()) {
              if (Capacitor.isNativePlatform()) {
                LocalNotifications.schedule({
                  notifications: [{
                    title: "EchoList Reminder",
                    body: `Upcoming: ${task.text}`,
                    id: Math.floor(task.id / 1000), // Ensure int ID
                    schedule: { at: new Date(Date.now() + 100) }, // Trigger immediately
                    sound: null,
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                  }]
                });
              } else {
                new Notification("EchoList Reminder", {
                  body: `Upcoming: ${task.text}`,
                  // icon: '/vite.svg' // Placeholder
                });
              }

              // Mark as sent in state
              setTasks(current => current.map(t =>
                t.id === task.id ? { ...t, reminderSent: true } : t
              ));
            }
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  // Save Tasks to LocalStorage
  useEffect(() => {
    localStorage.setItem('echo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsInputOpen(true);
      }
      if (e.key === 'Escape') {
        setIsInputOpen(false);
        setIsSyncOverlayOpen(false);
        setIsDocsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persist Identity (Mock)
  useEffect(() => {
    const stored = localStorage.getItem('echo_identity');
    if (stored) {
      setIdentity(JSON.parse(stored));
    }
  }, []);

  // Handle incoming data from Peer
  const handlePeerData = (data) => {
    // 0. Handle Deletions
    if (data && data.type === 'delete') {
      setTasks(prev => prev.filter(t => t.id !== data.id));
      return;
    }

    // 1. Initial Sync (Array of Tasks)
    if (Array.isArray(data)) {
      setTasks(prev => {
        // Merge arrays, filtering duplicates by ID
        const existingIds = new Set(prev.map(t => t.id));
        const newTasks = data.filter(t => !existingIds.has(t.id));
        if (newTasks.length > 0) {
          setShowSyncToast(true);
          return [...newTasks, ...prev].sort((a, b) => b.id - a.id); // Sort by newest
        }
        return prev;
      });
      return;
    }

    // 2. Single Task Update
    if (data && data.text) {
      setTasks(prev => {
        // Prevent duplicates
        if (prev.find(t => t.id === data.id)) return prev;
        return [data, ...prev];
      });
      setShowSyncToast(true);
    }
  };

  const handleSync = (newIdentity) => {
    if (newIdentity) {
      setIdentity(newIdentity);
      localStorage.setItem('echo_identity', JSON.stringify(newIdentity));
    }
  };

  // Trigger Full Sync when Connected
  useEffect(() => {
    if (isConnected && tasks.length > 0) {
      // Send all tasks to the newly connected peer
      // console.log("Broadcasting Full History (" + tasks.length + " items)");
      broadcastData(tasks);
    }
  }, [isConnected]);

  const removeTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    // Broadcast Deletion
    broadcastData({ type: 'delete', id });
  };

  const addTask = (text, source = "Desktop") => {
    // Intelligent Parsing
    const parsedDate = chrono.parseDate(text);
    let reminderTime = null;
    let meta = source === "Mobile" ? "Synced via smartphone bridge" : "Captured via studio terminal";

    if (parsedDate) {
      // Calculate 5 minutes prior
      const d = new Date(parsedDate);
      d.setMinutes(d.getMinutes() - 5);
      reminderTime = d.toISOString();
      const timeStr = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      meta = `Reminder set for ${timeStr} (-5m)`;
    }

    const newTask = {
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source,
      meta,
      reminderTime,
      reminderSent: false
    };
    setTasks([newTask, ...tasks]);

    // Broadcast to connected peers
    broadcastData(newTask);

    if (source === "Mobile") {
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 5000);
    }
  };

  const updateTask = (id, newText) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, text: newText } : task
    ));

    // Broadcast Update
    broadcastData({ type: 'update', id, text: newText });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased relative">
      {/* Minimal Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* Minimal Top-Bar */}
      <nav className="fixed top-0 w-full z-50 px-8 py-8 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm">
            <Fingerprint size={20} className="text-slate-900" strokeWidth={1.5} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] block">EchoList</span>
            <span className="text-[9px] text-slate-300 font-medium">STUDIO v.01</span>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {/* Sync Button */}
          <button
            onClick={() => setIsSyncOverlayOpen(true)}
            className={`h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 transition-all shadow-sm ${isConnected ? 'text-orange-500 border-orange-100' : 'text-slate-400 hover:text-slate-900'}`}
          >
            {isConnected ? <Wifi size={14} /> : <Link size={14} />}
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">
              {isConnected ? 'Linked' : 'Connect'}
            </span>
          </button>

          {/* Unique Hamburger Menu */}
          <button
            onClick={() => setIsDocsOpen(true)}
            className="w-10 h-10 bg-slate-900 border border-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 group"
          >
            <div className="flex flex-col gap-1 items-end">
              <div className="w-4 h-0.5 bg-white group-hover:w-3 transition-all"></div>
              <div className="w-3 h-0.5 bg-white group-hover:w-4 transition-all"></div>
            </div>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto pt-48 px-6 pb-40 relative z-10">

        {/* Header Section */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 mb-8 select-none">
              Capture <br />
              <span className="text-slate-200">the flow.</span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-12">
              <p className="max-w-sm text-base text-slate-400 leading-relaxed font-medium italic">
                A minimal interface for high-frequency synchronization.
                Everything in order, nothing in excess.
              </p>
              <div className="flex gap-12 border-l border-slate-100 pl-12 hidden md:flex">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-1">Queue</p>
                  <p className="text-2xl font-bold tracking-tighter">{tasks.length}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-1">Status</p>
                  <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                    {isConnected ? 'Active Line' : 'Offline'}
                    {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Task Timeline */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-16">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">Today</h2>
            <div className="flex-1 h-[1px] bg-slate-100" />
          </div>

          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={removeTask}
                onArchive={removeTask}
                onUpdate={updateTask}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-20 text-center opacity-20">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Command size={12} /> K for studio capture
          </div>
        </div>
      </main>

      {/* Input Overlay */}
      <AnimatePresence>
        {isInputOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md" onClick={() => setIsInputOpen(false)} />
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-2xl relative"
            >
              <form onSubmit={(e) => { e.preventDefault(); if (inputValue.trim()) { addTask(inputValue); setInputValue(""); setIsInputOpen(false); } }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Focus on the task..."
                  className="w-full bg-transparent text-4xl md:text-5xl font-bold text-slate-900 outline-none placeholder:text-slate-100"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <div className="mt-12 flex justify-between items-center border-t border-slate-100 pt-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">New Entry</span>
                  <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">
                    Capture
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Overlay */}
      <SyncOverlay
        isOpen={isSyncOverlayOpen}
        onClose={() => setIsSyncOverlayOpen(false)}
        onSync={handleSync}
        onConnectionChange={setIsConnected}
        onPeerData={handlePeerData}
      />

      {/* Docs Overlay */}
      <DocsOverlay
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      {/* Sync Toast */}
      <AnimatePresence>
        {showSyncToast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-12 right-12 z-[110]"
          >
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex items-center gap-5">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-0.5">
                  {identity ? 'Secure Link' : 'Mobile Link'}
                </p>
                <p className="text-xs font-medium">
                  {identity ? `Connected: ${identity.syncId?.slice(0, 4)}...` : 'New thought captured from bridge'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsInputOpen(true)}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-center z-50 group shadow-slate-900/10"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
      </motion.button>

      <Analytics />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default App;
