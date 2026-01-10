// contexts/AuthContext.tsx
"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ApiConfigService } from "@/services/apiConfig"

const SESSION_TIMEOUT = 30 * 60 * 1000
const MAX_FAILED_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000

type User = {
  username: string
  persid: string | null
  display: string | null
  ismanager: number
  office: string | null
  managerid: string | null
  subFirm: string | null
  subFirmid: string | null
  userprofile: 'GELISTIRME' | 'WEB' | null
  dbName?:  string
  dbPort?: number
  apiBaseUrl?: string
}

type FailedAttempt = {
  username: string
  attempts: number
  lastAttempt: number
  blockedUntil: number | null
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login:  (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  userRole: 'GELISTIRME' | 'WEB' | null
  failedAttempts: FailedAttempt[]
  clearFailedAttempts: (username: string) => void
  getRemainingTime: (username: string) => number | null
  getRemainingAttempts: (username: string) => number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children:  React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([])
  const activityTimerRef = useRef<number | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const renewRef = useRef<() => void>()
  const visibilityRef = useRef<() => void>()

  const userRole = user?.userprofile || null

  useEffect(() => {
    try {
      const stored = localStorage.getItem("failedLoginAttempts")
      if (stored) setFailedAttempts(JSON. parse(stored))
    } catch (e) {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("failedLoginAttempts", JSON.stringify(failedAttempts))
    } catch (e) {
      // Silently fail
    }
  }, [failedAttempts])

  const getRemainingTime = (username: string): number | null => {
    const attempt = failedAttempts.find(a => a.username === username)
    if (!attempt || !attempt.blockedUntil) return null
    const remaining = attempt.blockedUntil - Date.now()
    return remaining > 0 ? remaining : null
  }

  const getRemainingAttempts = (username: string): number => {
    const attempt = failedAttempts.find(a => a.username === username)
    if (!attempt) return MAX_FAILED_ATTEMPTS
    return Math.max(0, MAX_FAILED_ATTEMPTS - attempt.attempts)
  }

  const clearFailedAttempts = (username: string) => {
    setFailedAttempts(prev => prev.filter(a => a.username !== username))
  }

  const addFailedAttempt = (username: string) => {
    setFailedAttempts(prev => {
      const existing = prev.find(a => a.username === username)
      if (existing) {
        const newAttempts = existing.attempts + 1
        const blockedUntil = newAttempts >= MAX_FAILED_ATTEMPTS
          ? Date.now() + BLOCK_DURATION
          : null
        return prev.map(a =>
          a.username === username
            ? { ...a, attempts: newAttempts, lastAttempt: Date.now(), blockedUntil }
            : a
        )
      } else {
        const blockedUntil = 1 >= MAX_FAILED_ATTEMPTS ?  Date.now() + BLOCK_DURATION : null
        return [... prev, { username, attempts: 1, lastAttempt: Date.now(), blockedUntil }]
      }
    })
  }

  const resetFailedAttempts = (username: string) => clearFailedAttempts(username)

  const isUserBlocked = (username: string): boolean => {
    const attempt = failedAttempts.find(a => a.username === username)
    if (!attempt || !attempt.blockedUntil) return false
    const remaining = attempt.blockedUntil - Date.now()
    return remaining > 0
  }

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        const stored = localStorage.getItem("authUser")
        const expires = localStorage.getItem("authExpires")
        
        if (stored && expires && Date.now() < Number(expires)) {
          const userData = JSON.parse(stored) as User
          setUser(userData)
          
          if (userData.dbName && userData.apiBaseUrl) {
            ApiConfigService.setGlobalApiInfo({
              dbName: userData.dbName,
              dbPort: userData.dbPort || 3159,
              apiBaseUrl: userData.apiBaseUrl,
              userProfile: userData.userprofile || 'WEB',
              username: userData.username
            });
          }

          if (userData?. userprofile) {
            const currentPath = window.location.pathname;
            if (userData.userprofile === "GELISTIRME" && currentPath. startsWith("/mobile-app")) {
              router.replace("/dashboard");
            } else if (userData. userprofile === "WEB" && currentPath.startsWith("/dashboard")) {
              router.replace("/mobile-app");
            }
          }
          
          setupActivityRenew();
        } else {
          clearSession();
        }
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    if (isLoggingIn) {
      throw new Error("Giriş işlemi zaten devam ediyor.  Lütfen bekleyin.");
    }
    
    setIsLoggingIn(true);

    try {
      if (isUserBlocked(username)) {
        const remainingTime = getRemainingTime(username);
        if (remainingTime) {
          const minutes = Math.ceil(remainingTime / (60 * 1000));
          throw new Error(`Hesabınız ${minutes} dakika süreyle bloke edilmiştir. `);
        }
      }

      // 1. ADIM: User Lookup - Kullanıcı bilgilerini al
      const userLookupResponse = await fetch('/api/auth/user-lookup', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON. stringify({ username }),
        signal: AbortSignal.timeout(10000)
      });

      if (!userLookupResponse.ok) {
        const errorData = await userLookupResponse.json().catch(() => ({}));
        throw new Error(errorData. message || "Kullanıcı bilgileri alınamadı.");
      }

      const lookupData = await userLookupResponse.json();
      
      if (!lookupData.success) {
        throw new Error(lookupData.message || "Kullanıcı bulunamadı.");
      }

      const userDataFromApi = lookupData.user || lookupData;
      
      const dbName = userDataFromApi.dbName || lookupData.dbName;
      const dbPort = userDataFromApi.dbPort || lookupData. dbPort || 3159;
      const userProfile = userDataFromApi.userProfile || userDataFromApi.userprofile || 'WEB';
      const apiBaseUrl = lookupData.apiBaseUrl || `http://ik.hominum.info:${dbPort}`;

      if (!dbName) {
        throw new Error("Veritabanı adı bulunamadı.");
      }

      // 2. ADIM: Login - Kendi API route'umuza istek at (dbName ve dbPort ile)
      const authResponse = await fetch('/api/auth/login', {
        method: "POST",
        headers: { "Content-Type":  "application/json" },
        body: JSON.stringify({ 
          username, 
          password,
          dbPort,   // Dinamik port
          dbName    // Veritabanı adı - fallback için gerekli
        }),
        signal: AbortSignal.timeout(20000)
      });

      let authData:  any;
      try {
        authData = await authResponse.json();
      } catch {
        authData = null;
      }

      if (! authResponse.ok) {
        if (authResponse.status === 401) {
          throw new Error("Şifre hatalı.  Lütfen tekrar deneyin.");
        }
        
        if (authResponse.status === 404) {
          throw new Error("Kullanıcı bulunamadı.");
        }
        
        if (authResponse.status === 500) {
          throw new Error("Sunucu hatası.  Lütfen daha sonra tekrar deneyin.");
        }

        if (authResponse.status === 503) {
          throw new Error("API sunucusuna bağlanılamadı. Lütfen tekrar deneyin.");
        }
        
        throw new Error(authData?. message || `Giriş hatası (${authResponse.status}). Lütfen tekrar deneyin.`);
      }

      // Route'tan gelen yanıtı kontrol et
      if (authData?.success !== true) {
        throw new Error(authData?.message || "Giriş başarısız.  Lütfen tekrar deneyin.");
      }

      ApiConfigService.setGlobalApiInfo({
        dbName,
        dbPort,
        apiBaseUrl,
        userProfile,
        username
      });

      // Route'tan gelen user objesini kullan
      const userData:  User = {
        username:  authData?. user?.username ??  username,
        persid: authData?.user?.sicil ?? null,
        display:  authData?.user?.displayName ??  username,
        ismanager: 0,
        office: null,
        managerid: null,
        subFirm:  null,
        subFirmid: null,
        userprofile: userProfile as 'GELISTIRME' | 'WEB' | null,
        dbName,
        dbPort,
        apiBaseUrl
      };

      const expiresAt = Date.now() + SESSION_TIMEOUT;
      localStorage.setItem("authUser", JSON.stringify(userData));
      localStorage.setItem("authExpires", expiresAt.toString());

      setUser(userData);
      resetFailedAttempts(username);
      setupActivityRenew();

      if (userProfile === "WEB") {
        router.push("/mobile-app");
      } else {
        router.push("/dashboard");
      }

    } catch (err:  any) {
      const errorMessage = err?. message || '';
      const isPasswordError = 
        errorMessage.toLowerCase().includes('şifre') ||
        errorMessage.toLowerCase().includes('password');
      
      if (isPasswordError) {
        addFailedAttempt(username);
      }
      
      const remaining = getRemainingAttempts(username);
      if (remaining <= 0) {
        const remainingTime = getRemainingTime(username);
        const minutes = remainingTime ? Math.ceil(remainingTime / (60 * 1000)) : 15;
        throw new Error(`Çok fazla hatalı deneme.  Hesabınız ${minutes} dakika bloke. `);
      }
      
      if (err?. name === 'AbortError' || errorMessage.includes('timeout')) {
        throw new Error("İstek zaman aşımı. Lütfen tekrar deneyin.");
      }
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new Error("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.");
      }
      
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }

  const logout = async () => {
    setIsLoading(true);
    clearSession();
    try { 
      router.replace("/"); 
    } catch { 
      window.location.href = "/"; 
    } finally { 
      setIsLoading(false); 
    }
    return Promise.resolve();
  }

  const clearSession = () => {
    try {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authExpires");
      localStorage.removeItem("globalApiInfo");
      localStorage.removeItem("failedLoginAttempts");
    } catch {}
    setUser(null);
    ApiConfigService.clearApiInfo();
    removeActivityRenew();
  }

  const setupActivityRenew = () => {
    removeActivityRenew();

    const renew = () => {
      try {
        const newExp = Date.now() + SESSION_TIMEOUT;
        localStorage.setItem("authExpires", newExp.toString());
      } catch {}
    }

    renewRef.current = renew;

    const visibilityHandler = () => {
      if (document.visibilityState === "visible") renew();
    }

    visibilityRef.current = visibilityHandler;

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, renew as EventListener));
    document.addEventListener("visibilitychange", visibilityHandler);

    activityTimerRef.current = window.setInterval(() => {
      const expires = localStorage.getItem("authExpires");
      if (!expires || Date.now() > Number(expires)) {
        logout().catch(() => {});
      }
    }, 30_000);
  }

  const removeActivityRenew = () => {
    const renew = renewRef.current;
    const visibilityHandler = visibilityRef.current;

    if (renew) {
      const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
      events.forEach(e => window. removeEventListener(e, renew as EventListener));
      renewRef.current = undefined;
    }

    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityRef.current = undefined;
    }

    if (activityTimerRef.current) {
      clearInterval(activityTimerRef. current);
      activityTimerRef.current = null;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      userRole,
      failedAttempts,
      clearFailedAttempts,
      getRemainingTime,
      getRemainingAttempts,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth AuthProvider içinde kullanılmalı")
  return ctx
}