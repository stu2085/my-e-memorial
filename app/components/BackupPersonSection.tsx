"use client";

import { type ReactNode, useEffect, useState } from "react";
import FormSection from "./FormSection";
import Input from "./Input";
import QuickSaveButton from "./QuickSaveButton";

type Props = {
  form: any;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  isSaving?: boolean;
  isPublished?: boolean;
  onNotifyPrimaryFuneralHome?: () => void;
  onNotifyAlternateFuneralHome?: () => void;
  onActivateAlternateFuneralHome?: () => void;
  onActivateSecondaryBackupPerson?: () => void;
  onRevokePrimaryBackupPerson?: () => void;
  onRevokeSecondaryBackupPerson?: () => void;
  onRestorePrimaryBackupPerson?: () => void;
  showSetupCompleteMessage?: boolean;
  showSaveConfirmationMessage?: boolean;
  secondaryFreshPasswordRequired?: boolean;
  accessWorkflowDirty?: boolean;
  isBackupAccess?: boolean;
  isPostDeathUnlocked?: boolean;
  onReportDeath?: () => void;
};

function AccordionSection({
  title,
  description,
  forceOpen = false,
  children,
}: {
  title: string;
  description?: string;
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(forceOpen);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
      >
        <span className="min-w-0">
          <span className="block text-xl font-bold text-stone-900">
            {title}
          </span>
          {description && (
            <span className="mt-1 block text-base leading-7 text-stone-600">
              {description}
            </span>
          )}
        </span>

        <span
          aria-hidden="true"
          className="shrink-0 text-2xl font-bold text-stone-700"
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-stone-200 bg-stone-50/40 p-5">
          {children}
        </div>
      )}
    </section>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: Props["handleChange"];
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-semibold text-stone-800">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
      >
        <option value="">Select</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const YES_NO_UNSURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not Sure" },
];

