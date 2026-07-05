import FormSection from "./FormSection";

type PlanSectionProps = {
  plan: string;
  handleUpgradePlan: (plan: "plus" | "premium") => void;
};

export default function PlanSection({
  plan,
  handleUpgradePlan,
}: PlanSectionProps) {
  return (
    <FormSection
      title="Plan"
      description="View the current plan or upgrade this memorial."
    >
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm text-stone-600">Current Plan</p>
        <p className="text-lg font-semibold text-stone-900 capitalize">
          {plan}
        </p>

        {plan === "basic" && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleUpgradePlan("plus")}
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
            >
              Upgrade to Plus — $20.00
            </button>

            <button
              type="button"
              onClick={() => handleUpgradePlan("premium")}
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
            >
              Upgrade to Premium — $40.00
            </button>
          </div>
        )}

        {plan === "plus" && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => handleUpgradePlan("premium")}
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white hover:bg-stone-700"
            >
              Upgrade to Premium — $20.00
            </button>
          </div>
        )}

        {plan === "premium" && (
          <p className="mt-3 text-sm text-green-700">
            This memorial already has the highest plan.
          </p>
        )}
      </div>
    </FormSection>
  );
}