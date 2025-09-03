import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dashboard, Feedback, Assignment, Assessment, Logout, Menu as MenuIcon, Settings, MailOutline, ShieldMoon } from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Person from '@mui/icons-material/Person';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [userDoc, setUserDoc] = React.useState(null);

  React.useEffect(() => {
    const fetchUserDoc = async () => {
      if (userProfile?.email) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userProfile.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserDoc(querySnapshot.docs[0].data());
        } else {
          setUserDoc(null);
        }
      }
    };
    if (profileOpen) fetchUserDoc();
  }, [profileOpen, userProfile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Reports', icon: <Assessment />, path: '/reports' },
    { text: 'Feedback', icon: <Feedback />, path: '/feedback' },
    ...(userProfile?.role === 'admin' 
      ? [
          { text: 'Control Access', icon: <ShieldMoon />, path: '/control-access' },
          { text: 'Email Responses', icon: <MailOutline />, path: '/email-responses' }
        ]
      : []
    )
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Sidebar */}
      <aside className="hidden sm:flex flex-col w-64 bg-sidebar rounded-r-3xl shadow-card p-6 pt-8 min-h-screen sticky top-0 z-30">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wide text-accent">FieldConnect</span>
          <button
            className="ml-4 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg hover:bg-accent/30 transition"
            onClick={() => setProfileOpen(true)}
            title="Profile"
          >
            <Person style={{ fontSize: 32 }} />
          </button>
          <Dialog open={profileOpen} onClose={() => setProfileOpen(false)}>
            <DialogTitle>Profile</DialogTitle>
            <DialogContent>
              <div className="flex flex-col gap-2 min-w-[260px]">
                <div className="text-base font-semibold">Name: {userDoc?.name || userProfile?.displayName || '-'}</div>
                <div className="text-base">Email: {userDoc?.email || userProfile?.email || '-'}</div>
                <div className="text-base">Role: {userDoc?.designation || userProfile?.role || '-'}</div>
              </div>
            </DialogContent>
            <DialogActions>
              <button
                className="px-4 py-2 rounded bg-accent text-white font-semibold hover:bg-accent2 transition"
                onClick={async () => { await handleLogout(); setProfileOpen(false); }}
              >
                <span className="align-middle"><Logout fontSize="small" /></span> Logout
              </button>
            </DialogActions>
          </Dialog>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.text}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-lg font-semibold
                    ${location.pathname === item.path
                      ? 'bg-accent text-white shadow-soft'
                      : 'text-white hover:bg-accent/20 hover:text-accent'}
                  `}
                  onClick={() => navigate(item.path)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 min-h-screen px-2 sm:px-8 py-6 bg-background">
        {children}
      </main>
    </div>
  );
};

export default Layout;
