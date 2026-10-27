"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Counts = { eligible: number; missingName: number; optedOut: number; unavailable: number; sent: number; failed: number; remaining: number; waitingForRateLimit?: boolean };
export default function OwnerAnnouncementsClient() {
  const [allowed, setAllowed] = useState(false), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState(""), [body, setBody] = useState(""), [message, setMessage] = useState("");
  const [counts, setCounts] = useState<Counts | null>(null), [reviewed, setReviewed] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState("");
  useEffect(() => { setActiveCampaignId(sessionStorage.getItem("ownerAnnouncementCampaignId") || ""); }, []);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { setAllowed(data.user?.email?.toLowerCase() === "mike@realchoicerealestate.com"); setLoading(false); }); }, []);
  async function request(action: string, campaignId?: string): Promise<Counts & { testSent?: boolean }> {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) throw new Error("Please sign in again.");
    const response = await fetch("/api/admin/owner-announcements", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ action, subject, body, campaignId }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not complete request.");
    return result;
  }
  async function preview() { setBusy(true); setMessage(""); setReviewed(false); try { const result = await request("preview"); setCounts(result); setReviewed(true); } catch (error) { setMessage(error instanceof Error ? error.message : "Preview failed."); } finally { setBusy(false); } }
  async function test() { setBusy(true); setMessage(""); try { await request("test"); setMessage("Test email sent to the admin email address."); } catch (error) { setMessage(error instanceof Error ? error.message : "Test failed."); } finally { setBusy(false); } }
  async function loadCampaign() {
    if (!activeCampaignId.trim()) return;
    setBusy(true); setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/owner-announcements", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ action: "load", campaignId: activeCampaignId.trim() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load campaign.");
      setSubject(result.subject); setBody(result.body); setReviewed(false); setCounts(null);
      sessionStorage.setItem("ownerAnnouncementCampaignId", activeCampaignId.trim());
      setMessage("Campaign loaded. Review recipients before resuming. Previously claimed deliveries will not be sent again.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load campaign."); }
    finally { setBusy(false); }
  }
  async function send() {
    if (!reviewed || !counts || !counts.eligible) return;
    if (!window.confirm(`Send this announcement to up to ${counts.eligible} eligible owners? Each email uses the owner’s first name.`)) return;
    setBusy(true); setMessage(""); let sent = 0, failed = 0; const campaignId = activeCampaignId.trim() || crypto.randomUUID();
    setActiveCampaignId(campaignId); sessionStorage.setItem("ownerAnnouncementCampaignId", campaignId);
    try {
      let remaining: number;
      do {
        const result = await request("send", campaignId);
        sent += result.sent;
        failed += result.failed;
        remaining = result.remaining;
        setMessage(`Sent ${sent}; ${failed} need review; ${remaining} remaining. Keep this page open while sending.`);
        if (result.unavailable || result.failed) throw new Error("Some deliveries need review. Sending stopped; do not resend this campaign automatically.");
        // The server pauses for 120 seconds after 25 messages across requests.
        // Poll only while a batch is paused; never reset the campaign ID.
        if (remaining > 0 && result.waitingForRateLimit) {
          setMessage(`Sent ${sent}; ${remaining} remaining. Waiting before the next group. Keep this page open.`);
          await new Promise((resolve) => setTimeout(resolve, 5200));
        }
      } while (remaining > 0);
      setMessage(`Finished. Sent ${sent} personalized emails. ${counts.missingName} owners without a name were skipped.`); setReviewed(false); setActiveCampaignId(""); sessionStorage.removeItem("ownerAnnouncementCampaignId");
    } catch (error) { setMessage(`${error instanceof Error ? error.message : "Sending stopped."} Campaign ID: ${campaignId}. Sent in this run: ${sent}.`); setReviewed(false); }
    finally { setBusy(false); }
  }
  if (loading) return <main className="p-8 text-base">Loading…</main>;
  if (!allowed) return <main className="p-8 text-base">Please sign in as the MyEMemorial administrator.</main>;
  return <main className="min-h-screen bg-stone-100 p-4 sm:p-8"><section className="mx-auto max-w-3xl rounded-2xl bg-white p-6"><h1 className="text-3xl font-bold">Email Memorial Owners</h1><p className="mt-3 text-base">Write a website update. The email includes the MyEMemorial logo, a personalized greeting, a management link, and an unsubscribe link.</p>
    <label className="mt-6 block text-base font-semibold">Subject<input maxLength={180} value={subject} onChange={e => { setSubject(e.target.value); setReviewed(false); }} className="mt-2 block w-full rounded-lg border border-stone-400 p-3 text-base" /></label>
    <label className="mt-5 block text-base font-semibold">Message<textarea rows={10} maxLength={12000} value={body} onChange={e => { setBody(e.target.value); setReviewed(false); }} className="mt-2 block w-full rounded-lg border border-stone-400 p-3 text-base" /></label>
    <div className="mt-6 rounded-xl bg-stone-50 p-5 text-base"><p className="font-semibold">Message preview</p><p className="mt-3">Hello Mike,</p><p className="mt-3 whitespace-pre-wrap">{body || "Your message will appear here."}</p><p className="mt-3">Warmly,<br />The MyEMemorial Team</p></div>
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} onClick={() => void preview()} className="rounded-lg bg-stone-800 px-4 py-3 text-base text-white disabled:opacity-50">Review recipients</button><button disabled={busy} onClick={() => void test()} className="rounded-lg border border-stone-500 px-4 py-3 text-base disabled:opacity-50">Send test to me</button><button disabled={busy || !reviewed || !counts?.eligible} onClick={() => void send()} className="rounded-lg bg-emerald-800 px-4 py-3 text-base text-white disabled:opacity-50">Send announcement</button></div>
    {counts && <p className="mt-4 text-base">Eligible: {counts.eligible} · Missing name: {counts.missingName} · Unsubscribed: {counts.optedOut} · Unavailable: {counts.unavailable}</p>}
    <div className="mt-6 rounded-xl border border-stone-300 p-4"><label className="block text-base font-semibold">Paused campaign ID<input value={activeCampaignId} onChange={(e) => { setActiveCampaignId(e.target.value); setReviewed(false); }} className="mt-2 block w-full rounded-lg border border-stone-400 p-3 text-base" placeholder="Campaign ID" /></label><button disabled={busy || !activeCampaignId.trim()} onClick={() => void loadCampaign()} className="mt-3 rounded-lg border border-stone-500 px-4 py-2 text-base disabled:opacity-50">Load paused campaign</button><p className="mt-2 text-base text-stone-700">If sending stops, load the same campaign before continuing. Failed or uncertain deliveries must be reviewed first.</p></div>
    {message && <p role="status" className="mt-4 text-base">{message}</p>}
  </section></main>;
}
