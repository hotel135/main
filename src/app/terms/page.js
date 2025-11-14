export default function TermsPage() {
  return (
    <section className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Last Updated: October 25, 2025
        </p>

        <div className="space-y-6 text-gray-700">
          <p className="leading-relaxed">
            Welcome to MeetAnEscort.com (the &quot;Website&quot;). By accessing
            or using our website, you agree to be bound by these Terms of
            Service (&quot;Terms&quot;). If you do not agree with these Terms,
            please do not use the Website.
          </p>

          <div className="border-l-4 border-purple-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed">
              By accessing or using MeetAnEscort.com, you confirm that you are
              at least 18 years of age (or the legal age of majority in your
              jurisdiction) and have the legal capacity to enter these Terms.
              You also agree to comply with all applicable laws and regulations.
            </p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Nature of Services
            </h2>
            <p className="leading-relaxed">
              MeetAnEscort.com is an online advertising platform that allows
              independent escorts (&quot;Providers&quot;) to post advertisements
              and connect with clients (&quot;Users&quot;). The Website does not
              provide escort services directly, act as an escort agency, or
              employ Providers.
            </p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. User Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Be at least 18 years old (or legal age of majority in your
                jurisdiction)
              </li>
              <li>Not use the Website for any illegal activities</li>
              <li>Comply with all applicable local, state, and federal laws</li>
              <li>Respect the privacy and boundaries of other users</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Important:</strong> All arrangements and transactions
              between Providers and Users are independent of MeetAnEscort.com.
              We are not responsible for the conduct, actions, or agreements
              between Providers and Users.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
