// Firebase Authentication Context for Next.js
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  getAuth,
} from "firebase/auth";
import { initializeApp, getApps, getApp } from "firebase/app";
import { createProfile, getProfile, updateProfile as updateFirestoreProfile, Profile } from "@/lib/firebase";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-build-time",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-for-build-time",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id-for-build-time",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket-for-build-time",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "mock-app-id-for-build-time",
};

function getClientAuth() {
  if (typeof window === "undefined") return null;
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signup: (email: string, password: string, companyName: string, legalEntityType: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfilePhoto: (photoUrl: string) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const auth = getClientAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userProfile = await getProfile(firebaseUser.uid);
          if (userProfile?.disabled) {
            await signOut(auth);
            setUser(null);
            setProfile(null);
          } else {
            setUser(firebaseUser);
            setProfile(userProfile);
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (
    email: string,
    password: string,
    companyName: string,
    legalEntityType: string
  ) => {
    const auth = getClientAuth();
    if (!auth) throw new Error("Auth not available");

    const result = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(result.user, {
      displayName: companyName,
    });

    await createProfile(result.user.uid, {
      company_name: companyName,
      main_commodity: "Nutmeg",
      legal_entity_type: legalEntityType,
      phone_number: "",
    });

    setUser(result.user);
  };

  const login = async (email: string, password: string) => {
    const auth = getClientAuth();
    if (!auth) throw new Error("Auth not available");

    const result = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getProfile(result.user.uid);
    if (userProfile?.disabled) {
      await signOut(auth);
      throw new Error("Your account has been disabled by an administrator.");
    }
    setUser(result.user);
    setProfile(userProfile);
  };

  const logout = async () => {
    const auth = getClientAuth();
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateProfilePhoto = async (photoUrl: string) => {
    if (!user) return;
    await updateFirestoreProfile(user.uid, { photo_url: photoUrl });
    setProfile((prev) => prev ? { ...prev, photo_url: photoUrl } : prev);
  };

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!user) return null;
    try {
      const userProfile = await getProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
      }
      return userProfile;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, signup, login, logout, updateProfilePhoto, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
