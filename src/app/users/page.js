// pages/admin/bulk-create-users.js - WITH BIO SUPPORT
"use client";
import { useState } from "react";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function BulkCreateUsers() {
  const [usersData, setUsersData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Generate random phone number
  const generateRandomPhone = () => {
    const areaCode = Math.floor(Math.random() * 900 + 100);
    const prefix = Math.floor(Math.random() * 900 + 100);
    const lineNumber = Math.floor(Math.random() * 9000 + 1000);
    return `+1${areaCode}${prefix}${lineNumber}`;
  };

  // Generate random price between min and max
  const generateRandomPrice = (min = 200, max = 600) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Random age between 20-30
  const generateRandomAge = () => {
    return Math.floor(Math.random() * 11) + 20; // 20-30
  };

  // Random height
  const generateRandomHeight = () => {
    const feet = Math.floor(Math.random() * 2) + 5; // 5-6 feet
    const inches = Math.floor(Math.random() * 12); // 0-11 inches
    return `${feet}'${inches}"`;
  };

  // Random ethnicity
  const generateRandomEthnicity = () => {
    const ethnicities = [
      "Caucasian",
      "Hispanic",
      "African American",
      "Asian",
      "Mixed",
      "Middle Eastern",
      "Native American",
    ];
    return ethnicities[Math.floor(Math.random() * ethnicities.length)];
  };

  // Random hair color
  const generateRandomHairColor = () => {
    const hairColors = [
      "Blonde",
      "Brunette",
      "Black",
      "Red",
      "Auburn",
      "Brown",
    ];
    return hairColors[Math.floor(Math.random() * hairColors.length)];
  };

  // Random languages
  const generateRandomLanguages = () => {
    const languageOptions = [
      ["English"],
      ["English", "Spanish"],
      ["English", "French"],
      ["English", "German"],
      ["English", "Spanish", "French"],
      ["English", "Italian"],
      ["English", "Portuguese"],
    ];
    return languageOptions[Math.floor(Math.random() * languageOptions.length)];
  };

  // Random shoe size
  const generateRandomShoeSize = () => {
    return (Math.floor(Math.random() * 5) + 6).toString(); // 6-10
  };

  // Random body type
  const generateRandomBodyType = () => {
    const bodyTypes = ["slim", "athletic", "average", "curvy", "voluptuous"];
    return bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
  };

  // Random cup size
  const generateRandomCupSize = () => {
    const cupSizes = ["A", "B", "C", "D", "DD"];
    return cupSizes[Math.floor(Math.random() * cupSizes.length)];
  };

  // Random eye color
  const generateRandomEyeColor = () => {
    const eyeColors = ["Blue", "Brown", "Green", "Hazel", "Gray"];
    return eyeColors[Math.floor(Math.random() * eyeColors.length)];
  };

  // Generate email from display name
  const generateEmail = (displayName) => {
    const cleanName = displayName.toLowerCase().replace(/[^a-z]/g, "");
    return `${cleanName}@gmail.com`;
  };

  // Generate website from display name
  const generateWebsite = (displayName) => {
    const cleanName = displayName.toLowerCase().replace(/[^a-z]/g, "");
    return `https://www.${cleanName}.com`;
  };

  // Generate random bio if not provided
  const generateRandomBio = (displayName) => {
    const bios = [
      `Elegant and sophisticated companion ${displayName} offering discreet encounters with a focus on mutual respect and genuine connection.`,
      `Professional model ${displayName} with years of experience in providing premium companionship services in a safe and comfortable environment.`,
      `Charming and intelligent companion ${displayName} specializing in creating memorable experiences for discerning gentlemen.`,
      `Beautiful and charismatic ${displayName} offering exclusive companionship with an emphasis on discretion and luxury.`,
      `Stunning professional ${displayName} providing elite companionship services for those who appreciate beauty, intelligence, and sophistication.`,
      `Luxury companion ${displayName} offering unforgettable experiences with an emphasis on connection, discretion, and mutual enjoyment.`,
      `Sophisticated and elegant ${displayName} specializing in premium companionship for gentlemen who value quality and discretion.`,
    ];
    return bios[Math.floor(Math.random() * bios.length)];
  };

  // Parse the bulk data input - WITH BIO SUPPORT
  const parseUserData = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const users = [];

    let currentUser = {};

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === "---") {
        if (Object.keys(currentUser).length > 0) {
          users.push(currentUser);
          currentUser = {};
        }
        continue;
      }

      const separatorIndex = trimmedLine.indexOf(":");
      if (separatorIndex === -1) continue;

      const key = trimmedLine.slice(0, separatorIndex).trim();
      let value = trimmedLine.slice(separatorIndex + 1).trim();

      // Parse the essential fields including bio
      switch (key) {
        case "age":
          currentUser[key] = parseInt(value) || generateRandomAge();
          break;
        case "incallPrice":
        case "outcallPrice":
          currentUser[key] = parseInt(value) || generateRandomPrice();
          break;
        case "photos":
          currentUser[key] = parsePhotos(value);
          break;
        case "bio":
          // Keep the custom bio if provided
          currentUser[key] = value;
          break;
        default:
          currentUser[key] = value;
      }
    }

    if (Object.keys(currentUser).length > 0) {
      users.push(currentUser);
    }

    return users;
  };

  // Parse availability to match existing format
  const parseAvailability = (value) => {
    if (typeof value === "object" && !Array.isArray(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      const availabilityObj = {};
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      days.forEach((day) => {
        availabilityObj[day] = {
          available: value.some((availDay) =>
            availDay.toLowerCase().includes(day.toLowerCase())
          ),
        };
      });

      return availabilityObj;
    }

    if (typeof value === "string") {
      const daysArray = value.split(",").map((day) => day.trim().toLowerCase());
      const availabilityObj = {};
      const allDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];

      allDays.forEach((day) => {
        availabilityObj[day] = {
          available: daysArray.some((availDay) =>
            availDay.includes(day.toLowerCase())
          ),
        };
      });

      return availabilityObj;
    }

    // Default: all days available
    return {
      monday: { available: true },
      tuesday: { available: true },
      wednesday: { available: true },
      thursday: { available: true },
      friday: { available: true },
      saturday: { available: true },
      sunday: { available: true },
    };
  };

  // Photo parsing function
  const parsePhotos = (value) => {
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      try {
        const cleanedValue = value
          .replace(/\n/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const parsed = JSON.parse(cleanedValue);

        if (Array.isArray(parsed)) {
          return parsed.map((item, index) => {
            if (typeof item === "string") {
              return createPhotoObject(item, index);
            } else {
              return {
                url: item.url || "",
                display_url: item.display_url || item.url || "",
                storage: item.storage || "external",
                size: item.size || 0,
                width: item.width || 0,
                height: item.height || 0,
                uploadedAt: item.uploadedAt || new Date().toISOString(),
                order: item.order !== undefined ? item.order : index,
              };
            }
          });
        }
      } catch (error) {
        // JSON parse failed, try URL extraction
      }

      const urlRegex = /https?:\/\/[^\s,\[\]']+/g;
      const urls = value.match(urlRegex);

      if (urls && urls.length > 0) {
        return urls.map((url, index) => createPhotoObject(url, index));
      }

      if (value.trim()) {
        return [createPhotoObject(value.trim(), 0)];
      }
    }

    return [];
  };

  // Helper to create photo object
  const createPhotoObject = (url, order) => {
    return {
      url: url,
      display_url: url,
      storage: "external",
      size: 0,
      width: 0,
      height: 0,
      uploadedAt: new Date().toISOString(),
      order: order,
    };
  };

  // Function to create searchable location
  const createSearchableLocation = (location) => {
    if (!location) return "";
    return location.toLowerCase().replace(/\s+/g, "");
  };

  const createUsers = async () => {
    if (!usersData.trim()) {
      alert("Please enter user data");
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const parsedUsers = parseUserData(usersData);
      const newResults = [];

      for (let i = 0; i < parsedUsers.length; i++) {
        const user = parsedUsers[i];

        try {
          // Auto-generate all fields from just name, photos, location, and optional bio
          const displayName = user.displayName || "Unknown";

          const userData = {
            // Basic info (auto-generated)
            userType: "provider",
            displayName: displayName,
            email: user.email || generateEmail(displayName),
            // Use custom bio if provided, otherwise generate random one
            bio: user.bio || generateRandomBio(displayName),

            // Location (from input)
            location: user.location || "Houston, TX, US",
            searchableLocation: createSearchableLocation(user.location),

            // Physical attributes (auto-generated)
            gender: "female",
            age: user.age || generateRandomAge(),
            bodyType: generateRandomBodyType(),
            height: generateRandomHeight(),
            ethnicity: generateRandomEthnicity(),
            cupSize: generateRandomCupSize(),
            hairColor: generateRandomHairColor(),
            shoeSize: generateRandomShoeSize(),
            eyeColor: generateRandomEyeColor(),

            // Services & preferences (auto-generated)
            catersTo: ["men", "women"],
            languages: generateRandomLanguages(),
            availability: parseAvailability(user.availability),
            services: ["incall", "outcall"],

            // Pricing (auto-generated)
            incallPrice: user.incallPrice || generateRandomPrice(),
            outcallPrice: user.outcallPrice || generateRandomPrice(250, 700),

            // Contact (auto-generated)
            website: user.website || generateWebsite(displayName),
            phone: generateRandomPhone(),
            contactPhone: generateRandomPhone(),

            // Status flags
            profileActive: true,
            verified: true,
            profileComplete: true,
            agreeToTerms: true,

            // Timestamps
            createdAt: new Date(),
            lastActive: new Date(),
            lastUpdated: new Date(),

            // Photos (from input)
            photos: user.photos || [],

            // Additional fields
            status: "active",
            isOnline: Math.random() > 0.5,
            rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
            reviewCount: Math.floor(Math.random() * 50),
          };

          // Remove empty fields
          Object.keys(userData).forEach((key) => {
            if (
              userData[key] === "" ||
              userData[key] === null ||
              userData[key] === undefined ||
              (Array.isArray(userData[key]) && userData[key].length === 0)
            ) {
              delete userData[key];
            }
          });

          // Create user document
          const userId = `user_${Date.now()}_${i}`;
          await setDoc(doc(db, "users", userId), userData);

          newResults.push(
            `✅ ${displayName} | ${userData.location} | Age: ${
              userData.age
            } | $${userData.incallPrice} | ${
              userData.photos?.length || 0
            } photos`
          );
        } catch (error) {
          newResults.push(
            `❌ Error creating ${user.displayName}: ${error.message}`
          );
        }
      }

      setResults(newResults);
      alert(`Successfully created ${parsedUsers.length} users!`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data with optional bios
  const loadSampleData = () => {
    const sampleData = `displayName: Sophie Müller
location: Düsseldorf Government Region, North Rhine-Westphalia, Germany
bio: Elegant and sophisticated companion from Düsseldorf with a passion for art and culture. Fluent in German and English, offering discreet encounters for discerning gentlemen.
photos: https://example.com/sophie1.jpg, https://example.com/sophie2.jpg
---
displayName: Jessica Smith
location: Houston, TX, US
bio: Professional model and companion with 5 years of experience. Specializing in creating memorable experiences with an emphasis on mutual respect and genuine connection.
photos: https://example.com/jessica1.jpg, https://example.com/jessica2.jpg
---
displayName: Maria Garcia
location: Miami, FL, US
photos: https://example.com/maria1.jpg
---
displayName: Chloe Williams  
location: Berlin, Berlin, Germany
bio: Charming and intelligent Berlin-based companion offering exclusive experiences in the heart of Germany's vibrant capital city.
photos: https://example.com/chloe1.jpg, https://example.com/chloe2.jpg
---
displayName: Emma Johnson
location: Munich, Bavaria, Germany
photos: https://example.com/emma1.jpg`;

    setUsersData(sampleData);
  };

  // Quick location buttons
  const quickLocations = [
    "Houston, TX, US",
    "Düsseldorf Government Region, North Rhine-Westphalia, Germany",
    "Berlin, Berlin, Germany",
    "Munich, Bavaria, Germany",
    "Hamburg, Hamburg, Germany",
    "Miami, FL, US",
    "Los Angeles, CA, US",
    "New York, NY, US",
  ];

  const addLocationToData = (location) => {
    setUsersData((prev) => prev + `location: ${location}\n`);
  };

  // Photo URL formatter
  const formatPhotoUrls = () => {
    const urls = prompt("Enter photo URLs (one per line or comma separated):");
    if (urls) {
      const urlList = urls
        .split(/[\n,]/)
        .map((url) => url.trim())
        .filter((url) => url.startsWith("http"));

      if (urlList.length > 0) {
        const photosField = `photos: ${urlList.join(", ")}`;
        setUsersData((prev) => prev + photosField + "\n");
        alert(`Added ${urlList.length} photo URLs`);
      } else {
        alert("No valid URLs found");
      }
    }
  };

  // Bio template helper
  const addBioTemplate = () => {
    const bioTemplates = [
      "Elegant and sophisticated companion offering discreet encounters with a focus on mutual respect and genuine connection.",
      "Professional model with years of experience in providing premium companionship services in a safe and comfortable environment.",
      "Charming and intelligent companion specializing in creating memorable experiences for discerning gentlemen.",
      "Beautiful and charismatic companion offering exclusive encounters with an emphasis on discretion and luxury.",
      "Stunning professional providing elite companionship services for those who appreciate beauty, intelligence, and sophistication.",
    ];

    const selectedBio =
      bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
    setUsersData((prev) => prev + `bio: ${selectedBio}\n`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Auto-Generate User Creator
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            🚀 Auto-Generate Mode
          </h2>
          <p className="text-blue-700">
            Just provide <strong>name, photos, and location</strong>. Add custom{" "}
            <strong>bio</strong> if you want! Everything else auto-generates.
          </p>
        </div>

        {/* Quick Location Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            {quickLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => addLocationToData(location)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
              >
                {location}
              </button>
            ))}
            <button
              onClick={addBioTemplate}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"
            >
              Add Bio Template
            </button>
            <button
              onClick={formatPhotoUrls}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm"
            >
              Add Photos
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Data Input</h2>
            <div className="space-x-2">
              <button
                onClick={loadSampleData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Load Sample Data
              </button>
              <button
                onClick={() => setUsersData("")}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            value={usersData}
            onChange={(e) => setUsersData(e.target.value)}
            placeholder={`Just provide name, photos, and location! Add bio if you want custom text.

displayName: Sophie Müller
location: Düsseldorf Government Region, North Rhine-Westphalia, Germany
bio: Elegant companion specializing in discreet encounters... (optional)
photos: https://example.com/photo1.jpg, https://example.com/photo2.jpg
---
displayName: Jessica Smith  
location: Houston, TX, US
photos: https://example.com/photo3.jpg

✅ Auto-generates:
• Email (name@gmail.com)
• Website (www.name.com)  
• Age (20-30), Height, Body Type
• Ethnicity, Hair Color, Eye Color  
• Languages, Prices, Phone
• Bio (if not provided)
• And everything else!`}
            rows={15}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="mt-4 flex space-x-4 flex-wrap gap-2">
            <button
              onClick={createUsers}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading
                ? "Creating Users..."
                : "✨ Create Users (Auto-Generate)"}
            </button>

            <button
              onClick={() => navigator.clipboard.writeText(usersData)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Copy Data
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 border-l-4 ${
                    result.startsWith("✅")
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
