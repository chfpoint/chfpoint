import { useState, useEffect } from 'react';
import CustomerPanel from './panels/CustomerPanel';
import AdminPanel from './panels/AdminPanel';
import RiderPanel from './panels/RiderPanel';
import { User, UserRole } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('panda_express_token'));
  
  // Decides which dashboard panel to render currently based on path
  const [activePanel, setActivePanel] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      return 'admin';
    } else if (path.startsWith('/rider')) {
      return 'rider';
    }
    return 'customer';
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Silent Customer Login Flow for public homepage visitors ONLY
  const handleSilentCustomerLogin = async () => {
    // Don't auto-login on admin or rider paths
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/rider')) {
      setIsInitializing(false);
      return;
    }
    let guestEmail = localStorage.getItem('panda_guest_email');
    let guestPassword = localStorage.getItem('panda_guest_password') || 'guest123';

    if (!guestEmail) {
      guestEmail = `guest_${Math.random().toString(36).substring(2, 9)}@pandaexpress.com`;
      localStorage.setItem('panda_guest_email', guestEmail);
      localStorage.setItem('panda_guest_password', guestPassword);

      try {
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: guestEmail,
            password: guestPassword,
            name: `Panda Guest #${Math.floor(1000 + Math.random() * 9000)}`,
            phone: '01712345678',
            address: 'Dhaka, Bangladesh',
            role: 'customer'
          })
        });
        if (regRes.ok) {
          const regData = await regRes.json();
          setUser(regData.user);
          setToken(regData.token);
          localStorage.setItem('panda_express_token', regData.token);
        }
      } catch (err) {
        console.error('Silent guest customer register error:', err);
      } finally {
        setIsInitializing(false);
      }
    } else {
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: guestEmail,
            password: guestPassword
          })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setUser(loginData.user);
          setToken(loginData.token);
          localStorage.setItem('panda_express_token', loginData.token);
        } else {
          localStorage.removeItem('panda_guest_email');
          handleSilentCustomerLogin();
          return;
        }
      } catch (err) {
        console.error('Silent guest customer login error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
  };

  // Synchronize path state on popstate events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setActivePanel('admin');
      } else if (path.startsWith('/rider')) {
        setActivePanel('rider');
      } else {
        setActivePanel('customer');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize URL and panel updates
  useEffect(() => {
    const path = window.location.pathname;
    if (activePanel === 'admin') {
      if (!path.startsWith('/admin')) {
        window.history.pushState({}, '', '/admin/login');
      }
    } else if (activePanel === 'rider') {
      if (!path.startsWith('/rider')) {
        window.history.pushState({}, '', '/rider/login');
      }
    } else {
      if (path !== '/' && path !== '') {
        window.history.pushState({}, '', '/');
      }
    }
  }, [activePanel]);

  // Auto-authenticate profile on mount if token is stored in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('panda_express_token');
    const path = window.location.pathname;
    const isCustomerPath = !path.startsWith('/admin') && !path.startsWith('/rider');

    if (!storedToken) {
      if (isCustomerPath) {
        handleSilentCustomerLogin();
      } else {
        setIsInitializing(false);
      }
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${storedToken}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token verification failed');
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setToken(storedToken);
        // Automatic routing based on user's authorized role!
        if (data.role === 'admin') {
          setActivePanel('admin');
        } else if (data.role === 'rider') {
          setActivePanel('rider');
        } else {
          setActivePanel('customer');
        }
      })
      .catch((err) => {
        console.warn('Profile sync session expired:', err);
        localStorage.removeItem('panda_express_token');
        setToken(null);
        setUser(null);
        if (isCustomerPath) {
          handleSilentCustomerLogin();
        } else {
          setActivePanel(path.startsWith('/admin') ? 'admin' : path.startsWith('/rider') ? 'rider' : 'customer');
          setIsInitializing(false);
        }
      })
      .finally(() => {
        if (storedToken) {
          setIsInitializing(false);
        }
      });
  }, []);

  // Sync token authentication changes
  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    localStorage.setItem('panda_express_token', sessionToken);

    // Auto navigate based on account roles
    if (loggedInUser.role === 'admin') {
      setActivePanel('admin');
    } else if (loggedInUser.role === 'rider') {
      setActivePanel('rider');
    } else {
      setActivePanel('customer');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('panda_express_token');
    setActivePanel('customer');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent shadow-md"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-extrabold text-lg flex items-center gap-2">
            <span className="bg-brand-primary text-white p-1 rounded-lg">🐼</span>
            <span>pandaExpress</span>
          </span>
          <span className="text-xs text-gray-400">Loading delivery networks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* Dynamic Pane Switcher rendering */}
      {activePanel === 'admin' ? (
        <AdminPanel 
          user={user}
          token={token}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onSwitchPanel={setActivePanel}
        />
      ) : activePanel === 'rider' ? (
        <RiderPanel 
          user={user}
          token={token}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onSwitchPanel={setActivePanel}
        />
      ) : (
        <CustomerPanel 
          user={user}
          token={token}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onSwitchPanel={setActivePanel}
        />
      )}
    </div>
  );
}