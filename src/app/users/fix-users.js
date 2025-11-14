// pages/admin/fix-users.js
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function FixUsers() {
  const [fixing, setFixing] = useState(false);

  const fixUserFields = async () => {
    setFixing(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const updates = [];

      usersSnapshot.docs.forEach((userDoc) => {
        const data = userDoc.data();
        const updatesNeeded = {};

        // Add missing fields
        if (data.profileActive === undefined) {
          updatesNeeded.profileActive = true;
        }
        if (data.verified === undefined) {
          updatesNeeded.verified = true;
        }
        if (data.lastUpdated === undefined) {
          updatesNeeded.lastUpdated = new Date();
        }
        if (data.userType === undefined) {
          updatesNeeded.userType = "provider";
        }

        if (Object.keys(updatesNeeded).length > 0) {
          updates.push(updateDoc(doc(db, "users", userDoc.id), updatesNeeded));
        }
      });

      await Promise.all(updates);
      alert(`Updated ${updates.length} users successfully!`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fix User Fields</h1>
      <button
        onClick={fixUserFields}
        disabled={fixing}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {fixing ? "Fixing Users..." : "Fix Missing User Fields"}
      </button>
    </div>
  );
}
