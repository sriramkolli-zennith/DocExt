import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Scale } from "lucide-react"

export const dynamic = "force-static"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <nav className="border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md shadow-indigo-500/30">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">DocExtract</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20">
            <Scale className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Terms of Service</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Last updated: November 5, 2025</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-6 sm:p-8 lg:p-10">
          <div className="max-w-none space-y-8 text-slate-600 dark:text-slate-400">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Agreement to Terms</h2>
              <p className="leading-relaxed">
                By accessing and using DocExtract ("the Service"), you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, you are 
                prohibited from using this Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Description of Service</h2>
              <p className="leading-relaxed">
                DocExtract is a document processing platform that uses artificial intelligence to extract structured 
                data from documents. The Service is provided "as is" and "as available" without warranties of any kind.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">User Accounts</h2>
              <p className="leading-relaxed mb-3">
                When you create an account with us, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Not share your account with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Acceptable Use</h2>
              <p className="leading-relaxed mb-3">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Upload illegal, harmful, or offensive content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit viruses, malware, or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service for any automated or bulk processing without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Intellectual Property</h2>
              <p className="leading-relaxed">
                The Service, including its original content, features, and functionality, is owned by DocExtract and 
                is protected by international copyright, trademark, and other intellectual property laws. You retain 
                all rights to the documents you upload and the data extracted from them.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">User Content</h2>
              <p className="leading-relaxed mb-3">
                By uploading documents to our Service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You retain ownership of your documents and extracted data</li>
                <li>You grant us a limited license to process your documents for providing the Service</li>
                <li>You represent that you have the right to upload and process the documents</li>
                <li>You are responsible for the content of your documents</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Data Processing</h2>
              <p className="leading-relaxed">
                We use Azure Document Intelligence and other AI services to process your documents. By using our Service, 
                you acknowledge that your documents will be processed by these third-party AI services in accordance with 
                their terms and our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Fees and Payment</h2>
              <p className="leading-relaxed">
                Certain features of the Service may require payment. You agree to provide accurate payment information 
                and authorize us to charge the applicable fees. We reserve the right to change our pricing at any time 
                with reasonable notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Service Availability</h2>
              <p className="leading-relaxed">
                We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may 
                modify, suspend, or discontinue any part of the Service at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, DocExtract shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of or inability to use the Service, 
                including but not limited to data loss, accuracy of extracted data, or business interruption.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Accuracy of Extracted Data</h2>
              <p className="leading-relaxed">
                While we strive for accuracy, AI-based document extraction is not perfect. You are responsible for 
                verifying the accuracy of extracted data. We do not guarantee 100% accuracy and are not liable for 
                errors or omissions in extracted data.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to terminate or suspend your account and access to the Service immediately, without 
                prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, 
                us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Indemnification</h2>
              <p className="leading-relaxed">
                You agree to indemnify and hold harmless DocExtract and its affiliates from any claims, damages, losses, 
                liabilities, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to 
                conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes 
                by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the 
                Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="leading-relaxed mt-2">
                Email: <a href="mailto:legal@docextract.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">legal@docextract.com</a>
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-800">
          <Link href="/">
            <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
