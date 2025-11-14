export default function HelpPage() {
  return (
    <section className="max-w-4xl mx-auto py-20 px-6">
      <h1 className="text-3xl font-semibold mb-4">Help & Support</h1>
      <p className="text-neutral-400 leading-relaxed mb-3">
        Need help? Our support team is available to assist you with any issues
        or questions.
      </p>
      <ul className="list-disc list-inside text-neutral-400 space-y-2">
        <li>Account setup and verification</li>
        <li>Escort listings and visibility</li>
        <li>Payment or privacy concerns</li>
      </ul>
      <p className="mt-4 text-neutral-400">
        Contact us at{" "}
        <span className="text-white">support@meetanescort.com</span>
      </p>
    </section>
  );
}
