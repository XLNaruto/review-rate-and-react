import type { ReactNode } from "react";
import type { AboutYou } from "../api";

type AboutYouSectionProps = {
  aboutYou: AboutYou;
  children: ReactNode;
};

const INTRO: Record<AboutYou["feedbackType"], string> = {
  customer: "A few details about you help the business understand its customers.",
  employee: "A few details about you help your organization understand its teams.",
};

// The "About you" step: the profile prompts and built-in demographic prompts,
// with the anonymity notice above them (about_you.notice) and the preset-field
// note (about_you.fixed_note) when the API sends them.
const AboutYouSection = ({
  aboutYou,
  children,
}: AboutYouSectionProps) => (
  <section aria-labelledby="about-you-title" className="mt-6 mb-2">
    <h2 id="about-you-title" className="text-[18px] font-bold mb-1">
      About you
    </h2>
    <p className="text-[13px] text-placeholder mb-3">
      {INTRO[aboutYou.feedbackType]}
    </p>

    {aboutYou.notice && (
      <div className="rounded-2xl bg-surface px-4 py-3 mb-4 text-[13px] leading-snug text-muted-dark">
        {aboutYou.notice}
      </div>
    )}

    {aboutYou.fixedNote && (
      <p className="text-[13px] leading-snug text-muted-dark mb-4">
        {aboutYou.fixedNote}
      </p>
    )}

    {children}
  </section>
);

export default AboutYouSection;
