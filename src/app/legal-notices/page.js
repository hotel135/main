export default function LegalNoticesPage() {
  return (
    <section className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Legal Notices</h1>
        <p className="text-gray-500 text-sm mb-8">
          Last Updated: October 25, 2025
        </p>

        <div className="space-y-6 text-gray-700">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">
              IMPORTANT: MeetAnEscort.com is an advertising platform only. We do
              not provide escort services, act as an agency, or employ
              Providers. All arrangements are independent.
            </p>
          </div>

          <div className="border-l-4 border-red-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              General Disclaimer
            </h2>
            <p className="leading-relaxed mb-3">
              The Website is provided &quot;as is&quot; without warranties of
              any kind. To the fullest extent permitted by law, MeetAnEscort.com
              disclaims liability for any damages arising from your use of the
              Website or interactions with others.
            </p>
            <p className="leading-relaxed">
              Users and Providers are solely responsible for verifying
              identities, credentials, and intentions of individuals they
              interact with through the Website.
            </p>
          </div>

          <div className="border-l-4 border-red-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Compliance with Laws
            </h2>
            <p className="leading-relaxed mb-3">
              MeetAnEscort.com operates in compliance with applicable local,
              state, federal, and international laws. This includes FOSTA-SESTA
              compliance in the United States.
            </p>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Age Restriction:</strong> Strictly for individuals 18
                years or older. We implement age verification measures and
                report unauthorized underage use.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-red-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Copyright Information
            </h2>
            <p className="leading-relaxed">
              All content on MeetAnEscort.com is protected by copyright,
              trademark, and other intellectual property laws. Providers grant
              us a license to display their content for platform operation
              purposes only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