export default function BackupPersonSection({
  form,
  handleChange,
  isSaving,
  isPublished,
  onNotifyPrimaryFuneralHome,
  onNotifyAlternateFuneralHome,
  onActivateAlternateFuneralHome,
  onActivateSecondaryBackupPerson,
  onRevokePrimaryBackupPerson,
  onRevokeSecondaryBackupPerson,
  onRestorePrimaryBackupPerson,
  showSetupCompleteMessage,
  showSaveConfirmationMessage,
  secondaryFreshPasswordRequired,
  accessWorkflowDirty,
  isBackupAccess,
  isPostDeathUnlocked = false,
  onReportDeath,
}: Props) {
  const isCreateMode = true;

  const activeBackupRoleNeedsAction = form.secondaryBackupActivatedAt
    ? Boolean(form.secondaryBackupRevokedAt)
    : Boolean(form.primaryBackupRevokedAt);

  const backupPersonsMustOpen =
    !isBackupAccess &&
    Boolean(
      accessWorkflowDirty ||
        secondaryFreshPasswordRequired ||
        activeBackupRoleNeedsAction
    );

  /*
   * Backup Person access uses a deliberately limited interface.
   * While the owner is living, this chapter is informational and provides
   * only the death-report action. After independent death verification,
   * the Backup Person can enter the Date of Death and use the funeral-home
   * workflow, but cannot rewrite the owner's private setup information.
   */
  if (isBackupAccess) {
    const primaryFuneralHomeLocation = [
      form.primaryFuneralHomeCity,
      form.primaryFuneralHomeState,
    ]
      .filter(Boolean)
      .join(", ");

    const alternateFuneralHomeLocation = [
      form.alternateFuneralHomeCity,
      form.alternateFuneralHomeState,
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <FormSection
        title={
          isPostDeathUnlocked
            ? "After-Death Information"
            : "Backup Person Access"
        }
        description={
          isPostDeathUnlocked
            ? "Complete the information needed after death without changing the life story the memorial owner preserved."
            : "The memorial owner's story is protected while they are living."
        }
      >
        {!isPostDeathUnlocked ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-300 bg-stone-100 p-6">
              <h3 className="text-xl font-bold text-stone-900">
                Owner-Created Memorial Is Read-Only
              </h3>

              <p className="mt-3 text-base leading-7 text-stone-700">
                You may view the Living MyEMemorial, but you cannot change
                the memorial owner's names, dates, life story, family history,
                places, schools, awards, social links, articles, music, photos,
                videos, obituary, or final resting place while the owner is
                living.
              </p>

              <p className="mt-3 text-base font-semibold leading-7 text-stone-800">
                Reporting a death starts verification. It does not unlock
                editing by itself.
              </p>
            </div>

            <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
              <h3 className="text-xl font-bold text-red-900">
                Report a Death
              </h3>

              <p className="mt-3 text-base leading-7 text-red-800">
                If the owner of this Living MyEMemorial has died, report the
                death here to begin MyEMemorial&apos;s independent verification
                process.
              </p>

              <button
                type="button"
                onClick={onReportDeath}
                disabled={!onReportDeath}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-red-700 px-6 py-4 text-base font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Report a Death
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-300 bg-blue-50 p-6">
              <h3 className="text-xl font-bold text-blue-950">
                The Owner&apos;s Life Story Is Preserved
              </h3>

              <p className="mt-3 text-base leading-7 text-blue-900">
                The memorial owner created their life story the way they wanted
                it remembered. Those owner-authored chapters remain read-only.
                You may complete the Date of Death, Obituary, Final Resting
                Place, and add funeral-presentation photos and videos.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6">
              <h3 className="text-xl font-bold text-green-950">
                Date of Death
              </h3>

              <p className="mt-2 text-base leading-7 text-green-900">
                Independent death verification is complete. Enter the Date of
                Death below. This date will be saved to the memorial and shown
                on the final published memorial.
              </p>

              <label className="mt-5 block">
                <span className="mb-2 block text-base font-semibold text-stone-900">
                  Date of Death
                </span>

                <input
                  type="date"
                  name="deathDate"
                  value={form.deathDate ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                />
              </label>

              <p className="mt-3 text-base font-semibold leading-7 text-green-900">
                Click Save &amp; Continue to save this date.
              </p>
            </div>

            <AccordionSection
              title="Funeral Home Information"
              description="Review the funeral-home choices the memorial owner left and use the available alternate funeral-home controls when needed."
              forceOpen
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                  <h3 className="text-lg font-bold text-stone-900">
                    Primary Preferred Funeral Home
                  </h3>

                  <p className="mt-3 text-base leading-7 text-stone-800">
                    {form.primaryFuneralHomeName || "No Primary Funeral Home was entered."}
                  </p>

                  {primaryFuneralHomeLocation && (
                    <p className="mt-1 text-base leading-7 text-stone-700">
                      {primaryFuneralHomeLocation}
                    </p>
                  )}

                  {form.primaryFuneralHomeEmail && (
                    <p className="mt-1 text-base leading-7 text-stone-700">
                      {form.primaryFuneralHomeEmail}
                    </p>
                  )}

                  {form.primaryFuneralHomeAcknowledgedAt && (
                    <p className="mt-3 text-base font-semibold leading-7 text-green-800">
                      Funeral Home Acknowledged
                    </p>
                  )}

                  {form.primaryFuneralHomeUnavailableAt && (
                    <p className="mt-3 text-base font-semibold leading-7 text-amber-900">
                      Primary Funeral Home marked unavailable.
                    </p>
                  )}

                  {form.primaryFuneralHomeName &&
                    form.alternateFuneralHomeName &&
                    !form.primaryFuneralHomeUnavailableAt && (
                      <button
                        type="button"
                        onClick={onActivateAlternateFuneralHome}
                        disabled={!onActivateAlternateFuneralHome}
                        className="mt-5 inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-4 text-base font-bold text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Primary Funeral Home Unavailable
                      </button>
                    )}
                </div>

                <div className="rounded-2xl border border-stone-300 bg-white p-5">
                  <h3 className="text-lg font-bold text-stone-900">
                    Alternate Funeral Home
                  </h3>

                  <p className="mt-3 text-base leading-7 text-stone-800">
                    {form.alternateFuneralHomeName || "No Alternate Funeral Home was entered."}
                  </p>

                  {alternateFuneralHomeLocation && (
                    <p className="mt-1 text-base leading-7 text-stone-700">
                      {alternateFuneralHomeLocation}
                    </p>
                  )}

                  {form.alternateFuneralHomeEmail && (
                    <p className="mt-1 text-base leading-7 text-stone-700">
                      {form.alternateFuneralHomeEmail}
                    </p>
                  )}

                  {form.alternateFuneralHomeActivatedAt && (
                    <p className="mt-3 text-base font-semibold leading-7 text-blue-900">
                      Alternate Funeral Home is active.
                    </p>
                  )}

                  {form.alternateFuneralHomeAcknowledgedAt && (
                    <p className="mt-3 text-base font-semibold leading-7 text-green-800">
                      Alternate Funeral Home Acknowledged
                    </p>
                  )}

                  {form.alternateFuneralHomeActivatedAt &&
                    !form.alternateFuneralHomeAcknowledgedAt &&
                    !form.alternateFuneralHomeNotifiedAt && (
                      <button
                        type="button"
                        onClick={onNotifyAlternateFuneralHome}
                        disabled={
                          !form.alternateFuneralHomeEmail ||
                          !onNotifyAlternateFuneralHome
                        }
                        className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Notify Alternate Funeral Home
                      </button>
                    )}

                  {form.alternateFuneralHomeActivatedAt &&
                    form.alternateFuneralHomeNotifiedAt &&
                    !form.alternateFuneralHomeAcknowledgedAt && (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                        <p className="text-lg font-semibold text-amber-900">
                          Notification Sent
                        </p>

                        <p className="mt-2 text-base leading-7 text-amber-800">
                          MyEMemorial has sent the Alternate Funeral Home your
                          preference notice and is waiting for acknowledgement.
                        </p>

                        <button
                          type="button"
                          onClick={onNotifyAlternateFuneralHome}
                          disabled={
                            !form.alternateFuneralHomeEmail ||
                            !onNotifyAlternateFuneralHome
                          }
                          className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Resend Notification
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Private Legacy Instructions"
              description="Private directions released only after independent death verification."
              forceOpen
            >
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <p className="whitespace-pre-wrap text-base leading-7 text-stone-800">
                  {form.legacyInstructions?.trim()
                    ? form.legacyInstructions
                    : "No private legacy instructions were left."}
                </p>
              </div>
            </AccordionSection>

            <AccordionSection
              title="Private Message from the Memorial Owner"
              description="A private message released only after independent death verification."
            >
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="whitespace-pre-wrap text-base leading-7 text-stone-800">
                  {form.privateOwnerMessage?.trim()
                    ? form.privateOwnerMessage
                    : "No private message was left."}
                </p>
              </div>
            </AccordionSection>
          </div>
        )}
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Living MyEMemorial Backup Person"
      description="Choose the people you trust to help carry out your wishes and manage your Living MyEMemorial."
    >
      {isCreateMode && (
        <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-base font-semibold text-amber-900">
            Your backup person is an important part of your Living MyEMemorial.
          </p>

          <p className="mt-2 text-base leading-6 text-amber-800">
            Your Primary Backup Person can help with your memorial while you are
            living and can complete and manage it after your passing once
            post-death access has been verified.
          </p>

          <p className="mt-2 text-base leading-6 text-amber-800">
            A Secondary Backup Person provides an additional safeguard if your
            Primary Backup Person is unable to serve in the future.
          </p>
        </div>
      )}

      <AccordionSection
        title="Backup Persons"
        description="Primary and Secondary Backup Person contact details, passwords, status, and access controls."
        forceOpen={backupPersonsMustOpen}
      >
      {/* PRIMARY BACKUP PERSON */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Primary Backup Person
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          Choose someone you trust to help preserve your wishes and manage your
          Living MyEMemorial when needed.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Input
            label="Primary Backup Person Name"
            name="backupPersonName"
            value={form.backupPersonName ?? ""}
            onChange={handleChange}
          />

          <Input
            label="Primary Backup Person Email"
            name="backupEmail"
            value={form.backupEmail ?? ""}
            onChange={handleChange}
          />



          <Input
            label="Primary Backup Person Phone"
            name="backupPhone"
            type="tel"
            value={form.backupPhone ?? ""}
            onChange={handleChange}
          />

          {isBackupAccess ? (
            <label className="block">
              <span className="mb-2 block text-base font-semibold text-stone-800">
                Backup Password
              </span>

              <input
                type="password"
                value=""
                disabled
                readOnly
                placeholder="Owner-only setting"
                autoComplete="new-password"
                className="w-full cursor-not-allowed rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-base text-stone-500 outline-none"
              />

              <p className="mt-2 text-base leading-6 text-stone-600">
                Only the Living MyEMemorial owner can set or change the Backup
                Password.
              </p>
            </label>
          ) : (
            <Input
              label="Backup Password"
              name="backupPassword"
              type="password"
              value={form.backupPassword ?? ""}
              onChange={handleChange}
              autoComplete="new-password"
              showPasswordToggle
            />
          )}
        </div>

        {!isBackupAccess &&
          form.backupEmail &&
          form.primaryBackupRevokedAt && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5">
              <p className="text-lg font-bold text-red-900">
                Primary Backup Person Access Ended
              </p>

              <p className="mt-2 text-base leading-7 text-red-800">
                This Primary Backup Person cannot log in. Their stored
                Backup Person password has been removed.
              </p>

              <p className="mt-2 text-base leading-7 text-red-800">
                To reappoint this person, or a replacement using the
                Primary Backup Person fields above, enter a fresh password
                and save the Backup Person chapter.
              </p>
            </div>
          )}

        {!isBackupAccess &&
          form.backupEmail &&
          !form.primaryBackupRevokedAt &&
          !form.secondaryBackupActivatedAt &&
          !accessWorkflowDirty && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-base font-semibold text-green-900">
                Primary Backup Person Active
              </p>
              <p className="mt-2 text-base leading-7 text-green-800">
                The Primary Backup Person is the currently authorized Backup
                Person for this Living MyEMemorial.
              </p>
            </div>
          )}

        {!isBackupAccess &&
          form.backupEmail &&
          !form.primaryBackupRevokedAt &&
          onRevokePrimaryBackupPerson && (
            <button
              type="button"
              onClick={onRevokePrimaryBackupPerson}
              className="mt-5 inline-flex items-center justify-center rounded-xl border-2 border-red-300 bg-white px-6 py-4 text-base font-bold text-red-800 transition hover:bg-red-50"
            >
              End Primary Backup Person Access
            </button>
          )}

        {!isBackupAccess &&
          form.secondaryBackupActivatedAt &&
          onRestorePrimaryBackupPerson && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-base leading-7 text-blue-900">
                The Secondary Backup Person is currently the active Backup
                Person. Restoring Primary is always a deliberate owner action;
                MyEMemorial never switches back automatically.
              </p>

              <button
                type="button"
                onClick={onRestorePrimaryBackupPerson}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-800 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700"
              >
                Restore Primary Backup Person
              </button>
            </div>
          )}
      </div>

      {/* SECONDARY BACKUP PERSON */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Secondary Backup Person
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          This person can serve as a fallback if your Primary Backup Person is
          unavailable or can no longer fulfill the responsibility.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Input
            label="Secondary Backup Person Name"
            name="secondaryBackupName"
            value={form.secondaryBackupName ?? ""}
            onChange={handleChange}
          />

          <Input
            label="Secondary Backup Person Email"
            name="secondaryBackupEmail"
            value={form.secondaryBackupEmail ?? ""}
            onChange={handleChange}
          />

          <Input
            label="Secondary Backup Person Phone"
            name="secondaryBackupPhone"
            type="tel"
            value={form.secondaryBackupPhone ?? ""}
            onChange={handleChange}
          />

          {!isBackupAccess && (
            <Input
              label="Secondary Backup Person Password"
              name="secondaryBackupPassword"
              type="password"
              value={form.secondaryBackupPassword ?? ""}
              onChange={handleChange}
              autoComplete="new-password"
              showPasswordToggle
            />
          )}
        </div>

        {!form.secondaryBackupActivatedAt &&
          !form.secondaryBackupRevokedAt &&
          !secondaryFreshPasswordRequired &&
          form.secondaryBackupName &&
          form.secondaryBackupEmail &&
          form.secondaryBackupPhone && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-base leading-7 text-amber-900">
                Activate the Secondary Backup Person only when the Primary
                Backup Person is unable or no longer willing to serve.
              </p>

              <button
                type="button"
                onClick={onActivateSecondaryBackupPerson}
                disabled={!onActivateSecondaryBackupPerson}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Activate Secondary Backup Person
              </button>
            </div>
          )}

        {!isBackupAccess && secondaryFreshPasswordRequired && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5">
            <p className="text-base font-semibold text-amber-900">
              Fresh Secondary Backup Person Password Required
            </p>
            <p className="mt-2 text-base leading-7 text-amber-800">
              The Secondary Backup Person email was changed. Enter a fresh
              Secondary Backup Person password and click “Save & Continue.”
              MyEMemorial will keep you on this screen until the new password
              has been saved.
            </p>
          </div>
        )}

        {form.secondaryBackupActivatedAt &&
          !form.secondaryBackupRevokedAt &&
          !accessWorkflowDirty && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-base font-semibold text-green-900">
                Secondary Backup Person Active
              </p>
              <p className="mt-2 text-base leading-7 text-green-800">
                The Secondary Backup Person is the currently authorized
                Backup Person for this Living MyEMemorial.
              </p>
            </div>
          )}

        {!isBackupAccess &&
          form.secondaryBackupEmail &&
          form.secondaryBackupRevokedAt && (
            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-5">
              <p className="text-lg font-bold text-red-900">
                Secondary Backup Person Access Ended
              </p>

              <p className="mt-2 text-base leading-7 text-red-800">
                This Secondary Backup Person cannot log in. Their stored
                Backup Person password has been removed.
              </p>

              {form.secondaryBackupActivatedAt ? (
                <>
                  <p className="mt-2 text-base leading-7 text-red-800">
                    The Secondary role remains marked active so MyEMemorial
                    does not silently restore the Primary Backup Person.
                    Enter a fresh Secondary password, save this chapter, and
                    then explicitly reactivate the Secondary — or use
                    Restore Primary Backup Person above.
                  </p>

                  <button
                    type="button"
                    onClick={onActivateSecondaryBackupPerson}
                    disabled={!onActivateSecondaryBackupPerson}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-red-800 px-6 py-4 text-base font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reactivate Secondary Backup Person
                  </button>
                </>
              ) : (
                <p className="mt-2 text-base leading-7 text-red-800">
                  To reappoint this person as the standby Secondary Backup
                  Person, enter a fresh password and save this chapter.
                </p>
              )}
            </div>
          )}

        {!isBackupAccess &&
          form.secondaryBackupEmail &&
          !form.secondaryBackupRevokedAt &&
          onRevokeSecondaryBackupPerson && (
            <button
              type="button"
              onClick={onRevokeSecondaryBackupPerson}
              className="mt-5 inline-flex items-center justify-center rounded-xl border-2 border-red-300 bg-white px-6 py-4 text-base font-bold text-red-800 transition hover:bg-red-50"
            >
              End Secondary Backup Person Access
            </button>
          )}
      </div>

      </AccordionSection>

      <AccordionSection
        title="Legal & Funeral Responsibility"
        description="Will, executor, funeral decision responsibility, funeral-home preferences, and related instructions."
      >
      {/* LEGAL AND FUNERAL RESPONSIBILITY */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Legal & Funeral Responsibility
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          These questions help your backup person understand who you have chosen
          for other important responsibilities so MyEMemorial does not create
          overlapping roles.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectField
            label="Do you have a will?"
            name="hasWill"
            value={form.hasWill ?? ""}
            onChange={handleChange}
            options={YES_NO}
          />
{form.hasWill === "yes" && (
  <>
    <Input
      label="Where can your will be found?"
      name="willLocation"
      value={form.willLocation ?? ""}
      onChange={handleChange}
    />

    <Input
      label="What attorney or law office prepared your will?"
      name="willAttorneyOffice"
      value={form.willAttorneyOffice ?? ""}
      onChange={handleChange}
    />
  </>
)}
<SelectField
  label="Do you have a life insurance policy?"
  name="hasLifeInsurance"
  value={form.hasLifeInsurance ?? ""}
  onChange={handleChange}
  options={YES_NO}
/>

{form.hasLifeInsurance === "yes" && (
  <Input
    label="Where can your life insurance policy information be found?"
    name="lifeInsuranceLocation"
    value={form.lifeInsuranceLocation ?? ""}
    onChange={handleChange}
  />
)}
          <SelectField
            label="Have you named an executor or executrix?"
            name="hasExecutor"
            value={form.hasExecutor ?? ""}
            onChange={handleChange}
            options={YES_NO}
          />

          {form.hasExecutor === "yes" && (
            <SelectField
              label="Is your Primary Backup Person also your executor or executrix?"
              name="primaryBackupIsExecutor"
              value={form.primaryBackupIsExecutor ?? ""}
              onChange={handleChange}
              options={YES_NO}
            />
          )}

          <SelectField
            label="Have you legally designated someone to make funeral or disposition decisions?"
            name="hasFuneralDecisionDesignee"
            value={form.hasFuneralDecisionDesignee ?? ""}
            onChange={handleChange}
            options={YES_NO_UNSURE}
          />

          {form.hasFuneralDecisionDesignee === "yes" && (
            <SelectField
              label="Is your Primary Backup Person that person?"
              name="primaryBackupIsFuneralDesignee"
              value={form.primaryBackupIsFuneralDesignee ?? ""}
              onChange={handleChange}
              options={YES_NO}
            />
          )}

          {form.hasFuneralDecisionDesignee === "yes" &&
            form.primaryBackupIsFuneralDesignee === "no" && (
              <>
                <Input
                  label="Person Responsible for Funeral / Disposition Decisions"
                  name="funeralDecisionPersonName"
                  value={form.funeralDecisionPersonName ?? ""}
                  onChange={handleChange}
                />

                <Input
                  label="Relationship to You"
                  name="funeralDecisionPersonRelationship"
                  value={form.funeralDecisionPersonRelationship ?? ""}
                  onChange={handleChange}
                />
              </>
            )}
        </div>

        {form.hasFuneralDecisionDesignee === "yes" && (
          <div className="mt-5">
            <Input
              label="Where can the document or instructions establishing this responsibility be found?"
              name="funeralAuthorityDocumentLocation"
              value={form.funeralAuthorityDocumentLocation ?? ""}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* PRIMARY FUNERAL HOME */}
      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Primary Preferred Funeral Home
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          Identify the funeral home you currently prefer. Your selection helps
          communicate your wishes and may later assist MyEMemorial with
          post-death verification.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Input
            label="Funeral Home Name"
            name="primaryFuneralHomeName"
            value={form.primaryFuneralHomeName ?? ""}
            onChange={handleChange}
          />

          <Input
            label="City"
            name="primaryFuneralHomeCity"
            value={form.primaryFuneralHomeCity ?? ""}
            onChange={handleChange}
          />

          <Input
            label="State"
            name="primaryFuneralHomeState"
            value={form.primaryFuneralHomeState ?? ""}
            onChange={handleChange}
          />

          <Input
            label="Website (optional)"
            name="primaryFuneralHomeWebsite"
            value={form.primaryFuneralHomeWebsite ?? ""}
            onChange={handleChange}
          />
<Input
  label="Funeral Home Email"
  name="primaryFuneralHomeEmail"
  value={form.primaryFuneralHomeEmail ?? ""}
  onChange={handleChange}
/>
          <SelectField
            label="May MyEMemorial notify this funeral home that they are your current preferred choice?"
            name="primaryFuneralHomeNotifyAuthorized"
            value={form.primaryFuneralHomeNotifyAuthorized ?? ""}
            onChange={handleChange}
            options={YES_NO}
          />
        </div>

        {form.primaryFuneralHomeNotifyAuthorized === "yes" &&
  !form.primaryFuneralHomeUnavailableAt && (
  <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-5">
    <p className="text-base leading-7 text-stone-700">
      MyEMemorial may notify this funeral home that you have identified
      them as your current preferred provider. This does not create a
      prepaid funeral arrangement, contract, or obligation.
    </p>

    {!form.primaryFuneralHomeNotifiedAt &&
      !form.primaryFuneralHomeAcknowledgedAt && (
        <button
  type="button"
  id="notify-primary-funeral-home"
  onClick={onNotifyPrimaryFuneralHome}
  disabled={
    !form.primaryFuneralHomeEmail ||
    !onNotifyPrimaryFuneralHome
  }
  className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  Notify Funeral Home
</button>
      )}

    {form.primaryFuneralHomeNotifiedAt &&
  !form.primaryFuneralHomeAcknowledgedAt && (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-lg font-semibold text-amber-900">
        Notification Sent
      </p>

      <p className="mt-2 text-base leading-7 text-amber-800">
        MyEMemorial has sent the funeral home your preference notice
        and is waiting for acknowledgement.
      </p>

      <p className="mt-3 text-base leading-7 text-amber-800">
        You may resend the notification if the funeral home has not
        responded.
      </p>

      <button
        type="button"
        onClick={onNotifyPrimaryFuneralHome}
        disabled={
          !form.primaryFuneralHomeEmail ||
          !onNotifyPrimaryFuneralHome
        }
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Resend Notification
      </button>
    </div>
  )}

    {form.primaryFuneralHomeAcknowledgedAt && (
      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-base font-semibold text-green-900">
          Funeral Home Acknowledged
        </p>

        <p className="mt-2 text-base leading-7 text-green-800">
          This funeral home has acknowledged receiving your preference
          notice.
        </p>
      </div>
    )}
  </div>
)}



{form.primaryFuneralHomeName &&
  form.alternateFuneralHomeName &&
  !form.primaryFuneralHomeUnavailableAt && (
    <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-base leading-7 text-stone-700">
        If your Primary Funeral Home is no longer available, you can
        activate your Alternate Funeral Home as your current backup choice.
      </p>

      <button
        type="button"
        onClick={onActivateAlternateFuneralHome}
        disabled={!onActivateAlternateFuneralHome}
        className="mt-5 inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-4 text-base font-bold text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Primary Funeral Home Unavailable
      </button>
    </div>
  )}{form.primaryFuneralHomeUnavailableAt && (
  <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5">
    <p className="text-lg font-bold text-amber-900">
      Primary Funeral Home Unavailable
    </p>

    {form.primaryFuneralHomeUnavailableReason && (
      <p className="mt-3 text-base leading-7 text-amber-800">
        Reason: {form.primaryFuneralHomeUnavailableReason}
      </p>
    )}

    <p className="mt-3 text-base font-semibold leading-7 text-stone-900">
      Your Alternate Funeral Home is now the active funeral-home choice.
    </p>
  </div>
)}
      </div>

      {/* ALTERNATE FUNERAL HOME */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Alternate Funeral Home
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          Choose an alternate in case your Primary Preferred Funeral Home is no
          longer available or cannot provide the needed services.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Input
            label="Alternate Funeral Home Name"
            name="alternateFuneralHomeName"
            value={form.alternateFuneralHomeName ?? ""}
            onChange={handleChange}
          />

          <Input
            label="City"
            name="alternateFuneralHomeCity"
            value={form.alternateFuneralHomeCity ?? ""}
            onChange={handleChange}
          />

          <Input
            label="State"
            name="alternateFuneralHomeState"
            value={form.alternateFuneralHomeState ?? ""}
            onChange={handleChange}
          />

          <Input
            label="Website (optional)"
            name="alternateFuneralHomeWebsite"
            value={form.alternateFuneralHomeWebsite ?? ""}
            onChange={handleChange}
          />
<Input
  label="Alternate Funeral Home Email"
  name="alternateFuneralHomeEmail"
  value={form.alternateFuneralHomeEmail ?? ""}
  onChange={handleChange}
/>
<SelectField
  label="May MyEMemorial notify this Alternate Funeral Home if they become your active funeral-home choice?"
  name="alternateFuneralHomeNotifyAuthorized"
  value={form.alternateFuneralHomeNotifyAuthorized ?? ""}
  onChange={handleChange}
  options={YES_NO}
/>
   {form.alternateFuneralHomeActivatedAt &&
  !form.alternateFuneralHomeNotifiedAt &&
  !form.alternateFuneralHomeAcknowledgedAt && (
    <div className="md:col-span-2 mt-2 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="text-lg font-bold text-stone-900">
        Alternate Funeral Home Now Active
      </p>

      <p className="mt-2 text-base leading-7 text-stone-700">
        The Primary Funeral Home has been marked unavailable. You may now
        notify this Alternate Funeral Home that they are your current
        preferred funeral-home choice.
      </p>

      <button
        type="button"
        onClick={onNotifyAlternateFuneralHome}
        disabled={
          !form.alternateFuneralHomeEmail ||
          !onNotifyAlternateFuneralHome
        }
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Notify Alternate Funeral Home
      </button>
    </div>
  )}

  {form.alternateFuneralHomeActivatedAt &&
    form.alternateFuneralHomeNotifiedAt &&
    !form.alternateFuneralHomeAcknowledgedAt && (
      <div className="md:col-span-2 mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-lg font-bold text-amber-900">
          Notification Sent
        </p>

        <p className="mt-2 text-base leading-7 text-amber-800">
          MyEMemorial has sent this Alternate Funeral Home your preference
          notice and is waiting for acknowledgement.
        </p>

        <p className="mt-3 text-base leading-7 text-amber-800">
          You may resend the notification if the funeral home has not
          responded.
        </p>

        <button
          type="button"
          onClick={onNotifyAlternateFuneralHome}
          disabled={
            !form.alternateFuneralHomeEmail ||
            !onNotifyAlternateFuneralHome
          }
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-stone-900 px-6 py-4 text-base font-bold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Resend Notification
        </button>
      </div>
    )}
    {form.alternateFuneralHomeActivatedAt &&
  form.alternateFuneralHomeAcknowledgedAt && (
    <div className="md:col-span-2 mt-2 rounded-2xl border border-green-200 bg-green-50 p-5">
      <p className="text-lg font-bold text-green-900">
        Alternate Funeral Home Acknowledged
      </p>

      <p className="mt-2 text-base leading-7 text-green-800">
        This funeral home has acknowledged that it is now your active
        funeral-home choice.
      </p>
    </div>
  )}


               </div>
      </div>
{isBackupAccess && (
  <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-6">
    <h3 className="text-xl font-bold text-red-900">
      Report a Death
    </h3>

    <p className="mt-3 text-base leading-7 text-red-800">
      If the owner of this Living MyEMemorial has died, you can report the
      death here to begin MyEMemorial&apos;s verification process.
    </p>

    <p className="mt-3 text-base leading-7 text-red-800">
      Reporting a death does not immediately unlock post-death access.
      MyEMemorial must first verify the death before additional access can be
      granted.
    </p>

    <button
      type="button"
      onClick={onReportDeath}
      disabled={!onReportDeath}
      className="mt-5 inline-flex items-center justify-center rounded-xl bg-red-700 px-6 py-4 text-base font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Report a Death
    </button>
  </div>
)}
      </AccordionSection>

      <AccordionSection
        title="Private Legacy Instructions"
        description="Private directions for where important documents, insurance papers, funeral plans, and other records can be found."
      >
      {/* LEGACY INSTRUCTIONS */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
        <h3 className="text-lg font-bold text-stone-900">
          Private Legacy Instructions
        </h3>

        <p className="mt-1 text-base leading-6 text-stone-600">
          Leave information your backup person may need after your passing,
          including where important papers, insurance documents, funeral
          preplanning information, your will, or other important records can be
          found.
        </p>

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-base font-semibold text-red-800">
            Do not enter passwords, PINs, account numbers, Social Security
            numbers, safe combinations, or other confidential credentials.
          </p>

          <p className="mt-1 text-base leading-6 text-red-700">
            Use this area only to explain where important documents or private
            information can be found.
          </p>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-base font-semibold text-stone-800">
            Legacy Instructions for My Backup Person
          </span>

          <textarea
            name="legacyInstructions"
            value={form.legacyInstructions ?? ""}
            onChange={handleChange}
            rows={8}
            placeholder="Example: My life insurance paperwork and important documents are kept in the locked filing cabinet in my home office. My funeral preplanning paperwork is in the blue folder..."
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          />
        </label>

        <p className="mt-3 text-base font-medium text-purple-800">
          These Legacy Instructions will be treated as private post-death
          information and will not be displayed on the public memorial.
        </p>
      </div>
      </AccordionSection>

      <AccordionSection
        title="Private Message for My Backup Person"
        description="A private message that remains hidden until death is independently verified and post-death access is activated."
      >
<div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
  <h3 className="text-xl font-bold text-stone-900">
    Private Message for My Backup Person
  </h3>

  <p className="mt-2 text-base leading-7 text-stone-700">
    Leave a private message for your Backup Person. This message will remain
    hidden until your death has been independently verified and post-death
    access has been activated.
  </p>

  <textarea
    name="privateOwnerMessage"
    value={form.privateOwnerMessage ?? ""}
    onChange={handleChange}
    rows={6}
    placeholder="Example: Thank you for helping carry out my wishes and complete my memorial."
    className="mt-4 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
  />

  <p className="mt-3 text-base font-semibold text-blue-900">
    This private message will not appear on the public memorial.
  </p>
</div>
      </AccordionSection>

      <AccordionSection
        title="Memorial Owner Contact Address"
        description="The Living MyEMemorial owner's current mailing address — not a Backup Person's address."
      >
      {/* OWNER ADDRESS */}
      {isCreateMode && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-bold text-stone-900">
            Memorial Owner Contact Address
          </h3>

          <p className="mt-2 text-base leading-7 text-stone-700">
            Enter the Living MyEMemorial owner's current mailing address.
            This is the owner's address, not a Primary or Secondary Backup
            Person's address.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Input
              label="Owner Street Address"
              name="creatorStreet"
              value={form.creatorStreet ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Owner City"
              name="creatorCity"
              value={form.creatorCity ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Owner State"
              name="creatorState"
              value={form.creatorState ?? ""}
              onChange={handleChange}
            />

            <Input
              label="Owner ZIP Code"
              name="creatorZip"
              value={form.creatorZip ?? ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
      </AccordionSection>

      {!isCreateMode && (
        <p className="mt-3 text-base text-stone-500">
          This person will be able to edit and publish this memorial if needed.
        </p>
      )}

      {typeof isSaving === "boolean" &&
        typeof isPublished === "boolean" && (
          <QuickSaveButton
            sectionId="backup-person"
            isSaving={isSaving}
            isPublished={isPublished}
          />
        )}

      {/* SAVE / WORKFLOW CONFIRMATION
          Keep this immediately above the Guided Memory Builder navigation so
          the owner sees the result without scrolling back up this long chapter. */}
      {!isBackupAccess && showSaveConfirmationMessage && (
        <div
          id="backup-person-save-confirmation"
          role="status"
          className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5 shadow-sm"
          aria-live="polite"
        >
          <p className="text-lg font-bold text-green-900">
            Changes saved.
          </p>

          {showSetupCompleteMessage ? (
            <p className="mt-2 text-base font-semibold leading-7 text-green-900">
              Setup complete. Click “Save & Continue” to proceed.
            </p>
          ) : (
            <p className="mt-2 text-base font-semibold leading-7 text-green-900">
              Stay on this screen and complete any remaining Backup Person
              action shown above before continuing.
            </p>
          )}
        </div>
      )}

      {!isBackupAccess &&
        showSetupCompleteMessage &&
        !showSaveConfirmationMessage && (
          <div
            id="backup-person-setup-complete"
            role="status"
            className="mt-6 rounded-xl border border-green-300 bg-green-50 p-5 shadow-sm"
            aria-live="polite"
          >
            <p className="text-lg font-bold text-green-900">
              Setup complete. Click “Save & Continue” to proceed.
            </p>
          </div>
        )}
    </FormSection>
  );
}