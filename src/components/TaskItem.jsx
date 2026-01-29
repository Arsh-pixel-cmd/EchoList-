import React from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Smartphone,
    Archive,
    CornerDownRight
} from 'lucide-react';

const TaskItem = ({ task, onComplete }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative pl-12 pb-12 group"
        >
            {/* Refined Timeline Axis */}
            <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-slate-200 group-last:bg-transparent" />
            <div className="absolute left-0 top-2 w-10 h-10 flex items-center justify-center bg-transparent z-10">
                <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${task.source === 'Mobile' ? 'bg-orange-500 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]' : 'bg-white border-slate-300 group-hover:border-slate-900'}`} />
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 p-8 rounded-[1.5rem] bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.01)] group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.03)] transition-all duration-500">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{task.time}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-100" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500 flex items-center gap-1">
                            {task.source === 'Mobile' && <><Smartphone size={10} /> Sync</>}
                        </span>
                    </div>
                    <h3 className="text-xl font-medium tracking-tight text-slate-900 leading-tight mb-4">
                        {task.text}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <CornerDownRight size={14} className="text-slate-200" />
                        <span className="font-medium text-slate-300">{task.meta}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="p-3 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-900 transition-colors">
                        <Archive size={18} strokeWidth={1.5} />
                    </button>
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
