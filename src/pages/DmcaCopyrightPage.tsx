import { Copyright } from 'lucide-react';
import LegalPageLayout, { type LegalSection } from '../components/LegalPageLayout';

const listClass = 'mt-3 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-amber-600';
const boxClass = 'mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-500/20 dark:bg-amber-500/10';

const sections: LegalSection[] = [
  {
    id: 'commitment',
    title: 'Our copyright commitment',
    content: <><p>ShayariUrdu.com respects poets, writers, translators, publishers, photographers, artists, estates, and other copyright owners. Our purpose is to celebrate and preserve poetry while responding responsibly when protected material is reported.</p><p className="mt-3">Some poetry may be in the public domain in one country but protected in another. Attribution alone does not replace permission where permission is legally required.</p></>,
  },
  {
    id: 'notice',
    title: 'Submitting an infringement notice',
    content: <><p>If you believe material available on ShayariUrdu.com infringes a copyright you own or are authorized to enforce, send a written notice to <a className="font-semibold text-amber-700 underline underline-offset-4 dark:text-amber-400" href="mailto:copyright@shayariurdu.com">copyright@shayariurdu.com</a>. To help us evaluate and act on it, include:</p><ol className={listClass}><li>Your full legal name, organization (if applicable), mailing address, telephone number, and email address.</li><li>Identification of the copyrighted work, or a representative list if multiple works are covered.</li><li>The exact URL of each allegedly infringing item and enough detail for us to locate it.</li><li>A description of your ownership or authority, including relevant registration or publication details where available.</li><li>A statement that you have a good-faith belief that the disputed use is not authorized by the owner, its agent, or the law.</li><li>A statement, under penalty of perjury, that the notice is accurate and that you are the owner or authorized to act for the owner.</li><li>Your physical or electronic signature.</li></ol><p className={boxClass}>A complete, specific notice helps us review the request promptly. General references to a homepage, category, poet, or search result may not identify the material clearly enough.</p></>,
  },
  {
    id: 'response',
    title: 'What happens after a notice',
    content: <><p>We may acknowledge the notice, request missing information, investigate the identified material, and remove or disable access where appropriate. We may send the notice - including the claimant's contact details - to the person who supplied the material or to relevant service providers.</p><p className="mt-3">Removal does not necessarily mean we accept every allegation. We may restore material following a valid counter-notice or other evidence, where permitted by law.</p></>,
  },
  {
    id: 'counter-notice',
    title: 'Counter-notification',
    content: <><p>If your content was removed or disabled because of a copyright notice and you believe that happened through mistake or misidentification, you may send a counter-notification. It should include:</p><ol className={listClass}><li>Your name, address, telephone number, and email address.</li><li>The removed material and the URL where it appeared before removal.</li><li>A statement under penalty of perjury that you have a good-faith belief the material was removed or disabled due to mistake or misidentification.</li><li>Your consent to the jurisdiction required by applicable law and acceptance of service of process from the original claimant, where the DMCA applies.</li><li>Your physical or electronic signature.</li></ol><p className={boxClass}>A counter-notification is a legal statement. Consider obtaining independent legal advice before submitting one.</p></>,
  },
  {
    id: 'repeat-infringement',
    title: 'Repeat infringement',
    content: <p>Where appropriate and within our control, we may restrict contributions or terminate access for users or contributors who repeatedly infringe copyright. We may also remove material that presents a clear or repeated rights concern, even before a formal determination.</p>,
  },
  {
    id: 'attribution-corrections',
    title: 'Attribution and factual corrections',
    content: <><p>A misspelled poet name, disputed attribution, incorrect translation credit, or biographical error is not always a copyright claim. We still want to correct credible errors. Email the affected URL, the correction requested, and reliable supporting information to our copyright contact.</p><p className="mt-3">If your concern involves privacy, defamation, trademark, or another legal right, clearly identify that issue so it can be routed appropriately.</p></>,
  },
  {
    id: 'misrepresentation',
    title: 'Good-faith notices only',
    content: <p>Do not knowingly make a false claim or counter-claim. Misrepresenting that material is infringing - or that removal was mistaken - may create legal liability. Before sending a notice, consider whether the use may be licensed, in the public domain, or permitted by an exception such as fair use or fair dealing.</p>,
  },
  {
    id: 'contact',
    title: 'Copyright contact',
    content: <><p><strong>Copyright Team, ShayariUrdu.com</strong><br />Email: <a className="font-semibold text-amber-700 underline underline-offset-4 dark:text-amber-400" href="mailto:copyright@shayariurdu.com">copyright@shayariurdu.com</a><br />Subject line: Copyright Notice - [URL or Work Title]</p><p className="mt-3 text-sm">This page provides a reporting process and general information; it is not legal advice. Additional contact details may be requested where required to process a notice under applicable law.</p></>,
  },
];

export default function DmcaCopyrightPage() {
  return (
    <LegalPageLayout
      title="DMCA & Copyright"
      eyebrow="Protecting creative work"
      description="How rights holders can report copyrighted poetry, images, translations, or other material and how we review those requests."
      lastUpdated="September 22, 2026"
      icon={Copyright}
      sections={sections}
      contactEmail="copyright@shayariurdu.com"
    />
  );
}
