export default function AboutPage() {
  return (
    <section className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          About MeetAnEscort.com
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Last Updated: October 25, 2025
        </p>

        <div className="space-y-6 text-gray-700">
          <div className="text-center mb-8">
            <p className="text-lg leading-relaxed">
              Your premier online platform for connecting independent escorts
              with clients in a safe, discreet, and professional environment.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="border-l-4 border-purple-600 pl-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Who We Are
                </h2>
                <p className="leading-relaxed">
                  MeetAnEscort.com is an advertising platform designed to
                  empower independent escorts (&quot;Providers&quot;) to showcase their
                  services and connect with clients (&quot;Users&quot;). We are not an
                  escort agency, nor do we employ Providers.
                </p>
              </div>

              <div className="border-l-4 border-purple-600 pl-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Our Mission
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Provide a reliable and secure platform for independent
                    professionals
                  </li>
                  <li>Ensure respectful and professional experiences</li>
                  <li>Uphold strict legal compliance and safety standards</li>
                  <li>Foster a safe and inclusive community</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  For Providers
                </h2>
                <p className="leading-relaxed">
                  Tools to create professional profiles, post advertisements,
                  and connect with potential clients while maintaining control
                  over your services.
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  For Users
                </h2>
                <p className="leading-relaxed">
                  A trusted space to browse verified profiles and make informed
                  decisions about services that meet your preferences.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-semibold text-purple-900 mb-3">
              Our Commitment to Safety
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">✓</span>
                </div>
                <p className="font-semibold">Anti-Exploitation</p>
                <p className="text-purple-700">
                  Zero tolerance for illegal activities
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">✓</span>
                </div>
                <p className="font-semibold">Privacy Protection</p>
                <p className="text-purple-700">
                  Industry-standard security measures
                </p>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">✓</span>
                </div>
                <p className="font-semibold">Legal Compliance</p>
                <p className="text-purple-700">
                  FOSTA-SESTA and local regulations
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              Have questions? Contact us at{" "}
              <a
                href="mailto:support@meetanescort.com"
                className="text-purple-600 hover:underline"
              >
                support@meetanescort.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
