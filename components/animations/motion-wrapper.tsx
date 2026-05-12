import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

export const MotionWrapper = ({ 
  children, 
  variants, 
  initial = false, 
  animate = true, 
  exit,
  className,
  ...props 
}: {
  children?: ReactNode;
  variants?: Variants;
  initial?: any;
  animate?: any;
  exit?: any;
  className?: string;
}) => {
    return (
      <motion.div
        className={className}
        variants={variants}
        initial={initial}
        animate={animate}
        exit={exit}
        {...props}
      >
        {children}
      </motion.div>
    );
};

export const slideInLeft = (delay: number = 0): Variants => {
  return {
    hidden: { x: -20, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        delay,
      },
    },
  };
};