import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-static"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Last updated: November 5, 2025</p>

        <div className="max-w-none space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Introduction</h2>
            <p className="leading-relaxed">
              Welcome to DocExtract. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our 
              website and use our services, and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Information We Collect</h2>
            <p className="leading-relaxed mb-3">
              We collect and process the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Document Data:</strong> Documents you upload for processing and extraction</li>
              <li><strong>Extracted Data:</strong> Information extracted from your documents using our AI services</li>
              <li><strong>Usage Data:</strong> Information about how you use our service, including pages visited and features used</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information, and cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our document extraction service</li>
              <li>To process your documents using Azure Document Intelligence</li>
              <li>To manage your account and provide customer support</li>
              <li>To improve our services and develop new features</li>
              <li>To send you service-related notifications and updates</li>
              <li>To ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Data Storage and Security</h2>
            <p className="leading-relaxed">
              Your documents and data are stored securely using Supabase infrastructure with encryption at rest and in transit. 
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized 
              access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Third-Party Services</h2>
            <p className="leading-relaxed mb-3">
              We use the following third-party services to provide our platform:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> For authentication, database, and storage services</li>
              <li><strong>Azure Document Intelligence:</strong> For document processing and data extraction</li>
              <li><strong>Google Gemini AI:</strong> For enhanced AI processing capabilities</li>
            </ul>
            <p className="leading-relaxed mt-3">
              These services have their own privacy policies and data protection measures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for data processing at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal data only for as long as necessary to provide our services and comply with legal 
              obligations. You can delete your documents and account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Cookies</h2>
            <p className="leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze 
              how our service is used. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Children's Privacy</h2>
            <p className="leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the 
              new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this privacy policy or our data practices, please contact us at:
            </p>
            <p className="leading-relaxed mt-2">
              Email: privacy@docextract.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-700">
          <Link href="/">
            <Button variant="outline" className="text-gray-900 dark:text-white border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
