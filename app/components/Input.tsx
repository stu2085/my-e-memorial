import { useState } from "react";

type ChangeHandler = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => void;

export default function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  autoComplete,
  showPasswordToggle = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: ChangeHandler;
  type?: string;
  autoComplete?: string;
  showPasswordToggle?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password" && showPassword
      ? "text"
      : type;

  return (
    <div>
      <label className="mb-2 block text-base font-semibold text-stone-800">
        {label}
      </label>

      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200 ${
            showPasswordToggle ? "pr-14" : ""
          }`}
        />

        {type === "password" && showPasswordToggle && (
          <button
  type="button"
  onClick={() =>
    setShowPassword((previous) => !previous)
  }
  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-900"
  aria-label={showPassword ? "Hide password" : "Show password"}
  title={showPassword ? "Hide password" : "Show password"}
>
  {showPassword ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m2 2 20 20" />
      <path d="M6.7 6.7C4.6 8.1 3.1 10 2 12c2.1 4 5.5 6 10 6 1.4 0 2.7-.2 3.8-.6" />
      <path d="M10.7 10.7a2 2 0 0 0 2.6 2.6" />
      <path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c4.5 0 7.9 2 10 6a11.8 11.8 0 0 1-2.2 3.1" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>
        )}
      </div>
    </div>
  );
}