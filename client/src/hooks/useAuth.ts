import { useCallback, useEffect, useMemo, useState } from "react";
import { login, register } from "../lib/api";

type User = { id: string; email: string; role: string };

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const authed = useMemo(() => Boolean(token), [token]);

  const doRegister = useCallback(async (email: string, password: string) => {
    const res = await register(email, password);
    const nextToken = res.data?.data?.token as string;
    const nextUser = res.data?.data?.user as User;
    setToken(nextToken);
    setUser(nextUser);
    return { token: nextToken, user: nextUser };
  }, []);

  const doLogin = useCallback(async (email: string, password: string) => {
    const res = await login(email, password);
    const nextToken = res.data?.data?.token as string;
    const nextUser = res.data?.data?.user as User;
    setToken(nextToken);
    setUser(nextUser);
    return { token: nextToken, user: nextUser };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return { authed, token, user, register: doRegister, login: doLogin, logout };
}

