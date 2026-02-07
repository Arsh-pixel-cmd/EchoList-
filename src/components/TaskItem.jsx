import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Smartphone,
    Archive,
    CornerDownRight,
    Pencil
} from 'lucide-react';

const TaskItem = ({ task, onComplete, onArchive, onUpdate }) => {
    const [isArchiving, setIsArchiving] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState(task.text);

    const handleArchive = () => {
        setIsArchiving(true);
        // Wait for animation to finish before removing from list
        setTimeout(() => {
            onArchive(task.id);
        }, 600);
    };

    const handleSave = () => {
        if (editText.trim() !== task.text) {
            onUpdate(task.id, editText);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            setEditText(task.text);
            setIsEditing(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="relative pl-12 pb-12 group"
        >
            {/* Refined Timeline Axis */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-slate-200 group-last:bg-transparent" />
            <div className="absolute left-0 top-2 w-10 h-10 flex items-center justify-center bg-transparent z-10">
                <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${task.source === 'Mobile' ? 'bg-orange-500 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'bg-white border-slate-300 group-hover:border-slate-900'}`} />
            </div>

            <div className={`flex flex-col md:flex-row md:items-start justify-between gap-4 p-8 rounded-[1.5rem] bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all duration-500 relative overflow-hidden ${isEditing ? 'shadow-[0_20px_40px_rgba(0,0,0,0.05)] scale-[1.02] z-20' : 'group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)]'}`}>

                <motion.div
                    className="max-w-2xl relative z-10"
                    animate={isArchiving ? {
                        scale: [1, 0.8, 0.4, 0],
                        rotate: [0, 5, -10, 45, 180],
                        opacity: [1, 1, 0.8, 0],
                        x: [0, 20, 100, 200], // Move towards the right (Archive button area)
                        y: [0, 10, -20, 50]
                    } : {}}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{task.time}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-100" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500 flex items-center gap-1">
                            {task.source === 'Mobile' && <><Smartphone size={10} /> Sync</>}
                        </span>
                    </div>
                    {isEditing ? (
                        <motion.textarea
                            layoutId={`text-${task.id}`}
                            initial={{ opacity: 0, height: 'auto' }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            autoFocus
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="w-full text-xl font-medium tracking-tight text-slate-900 leading-tight mb-4 bg-transparent outline-none resize-none overflow-hidden placeholder:text-slate-300 min-h-[1.5em]"
                            style={{ height: 'auto' }}
                            rows={Math.max(1, editText.split('\n').length)}
                        />
                    ) : (
                        <motion.h3
                            layoutId={`text-${task.id}`}
                            onClick={() => setIsEditing(true)}
                            className="text-xl font-medium tracking-tight text-slate-900 leading-tight mb-4 cursor-text hover:text-slate-700 transition-colors"
                        >
                            {task.text}
                        </motion.h3>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CornerDownRight size={14} className="text-slate-200" />
                        <span className="font-medium text-slate-300">{task.meta}</span>
                    </div>
                </motion.div>

                <div className="flex items-center gap-2 self-end md:self-start opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-20">
                    <motion.button
                        onClick={() => setIsEditing(true)}
                        className="p-3 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors"
                    >
                        <Pencil size={18} strokeWidth={1.5} />
                    </motion.button>
                    <motion.button
                        onClick={handleArchive}
                        disabled={isArchiving}
                        animate={isArchiving ? {
                            scale: [1, 1.2, 0.9, 1.1, 1],
                            rotate: [0, -10, 10, -5, 0],
                        } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-3 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors relative"
                    >
                        <Archive size={18} strokeWidth={1.5} />
                        {isArchiving && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="absolute inset-0 bg-slate-100 rounded-full -z-10"
                            />
                        )}
                    </motion.button>
                    <div className="flex items-center gap-3">
                        {/* Decorative "Data Stream" Icon */}
                        <div className="opacity-0 group-hover:opacity-30 transition-opacity">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 12H9L11 16L13 8L15 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <button
                            onClick={() => onComplete(task.id)}
                            className="p-3 bg-slate-900 text-white rounded-xl hover:scale-105 transition-all shadow-md shadow-slate-900/10"
                        >
                            <CheckCircle2 size={18} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskItem;
