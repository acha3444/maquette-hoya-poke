import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { page } from '../motion';
import HomeScreen from './client/HomeScreen';
import MenuScreen from './client/MenuScreen';
import BuilderScreen from './client/BuilderScreen';
import CheckoutScreen from './client/CheckoutScreen';
import TrackingScreen from './client/TrackingScreen';
import './client/client.css';

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} className="route" {...page}>
        <Routes location={location}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/menu" element={<MenuScreen />} />
          <Route path="/builder" element={<BuilderScreen />} />
          <Route path="/checkout" element={<CheckoutScreen />} />
          <Route path="/tracking" element={<TrackingScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export default function ClientView() {
  return (
    <div className="client-root">
      <AnimatedRoutes />
    </div>
  );
}
