import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Supabase auth user
  const [profile, setProfile] = useState(null);   // { id, role, company_id, full_name }
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  /* Fetch profile row after auth */
  const fetchProfile = async (userId) => {
    const { data, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileErr) {
      console.error('[Auth] Profile fetch error:', profileErr.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
  };

  /* Bootstrap: check existing session */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    /* Listen to auth changes */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /* Sign in with email + password */
  const signIn = async (email, password) => {
    setError('');
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return false;
    }
    setUser(data.user);
    await fetchProfile(data.user.id);
    return true;
  };

  /* Sign out */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = { user, profile, loading, error, signIn, signOut, setError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
