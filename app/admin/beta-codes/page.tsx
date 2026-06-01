"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const ADMIN_EMAIL = "mike@realchoicerealestate.com";

type PromoCode = {
  id: string;
  code: string;
  contact_name: string | null;
  assigned_email: string | null;
  promotion_name: string | null;
  promotion_category: string | null;
  allowed_plan: string | null;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string | null;
};

export default function BetaCodesAdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    code: "",
    contactName: "",
    assignedEmail: "",
    promotionName: "",
    promotionCategory: "personal",
    allowedPlan: "basic",
    maxUses: "1",
    expiresAt: "",
    notes: "",
  });

  

  async function checkAdminAndLoad() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadCodes();
    setLoading(false);
  }
useEffect(() => {
    checkAdminAndLoad();
  }, []);
  async function loadCodes() {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Could not load promo codes: ${error.message}`);
      return;
    }

    setCodes(data || []);
  }

  function generateCode() {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    const categoryPart = form.promotionCategory.toUpperCase().replace("_", "");
    setForm((prev) => ({
      ...prev,
      code: `${categoryPart}-${randomPart}`,
    }));
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const cleanCode = form.code.trim().toUpperCase();

    if (!cleanCode) {
      setMessage("Please enter or generate a promo code.");
      return;
    }

    const maxUsesNumber = Number(form.maxUses);

    if (!Number.isInteger(maxUsesNumber) || maxUsesNumber < 1) {
      setMessage("Max uses must be at least 1.");
      return;
    }

    const { error } = await supabase.from("promo_codes").insert({
      code: cleanCode,
      contact_name: form.contactName.trim() || null,
      assigned_email: form.assignedEmail.trim().toLowerCase() || null,
      promotion_name: form.promotionName.trim() || null,
      promotion_category: form.promotionCategory,
      allowed_plan: form.allowedPlan,
      max_uses: maxUsesNumber,
      uses_count: 0,
      expires_at: form.expiresAt || null,
      is_active: true,
      notes: form.notes.trim() || null,
    });

    if (error) {
      setMessage(`Could not create promo code: ${error.message}`);
      return;
    }
if (form.assignedEmail.trim()) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch("/api/admin/send-promo-invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        to: form.assignedEmail.trim(),
        contactName: form.contactName.trim(),
        code: cleanCode,
        allowedPlan: form.allowedPlan,
      }),
    });
  } catch (err) {
    console.error("Promo invite email error:", err);
  }
}
    setMessage(
  form.assignedEmail.trim()
    ? "Promo code created and invitation email sent."
    : "Promo code created."
);
    setForm({
      code: "",
      contactName: "",
      assignedEmail: "",
      promotionName: "",
      promotionCategory: "personal",
      allowedPlan: "basic",
      maxUses: "1",
      expiresAt: "",
      notes: "",
    });

    await loadCodes();
  }

  async function toggleActive(code: PromoCode) {
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: !code.is_active })
      .eq("id", code.id);

    if (error) {
      setMessage(`Could not update code: ${error.message}`);
      return;
    }

    await loadCodes();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-100 p-8">
        <p className="text-stone-700">Loading...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-stone-100 p-8">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
          <p className="mt-3 text-stone-600">
            You must be logged in as the MyEMemorial admin to view this page.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-stone-900">
            Promo Code Admin
          </h1>
          <p className="mt-3 text-stone-600">
            Create private beta, personal, and business promotion codes.
          </p>

          {message && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          )}

          <form onSubmit={handleCreate} className="mt-8 grid gap-5 md:grid-cols-2">
            <Input
              label="Promo Code"
              value={form.code}
              onChange={(value) => setForm((prev) => ({ ...prev, code: value }))}
            />

            <div className="flex items-end">
              <button
                type="button"
                onClick={generateCode}
                className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Generate Code
              </button>
            </div>

            <Input
              label="Contact Name"
              value={form.contactName}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, contactName: value }))
              }
            />

            <Input
              label="Assigned Email"
              value={form.assignedEmail}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, assignedEmail: value }))
              }
            />

            <Input
              label="Promotion Name"
              value={form.promotionName}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, promotionName: value }))
              }
            />

            <Select
              label="Promotion Category"
              value={form.promotionCategory}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, promotionCategory: value }))
              }
              options={[
                ["personal", "Personal"],
                ["attorney", "Attorney"],
                ["estate_planner", "Estate Planner"],
                ["funeral_home", "Funeral Home"],
                ["monument_company", "Monument Company"],
                ["flower_shop", "Flower Shop"],
                ["cemetery", "Cemetery"],
                ["church", "Church"],
                ["other", "Other"],
              ]}
            />

            <Select
              label="Free Plan Allowed"
              value={form.allowedPlan}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, allowedPlan: value }))
              }
              options={[
                ["basic", "Basic"],
                ["plus", "Plus"],
                ["premium", "Premium"],
              ]}
            />

            <Input
              label="Number of Free Memorials Allowed"
              value={form.maxUses}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, maxUses: value }))
              }
            />

            <Input
              label="Promotional Code End Date"
              type="date"
              value={form.expiresAt}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, expiresAt: value }))
              }
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-stone-800">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
              >
                Create Promo Code
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-stone-900">
            Existing Promo Codes
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Plan</th>
                  <th className="py-3 pr-4">Uses</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="border-b border-stone-100">
                    <td className="py-3 pr-4 font-semibold">{code.code}</td>
                    <td className="py-3 pr-4">{code.contact_name || "-"}</td>
                    <td className="py-3 pr-4">{code.assigned_email || "-"}</td>
                    <td className="py-3 pr-4">{code.promotion_category || "-"}</td>
                    <td className="py-3 pr-4">{code.allowed_plan || "-"}</td>
                    <td className="py-3 pr-4">
                      {code.uses_count || 0}/{code.max_uses || 0}
                    </td>
                    <td className="py-3 pr-4">
                      {code.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(code)}
                        className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold hover:bg-stone-50"
                      >
                        {code.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}

                {codes.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-stone-500">
                      No promo codes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-stone-500"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}