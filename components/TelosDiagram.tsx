import React from 'react';
import { motion } from 'framer-motion';

export const TelosDiagram: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center py-12">
      {/* Outer Circle (Logic/Protection) */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute w-64 h-64 md:w-80 md:h-80 border border-sumi/80 rounded-full"
      />
      
      {/* Inner Circle (Core Value) */}
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        className="absolute w-32 h-32 md:w-40 md:h-40 bg-stone/20 rounded-full flex flex-col items-center justify-center backdrop-blur-sm gap-2"
      >
         <span className="font-heading text-xl md:text-2xl text-sumi">TELOS</span>
         <span className="font-serif text-[10px] tracking-widest uppercase text-bronze">Sophia</span>
      </motion.div>

      {/* Axis Lines */}
      <motion.div 
        initial={{ height: 0 }}
        whileInView={{ height: '100%' }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute w-[1px] bg-vapor/50 h-full"
      />
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute h-[1px] bg-vapor/50 w-full"
      />

      {/* Labels */}
      <motion.div 
         initial={{ opacity: 0 }}
         whileInView={{ opacity: 1 }}
         transition={{ delay: 1, duration: 1 }}
         className="absolute inset-0"
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-xs tracking-widest uppercase">Techne</span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-xs tracking-widest uppercase">Evidence</span>
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 text-xs tracking-widest uppercase">Logos</span>
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 text-xs tracking-widest uppercase">Organosis</span>
      </motion.div>
    </div>
  );
};