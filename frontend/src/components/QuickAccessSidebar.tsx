import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard, Sliders, Building2, Brain, BarChart3,
  Bell, History, Bot, Cpu, Monitor, ChevronLeft, ChevronRight
} from 'lucide-react';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  color: string;
}

const navItemDefs: NavItem[] = [
  { id: 'section-header',      labelKey: 'nav.dashboard',   icon: <LayoutDashboard size={18} />, color: 'from-indigo-500 to-blue-600' },
  { id: 'section-office',      labelKey: 'nav.officeMap',   icon: <Building2 size={18} />,       color: 'from-violet-500 to-purple-600' },
  { id: 'section-ai-insights', labelKey: 'nav.aiInsights',  icon: <Brain size={18} />,           color: 'from-rose-500 to-pink-600' },
  { id: 'section-analytics',   labelKey: 'nav.analytics',   icon: <BarChart3 size={18} />,       color: 'from-amber-500 to-orange-600' },
  { id: 'section-historical',  labelKey: 'nav.historical',  icon: <History size={18} />,         color: 'from-emerald-500 to-green-600' },
  { id: 'section-automation',  labelKey: 'nav.automation',  icon: <Bot size={18} />,             color: 'from-cyan-500 to-blue-600' },
  { id: 'section-devices',     labelKey: 'nav.devices',     icon: <Monitor size={18} />,         color: 'from-slate-400 to-slate-600' },
];

export const QuickAccessSidebar: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('section-header');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show sidebar after a short delay for entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer to track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );

    navItemDefs.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden lg:flex"
    >
      <motion.div
        animate={{ width: isExpanded ? 180 : 52 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col gap-1 py-3 px-1.5 rounded-r-2xl border border-l-0 border-slate-700/60 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Logo / Toggle hint */}
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
            <Cpu size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-[10px] font-bold text-white tracking-wider whitespace-nowrap">QUICK NAV</span>
                <span className="text-[8px] text-slate-500 whitespace-nowrap">Office IoT Hub</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-full h-px bg-slate-700/50 mb-1" />

        {/* Nav Items */}
        {navItemDefs.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {/* Active background glow */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveGlow"
                  className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-15 rounded-xl`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Active left bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveDot"
                  className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b ${item.color}`}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <div className={`relative z-10 flex-shrink-0 p-1 rounded-lg transition-colors ${
                isActive ? '' : 'group-hover:bg-slate-800/50'
              }`}>
                {item.icon}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.12 }}
                    className={`relative z-10 text-xs font-semibold whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {t(item.labelKey)}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        <div className="w-full h-px bg-slate-700/50 mt-1" />

        {/* Expand hint */}
        <div className="flex justify-center pt-1">
          <motion.div
            animate={{ x: isExpanded ? 0 : [0, 3, 0] }}
            transition={isExpanded ? {} : { repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="text-slate-600"
          >
            {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
