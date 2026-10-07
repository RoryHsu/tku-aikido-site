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

    // 開發者帳號（role: "developer"）在後台擁有和社長一樣的全部功能，
    // 但不會出現在幹部名單，也不受交接影響
    const toProfile = (snapId, data) => ({
      id: snapId,
      uid: user.uid,
      email: user.email || data.email || "",
      name: data.name || user.displayName || "",
      role: data.role || "",
      ...data,
      ...(data.role === "developer" ? { role: "president", isDeveloper: true } : {}),
    });

    const emailKey = (user.email || "").toLowerCase();

    /**
     * 依序尋找這個登入者的職位資料，某一步失敗就繼續下一步：
     * 1. users/{小寫Email}：目前的格式，Firestore 規則也是用這個判斷職位
     * 2. users/{UID}：更早期的格式
     * 3. 用 email 欄位查詢：舊資料（文件 ID 是亂數）
     */
    const lookups = [
      async () => {
        if (!emailKey) return null;
        const snap = await getDoc(doc(db, "users", emailKey));
        return snap.exists() ? toProfile(snap.id, snap.data()) : null;
      },
      async () => {
        const snap = await getDoc(doc(db, "users", user.uid));
        return snap.exists() ? toProfile(snap.id, snap.data()) : null;
      },
      async () => {
        if (!user.email) return null;
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email))
        );
        return snap.empty ? null : toProfile(snap.docs[0].id, snap.docs[0].data());
      },
    ];

    for (const lookup of lookups) {
      try {
        const found = await lookup();
        if (found) {
          setProfile(found);
          return found;
        }
      } catch (error) {
        // 新規則下讀不到舊格式的資料是正常的，繼續找下一個
        console.warn("profile lookup skipped:", error?.code || error);
      }
    }

    /**
     * 都找不到：代表這個帳號雖然登入了，但還沒被社長授權職位。
     */
    const emptyProfile = {
      id: emailKey || user.uid,
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      role: "",
    };

    setProfile(emptyProfile);
    return emptyProfile;
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