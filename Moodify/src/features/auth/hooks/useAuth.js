import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { getMe, login, logout, register } from "../services/auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;

  async function runAction(action) {
    setLoading(true);
    try {
      return await action();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister({ username, email, password }) {
    const data = await runAction(() => register({ username, email, password }));
    setUser(data.user);
    return data;
  }

  async function handleLogin({ username, email, password }) {
    const data = await runAction(() => login({ username, email, password }));
    setUser(data.user);
    return data;
  }

  async function handleGetMe() {
    const data = await runAction(() => getMe());
    setUser(data.user);
    return data;
  }

  async function handleLogout() {
    const data = await runAction(() => logout());
    setUser(null);
    return data;
  }

  return { user, loading, handleGetMe, handleLogin, handleLogout, handleRegister };
};

