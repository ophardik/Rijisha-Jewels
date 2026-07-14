import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]); // product ids
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then(({ user }) => {
        setUser(user);
        setWishlist(user.wishlist || []);
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setToken(token);
    setUser(user);
    setWishlist(user.wishlist || []);
    return user;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const { token, user } = await api('/auth/admin/login', { method: 'POST', body: { email, password } });
    setToken(token);
    setUser(user);
    setWishlist(user.wishlist || []);
    return user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user } = await api('/auth/register', { method: 'POST', body: { name, email, password } });
    setToken(token);
    setUser(user);
    setWishlist(user.wishlist || []);
    return user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setWishlist([]);
  }, []);

  const toggleWishlist = useCallback(async (productId) => {
    const { wishlist, added } = await api(`/wishlist/${productId}`, { method: 'POST' });
    setWishlist(wishlist);
    return added;
  }, []);

  return (
    <AuthContext.Provider value={{ user, wishlist, loading, login, adminLogin, register, logout, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
