/* Created by Metrum AI for Dell */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

// Define interface for component props
interface NotificationProps {
  message: string;
  type: 'success' | 'failure' | 'neutral';
  onClose: () => void;
}

const notificationVariants = {
  hidden: {
    opacity: 0,
    y: -50,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: { duration: 0.5 },
  },
};

const Notification = ({ message, type, onClose }: NotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className={`notification ${type}`}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={notificationVariants}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;
