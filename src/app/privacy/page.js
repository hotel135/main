export default function PrivacyPage() {
  return (
    <section className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Last Updated: October 25, 2025
        </p>

        <div className="space-y-6 text-gray-700">
          <p className="leading-relaxed">
            At MeetAnEscort.com, we are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and
            protect your personal information when you access or use our
            website.
          </p>

          <div className="border-l-4 border-blue-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Contact details (email, phone number)</li>
                  <li>Profile information and photos</li>
                  <li>Payment information through secure processors</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Non-Personal Information
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Usage data and analytics</li>
                  <li>Device and browser information</li>
                  <li>Cookies and tracking technologies</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-blue-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Operate and maintain the platform</li>
              <li>Facilitate communication between Users and Providers</li>
              <li>Process payments securely</li>
              <li>Improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Your Rights:</strong> You have the right to access,
              correct, or delete your personal information. Contact us at
              privacy@meetanescort.com to exercise these rights.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
