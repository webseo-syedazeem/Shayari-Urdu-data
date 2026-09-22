import { ScrollText } from 'lucide-react';
import LegalPageLayout, { type LegalSection } from '../components/LegalPageLayout';

const listClass = 'mt-3 list-disc space-y-2 pl-5 marker:text-amber-600';

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these terms',
    content: <p>These Terms and Conditions govern your access to and use of ShayariUrdu.com and its poetry, shayari, ghazals, nazms, quotes, translations, ebooks, search tools, and related features. By using the website, you agree to these terms and our Privacy Policy. If you do not agree, please do not use the website.</p>,
  },
  {
    id: 'permitted-use',
    title: 'Permitted use',
    content: <><p>You may browse and share links to publicly available pages for personal, educational, and non-commercial enjoyment, subject to applicable law and these terms. You agree not to:</p><ul className={listClass}><li>copy, republish, scrape, download in bulk, or commercially exploit website content without permission;</li><li>remove author credits, copyright notices, watermarks, or source information;</li><li>interfere with the website, bypass access controls, introduce malicious code, or overload our systems;</li><li>use automated tools to extract data except where expressly allowed by us or by applicable law;</li><li>impersonate another person, misrepresent ownership, or use the service for unlawful or abusive activity; or</li><li>use poetry or other content in a way that infringes another person's rights.</li></ul></>,
  },
  {
    id: 'content-rights',
    title: 'Poetry and intellectual property',
    content: <><p>The website's original design, branding, arrangement, code, editorial material, and original content belong to ShayariUrdu.com or its licensors and are protected by applicable intellectual-property laws.</p><p className="mt-3">Poems, couplets, books, images, translations, and author names may belong to their respective poets, writers, publishers, estates, photographers, or other rights holders. Inclusion on this website does not transfer ownership to ShayariUrdu.com or to visitors. Public-domain status may vary by country.</p><p className="mt-3">Short quotations may be used only where permitted by applicable law and with appropriate attribution. For any broader reproduction, adaptation, recording, publication, or commercial use, obtain permission from the relevant rights holder.</p></>,
  },
  {
    id: 'submissions',
    title: 'User submissions and feedback',
    content: <><p>If you submit poetry, corrections, translations, comments, images, or other material, you represent that you own it or have permission to submit it. You retain your ownership, but grant ShayariUrdu.com a non-exclusive, worldwide, royalty-free license to host, reproduce, format, translate where authorized, display, and distribute it for operating and promoting the service.</p><p className="mt-3">You remain responsible for your submission. We may edit for formatting, reject, remove, or preserve a submission when reasonably necessary for quality, safety, legal compliance, or enforcement of these terms.</p></>,
  },
  {
    id: 'accuracy',
    title: 'Accuracy, translations, and availability',
    content: <><p>We work to present accurate text, attribution, transliteration, translation, and biographical information, but poetry has multiple editions and interpretive translations. We do not guarantee that every spelling, attribution, date, translation, download, or description is complete or error-free.</p><p className="mt-3">The website is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Features may change, pause, or end, and access may occasionally be interrupted.</p></>,
  },
  {
    id: 'third-parties',
    title: 'Third-party links and services',
    content: <p>The website may contain links, embedded media, advertisements, downloads, or services provided by others. We do not control and are not responsible for their content, availability, security, or practices. Review the third party's terms before using its service or making a purchase.</p>,
  },
  {
    id: 'liability',
    title: 'Disclaimers and limitation of liability',
    content: <><p>To the fullest extent permitted by law, ShayariUrdu.com and its operators disclaim implied warranties and will not be liable for indirect, incidental, special, consequential, or punitive loss arising from use of - or inability to use - the website. Nothing in these terms excludes liability that cannot lawfully be excluded.</p><p className="mt-3">You agree to be responsible for losses resulting from your unlawful use, infringement, or material breach of these terms.</p></>,
  },
  {
    id: 'enforcement-changes',
    title: 'Enforcement and changes',
    content: <><p>We may restrict or terminate access when we reasonably believe these terms, another person's rights, or applicable law have been violated. Failure to enforce a provision immediately is not a waiver of that provision.</p><p className="mt-3">We may revise these terms from time to time. Continued use after revised terms take effect means you accept them. If any provision is found unenforceable, the remaining provisions will continue to apply. These terms are governed by the laws applicable to the website operator, subject to mandatory consumer protections in your jurisdiction.</p></>,
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      eyebrow="Guidelines for using our platform"
      description="The rules that help keep ShayariUrdu.com respectful, reliable, and fair for readers, poets, publishers, and rights holders."
      lastUpdated="September 22, 2026"
      icon={ScrollText}
      sections={sections}
    />
  );
}
