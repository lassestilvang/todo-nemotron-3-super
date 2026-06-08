'use client';

import { motion, type MotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionWrapperProps extends MotionProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export const MotionWrapper = ({ 
  children, 
  className,
  onClick,
  animate = true,
  delay = 0,
  ...props
}: MotionWrapperProps) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={className}
      onClick={onClick}
      initial={animate ? 'hidden' : false}
      animate={animate ? 'visible' : false}
      variants={variants}
      transition={{ duration: 0.3, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const FadeIn = ({ children, className, delay = 0, ...props }: MotionWrapperProps) => (
  <MotionWrapper className={className} delay={delay} {...props}>
    {children}
  </MotionWrapper>
);

export const SlideIn = ({ children, className, delay = 0, direction = 'left' as 'left' | 'right' | 'up' | 'down', ...props }: MotionWrapperProps & { direction?: 'left' | 'right' | 'up' | 'down' }) => {
  const slideVariants = {
    hidden: { opacity: 0, x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0, y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0 },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={slideVariants}
      transition={{ duration: 0.3, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn = ({ children, className, delay = 0, ...props }: MotionWrapperProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.2, delay }}
    {...props}
  >
    {children}
  </motion.div>
);