type ContactConsentFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// "OK to contact me about this feedback". Shown only once an email is typed;
// starts unticked and is never ticked for the reviewer. The whole row is a
// real <label>, so tapping the text toggles it.
const ContactConsentField = ({ id, checked, onChange }: ContactConsentFieldProps) => (
  <label
    htmlFor={id}
    className="mt-2 flex items-center gap-2 text-[13px] text-placeholder cursor-pointer"
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 shrink-0 accent-black cursor-pointer"
    />
    OK to contact me about this feedback
  </label>
);

export default ContactConsentField;
