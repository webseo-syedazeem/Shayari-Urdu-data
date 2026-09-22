import { ShieldCheck } from 'lucide-react';
import LegalPageLayout, { type LegalSection } from '../components/LegalPageLayout';

const listClass = 'mt-3 list-disc space-y-2 pl-5 marker:text-amber-600';
const noteClass = 'mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-800/60';

const sections: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    content: <p>This Privacy Policy explains how ShayariUrdu.com collects, uses, stores, and protects information when you browse our Urdu poetry, shayari, ghazal, nazm, poet, collection, ebook, and related pages. By using the website, you acknowledge the practices described here.</p>,
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: <><p>We collect only the information reasonably needed to operate and improve the website. Depending on how you use ShayariUrdu.com, this may include:</p><ul className={listClass}><li><strong>Information you provide:</strong> an email address submitted for newsletters, messages sent to us, feedback, or copyright requests.</li><li><strong>Usage information:</strong> pages viewed, searches, referring pages, approximate location, browser and device type, language, and interaction data.</li><li><strong>Technical information:</strong> IP address, log timestamps, device identifiers, cookie data, and diagnostic or security events.</li><li><strong>Saved preferences:</strong> theme choice, language, bookmarks, or other settings stored in your browser.</li></ul></>,
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    content: <><p>We may use information to:</p><ul className={listClass}><li>deliver, maintain, personalize, and improve poetry content and search results;</li><li>remember preferences and provide requested features;</li><li>send updates you have chosen to receive and process support requests;</li><li>measure site performance and understand which poets, topics, and collections are useful;</li><li>detect spam, abuse, security threats, or violations of our terms; and</li><li>meet legal obligations and protect users, creators, and our rights.</li></ul></>,
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: <><p>We and service providers may use cookies, local storage, pixels, or similar technologies for essential functionality, preferences, analytics, security, and - where enabled - advertising. You can limit cookies using your browser settings, although some features may then work differently.</p><p className={noteClass}>Where required by applicable law, non-essential cookies should be used only after the appropriate consent has been obtained.</p></>,
  },
  {
    id: 'sharing',
    title: 'How information is shared',
    content: <><p>We do not sell your personal information. We may share limited information with hosting, database, analytics, email, advertising, content-delivery, and security providers that help operate the website. We may also disclose information when required by law, to address fraud or safety concerns, or as part of a merger, financing, or transfer of the website.</p><p className="mt-3">Third-party services process information under their own terms and privacy policies. Links to another website do not mean we control that website.</p></>,
  },
  {
    id: 'retention-security',
    title: 'Retention and security',
    content: <><p>We retain personal information only for as long as reasonably necessary for the purposes described above, including security, dispute resolution, and legal compliance. Retention periods vary by the type of information and the reason it was collected.</p><p className="mt-3">We use reasonable administrative and technical safeguards, but no online service can promise absolute security. Please avoid sending sensitive personal information through ordinary email.</p></>,
  },
  {
    id: 'choices-rights',
    title: 'Your choices and privacy rights',
    content: <><p>Depending on your location, you may have rights to access, correct, delete, restrict, or object to certain processing of your personal information, and to withdraw consent where processing relies on consent. You may also unsubscribe from promotional email through the link in that message.</p><p className="mt-3">To make a request, email us with enough information to identify the relevant data. We may need to verify your identity and may retain limited records where legally permitted.</p></>,
  },
  {
    id: 'children-updates',
    title: 'Children and policy updates',
    content: <><p>ShayariUrdu.com is a general-audience poetry website and is not directed to children under 13. We do not knowingly collect personal information from children under 13. A parent or guardian who believes a child has provided such information should contact us.</p><p className="mt-3">We may update this policy when our services or legal obligations change. Material changes will be reflected by a revised &quot;Last updated&quot; date and, where appropriate, an additional notice.</p></>,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      eyebrow="Your privacy matters"
      description="A clear explanation of the information we collect, why we use it, and the choices available to visitors of ShayariUrdu.com."
      lastUpdated="September 22, 2026"
      icon={ShieldCheck}
      sections={sections}
    />
  );
}
