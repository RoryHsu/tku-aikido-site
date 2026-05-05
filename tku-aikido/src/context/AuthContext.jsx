import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user) => {
    if (!user) {
      setProfile(null);
      return null;
    }

    try {
      /**
       * 正確做法：
       * 優先用 Firebase Auth UID 去讀 users/{uid}
       * 這樣每個登入者都只會讀到自己的職位。
       */
      const uidRef = doc(db, "users", user.uid);
      const uidSnap = await getDoc(uidRef);

      if (uidSnap.exists()) {
        const data = uidSnap.data();

        const userProfile = {
          id: uidSnap.id,
          uid: user.uid,
          email: user.email || data.email || "",
          name: data.name || user.displayName || "",
          role: data.role || "",
          ...data,
        };

        setProfile(userProfile);
        return userProfile;
      }

      /**
       * 舊資料兼容：
       * 如果你之前 users 文件 ID 不是 UID，
       * 這裡會用 email 找一次。
       * 找到後仍然只會取「目前登入者 email 對應的資料」。
       */
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", user.email || "")
      );

      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        const firstDoc = emailSnap.docs[0];
        const data = firstDoc.data();

        const userProfile = {
          id: firstDoc.id,
          uid: user.uid,
          email: user.email || data.email || "",
          name: data.name || user.displayName || "",
          role: data.role || "",
          ...data,
        };

        setProfile(userProfile);
        return userProfile;
      }

      /**
       * 沒有 Firestore profile 時：
       * 代表這個帳號雖然登入了，但還沒被社長授權職位。
       */
      const emptyProfile = {
        id: user.uid,
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "",
        role: "",
      };

      setProfile(emptyProfile);
      return emptyProfile;
    } catch (error) {
      console.error("fetch user profile error:", error);

      const fallbackProfile = {
        id: user.uid,
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || "",
        role: "",
      };

      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user);
      } else {
        setCurrentUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    setCurrentUser(result.user);
    await fetchUserProfile(result.user);

    return result.user;
  };

  const logout = async () => {
    await signOut(auth);

    setCurrentUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (!auth.currentUser) return null;
    return fetchUserProfile(auth.currentUser);
  };

  const value = {
    currentUser,
    profile,
    loading,
    login,
    logout,
    resetPassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}