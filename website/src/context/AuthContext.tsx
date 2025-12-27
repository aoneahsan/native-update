import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  emailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  emailVerified: false
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const emailVerified = user?.emailVerified || user?.providerData[0]?.providerId === 'google.com';

  return (
    <AuthContext.Provider value={{ user, loading, emailVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
