import React from 'react';
import { motion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'none';
  className?: string;
  duration?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = '',
  duration = 0.8
}) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 30 : 0 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: duration,
        delay: delay,
        ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for "cinematic" feel
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};