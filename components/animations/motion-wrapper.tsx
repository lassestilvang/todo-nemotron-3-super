import { motion, type Variants, type TargetAndTransition } from 'framer-motion';

export const fadeIn = (direction: 'up' | 'down' | 'left' | 'right' = 'up', delay: number = 0): Variants => {
  return {
    hidden: {
      y: direction === 'up' ? 20 : direction === 'down' ? -20 : 0,
      x: direction === 'left' ? 20 : direction === 'right' ? -20 : 0,
      opacity: 0,
    },
    show: {
      y: 0,
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

export const staggerContainer = (staggerChildren: number = 0.1, delayChildren: number = 0): Variants => {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  };
};

export const slideUp = (delay: number = 0): Variants => {
  return {
    hidden: { y: 20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        delay,
      },
    },
  };
};

export const slideDown = (delay: number = 0): Variants => {
  return {
    hidden: { y: -20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 20,
        delay,
      },
    },
  };
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

export const slideInRight = (delay: number = 0): Variants => {
  return {
    hidden: { x: 20, opacity: 0 },
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

export const pulse = (delay: number = 0): Variants => {
  return {
    hidden: { scale: 0.95 },
    show: {
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        delay,
      },
    },
  };
};

export const modalVariants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      type: 'spring',
      damping: 20,
    },
  },
};

export const MotionWrapper = ({ children, variants, initial, animate, exit, ...props }: 
   & React.ComponentPropsWithoutRef<'div'> 
   & { variants?: Variants; initial?: boolean | string; animate?: boolean | string; exit?: boolean | string }
) => {
   return (
     <motion.div
       variants={variants}
       initial={initial ?? undefined}
       animate={animate ?? undefined}
       exit={exit ?? undefined}
       {...props}
     >
       {children}
     </motion.div>
   );
};
