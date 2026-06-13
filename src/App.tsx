import { useState, useEffect } from 'react';
import CustomerPanel from './panels/CustomerPanel';
import AdminPanel from './panels/AdminPanel';
import RiderPanel from './panels/RiderPanel';
import { User, UserRole } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const getInitialPanel = () => {
    const path = window.location.pathname;
    if (path.startsWith('/chfadmin')) return 'admin';
    if (path.startsWith('/chfrider')) return 'rider';
    return 'customer';
  };

  const [activePanel, setActivePanel] = useState<string>(getInitialPanel);
  const [isInitializing, setIsInitializing] = useState(true);

  const handleSilentCustomerLogin = async () => {
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
            name: `Guest #${Math.floor(1000 + Math.random() * 9000)}`,
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
        console.error('Silent guest register error:', err);
      } finally {
        setIsInitializing(false);
      }
    } else {
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: guestEmail, password: guestPassword })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setUser(loginData.user);
          setToken(loginData.token);
          localStorage.setItem('panda_express_token', loginData.token);
        } else {
          localStorage.removeItem('panda_guest_email');
          localStorage.removeItem('panda_guest_password');
        }
      } catch (err) {
        console.error('Silent guest login error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/chfadmin')) setActivePanel('admin');
      else if (path.startsWith('/chfrider')) setActivePanel('rider');
      else setActivePanel('customer');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (activePanel === 'admin' && !path.startsWith('/chfadmin')) {
      window.history.pushState({}, '', '/chfadmin');
    } else if (activePanel === 'rider' && !path.startsWith('/chfrider')) {
      window.history.pushState({}, '', '/chfrider');
    } else if (activePanel === 'customer' && path !== '/' && path !== '') {
      window.history.pushState({}, '', '/');
    }
  }, [activePanel]);

  useEffect(() => {
    const path = window.location.pathname;
    const isAdminPath = path.startsWith('/chfadmin');
    const isRiderPath = path.startsWith('/chfrider');
    const isCustomerPath = !isAdminPath && !isRiderPath;

    const storedToken = localStorage.getItem('panda_express_token');

    // Admin or Rider path — don't touch customer token
    if (isAdminPath || isRiderPath) {
      // Check if there's a separate admin/rider token
      const staffToken = localStorage.getItem('chfpoint_staff_token');
      if (!staffToken) {
        setIsInitializing(false);
        return;
      }
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then(data => {
          if ((isAdminPath && data.role === 'admin') || (isRiderPath && data.role === 'rider')) {
            setUser(data);
            setToken(staffToken);
            setActivePanel(isAdminPath ? 'admin' : 'rider');
          } else {
            localStorage.removeItem('chfpoint_staff_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('chfpoint_staff_token');
        })
        .finally(() => setIsInitializing(false));
      return;
    }

    // Customer path
    if (!storedToken) {
      handleSilentCustomerLogin();
      return;
    }

    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${storedToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Token expired');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setToken(storedToken);
        setActivePanel('customer');
      })
      .catch(() => {
        localStorage.removeItem('panda_express_token');
        setToken(null);
        setUser(null);
        handleSilentCustomerLogin();
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    if (loggedInUser.role === 'admin' || loggedInUser.role === 'rider') {
      // Save staff token separately — customer token untouched
      localStorage.setItem('chfpoint_staff_token', sessionToken);
      setActivePanel(loggedInUser.role === 'admin' ? 'admin' : 'rider');
    } else {
      localStorage.setItem('panda_express_token', sessionToken);
      setActivePanel('customer');
    }
  };

  const handleLogout = () => {
    const path = window.location.pathname;
    const isAdminPath = path.startsWith('/chfadmin');
    const isRiderPath = path.startsWith('/chfrider');

    if (isAdminPath || isRiderPath) {
      // Only clear staff token — customer session safe!
      localStorage.removeItem('chfpoint_staff_token');
      setUser(null);
      setToken(null);
      setActivePanel(isAdminPath ? 'admin' : 'rider');
    } else {
      localStorage.removeItem('panda_express_token');
      setUser(null);
      setToken(null);
      setActivePanel('customer');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent shadow-md"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-extrabold text-lg flex items-center gap-2">
            <span className="bg-brand-primary text-white p-1 rounded-lg">🍔</span>
            <span>CHF Point</span>
          </span>
          <span className="text-xs text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
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