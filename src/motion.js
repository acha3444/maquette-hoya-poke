export const ease = [0.22, 1, 0.36, 1];

export const page = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2, ease } }
};

export const list = {
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } }
};

export const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease } }
};
