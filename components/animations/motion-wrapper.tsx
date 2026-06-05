import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionWrapperProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MotionWrapper = ({ 
  children, 
  className,
  onClick,
}: MotionWrapperProps) => {
    return (
      <motion.div
        className={className}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
};