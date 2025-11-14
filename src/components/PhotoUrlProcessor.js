// components/PhotoUrlProcessor.js
import { useState } from "react";
import { createPhotoObject } from "../lib/imageUtils";

export default function PhotoUrlProcessor({ onPhotosProcessed }) {
  const [photoUrls, setPhotoUrls] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const processPhotoUrls = async () => {
    if (!photoUrls.trim()) return;

    setIsProcessing(true);
    try {
      const urls = photoUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.startsWith("http"));

      const photos = [];
      for (let i = 0; i < urls.length; i++) {
        const photo = await createPhotoObject(urls[i], i);
        photos.push(photo);
      }

      onPhotosProcessed(photos);
      alert(`Processed ${photos.length} photos successfully`);
    } catch (error) {
      alert(`Error processing photos: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Process Photo URLs</h3>
      <textarea
        value={photoUrls}
        onChange={(e) => setPhotoUrls(e.target.value)}
        placeholder="Enter photo URLs (one per line):
https://example.com/photo1.jpg
https://example.com/photo2.jpg
https://example.com/photo3.jpg"
        rows={6}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={processPhotoUrls}
        disabled={isProcessing}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Process Photos"}
      </button>
    </div>
  );
}
