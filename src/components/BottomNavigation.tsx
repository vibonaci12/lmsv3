import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconHome,
  IconBook,
  IconClipboardList,
  IconTrophy,
  IconUser,
  IconNews
} from '@tabler/icons-react';

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

const studentNavItems: NavItem[] = [
  { icon: IconHome, label: 'Dashboard', path: '/student/dashboard' },
  { icon: IconBook, label: 'Kelas & Tugas', path: '/student/classroom' },
  { icon: IconTrophy, label: 'Leaderboard', path: '/student/leaderboard' },
  { icon: IconNews, label: 'Newsroom', path: '/student/newsroom' },
  { icon: IconUser, label: 'Profil', path: '/student/profile' },
];

const teacherNavItems: NavItem[] = [
  { icon: IconHome, label: 'Dashboard', path: '/teacher/dashboard' },
  { icon: IconBook, label: 'Kelas', path: '/teacher/classes' },
  { icon: IconClipboardList, label: 'Tugas', path: '/teacher/assignments' },
  { icon: IconTrophy, label: 'Leaderboard', path: '/teacher/leaderboard' },
  { icon: IconNews, label: 'Newsroom', path: '/teacher/newsroom' },
];

interface BottomNavigationProps {
  role: 'student' | 'teacher';
}

export function BottomNavigation({ role }: BottomNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = role === 'student' ? studentNavItems : teacherNavItems;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Find active index based on current path
  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, navItems]);

  const handleNavClick = (index: number, path: string) => {
    setActiveIndex(index);
    navigate(path);
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'block'
    }}>
      {/* Background with glassmorphism effect */}
      <motion.div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(229, 231, 235, 0.5)',
          borderRadius: '20px 20px 0 0'
        }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      
      {/* Navigation container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '12px 8px'
      }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavClick(index, item.path)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '60px',
                minHeight: '60px'
              }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Liquid blob background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                    }}
                    layoutId="liquidTab"
                    initial={{ 
                      opacity: 0, 
                      scale: 0.3,
                      borderRadius: "50%"
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      borderRadius: "12px",
                      transition: {
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        mass: 0.8
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.3,
                      borderRadius: "50%",
                      transition: {
                        duration: 0.3,
                        ease: "easeInOut"
                      }
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Glowing effect */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(96, 165, 250, 0.3)',
                      borderRadius: '12px',
                      filter: 'blur(4px)'
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1.2,
                      transition: {
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.8,
                      transition: { duration: 0.2 }
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon with liquid animation */}
              <motion.div
                style={{
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                animate={{
                  color: isActive ? '#ffffff' : '#6b7280',
                  scale: isActive ? 1.2 : 1,
                  rotate: isActive ? [0, -10, 10, 0] : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  rotate: {
                    duration: 0.6,
                    ease: "easeInOut"
                  }
                }}
              >
                <Icon size={22} />
              </motion.div>


              {/* Liquid ripple effect */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '12px',
                      border: '2px solid rgba(147, 197, 253, 0.5)'
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.3, 1],
                      opacity: [0, 0.4, 0],
                      transition: {
                        duration: 0.8,
                        ease: "easeOut",
                        times: [0, 0.5, 1]
                      }
                    }}
                    exit={{ 
                      scale: 0, 
                      opacity: 0,
                      transition: { duration: 0.2 }
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Floating particles effect */}
              <AnimatePresence>
                {isActive && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        style={{
                          position: 'absolute',
                          width: '4px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.6)',
                          borderRadius: '50%'
                        }}
                        initial={{ 
                          scale: 0, 
                          opacity: 0,
                          x: 0,
                          y: 0
                        }}
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          x: Math.cos(i * 120 * Math.PI / 180) * 20,
                          y: Math.sin(i * 120 * Math.PI / 180) * 20,
                          transition: {
                            duration: 1.2,
                            delay: i * 0.1,
                            ease: "easeOut"
                          }
                        }}
                        exit={{ 
                          scale: 0, 
                          opacity: 0,
                          transition: { duration: 0.2 }
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Bottom safe area for devices with home indicator */}
      <div style={{
        height: '8px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)'
      }} />
    </div>
  );
}
