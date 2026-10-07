import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

// 只用 where 查詢、在瀏覽器排序，這樣不需要在 Firestore 另外建立複合索引
export async function fetchPublishedEvents() {
  const q = query(collection(db, "events"), where("published", "==", true));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}
