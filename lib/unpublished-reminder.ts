export const SAMPLE_IDS = new Set([149, 195]);
const DAY = 24 * 60 * 60 * 1000;
export type Candidate = { id: number; owner_id: string | null; created_at: string; is_living_preplan: boolean | null; is_published: boolean | null; needs_review: boolean | null };
export function eligible(m: Candidate, now: number) {
  const created = Date.parse(m.created_at);
  return Number.isInteger(m.id) && !SAMPLE_IDS.has(m.id) && !!m.owner_id && m.is_living_preplan === false && m.is_published === false && Number.isFinite(created) && now - created >= 7 * DAY;
}
export function dueStage(m: Candidate, now: number, firstSent: boolean): 7 | 14 | null {
  if (!eligible(m, now)) return null;
  if (!firstSent) return 7;
  return now - Date.parse(m.created_at) >= 14 * DAY ? 14 : null;
}
export function reminderMessage(stage: 7 | 14, underReview: boolean) {
  const subject = stage === 7 ? 'A gentle reminder about your MyEMemorial' : 'A follow-up about your MyEMemorial';
  const action = underReview
    ? 'Your MyEMemorial is currently awaiting review before publication. You can sign in to check its status.'
    : "We noticed that your loved one’s MyEMemorial has not yet been published. If this was simply an oversight, you can sign in to your account whenever you’re ready to review it and complete the steps to publish.";
  const reassurance = "You don’t need to have every memory in place before sharing it. You can continue adding stories, photos, and other memories after publication, allowing their story to grow over time.";
  const text = `Hello,\n\n${action}\n\n${reassurance}\n\nManage your MyEMemorial: https://www.myememorial.com/my-memorials\n\nThank you for choosing MyEMemorial to help preserve your loved one’s story.\n\nWarmly,\nThe MyEMemorial Team\nWhere Life’s Stories Are Told`;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f0e9;font-family:Arial,sans-serif;color:#263a36"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e8e1d7;border-radius:10px"><tr><td align="center" style="padding:30px 24px 20px"><img src="https://www.myememorial.com/Images/myememorial-logo.png" width="360" alt="MyEMemorial — Where Life’s Stories Are Told" style="display:block;width:100%;max-width:360px;height:auto;border:0"></td></tr><tr><td style="padding:12px 34px 34px;font-size:16px;line-height:1.65"><p>Hello,</p><p>${action}</p><p>${reassurance}</p><p style="margin:30px 0"><a href="https://www.myememorial.com/my-memorials" style="background:#304d43;color:#fff;text-decoration:none;padding:14px 23px;border-radius:6px;display:inline-block;font-weight:bold">Manage MyEMemorial</a></p><p>Thank you for choosing MyEMemorial to help preserve your loved one’s story.</p><p>Warmly,<br>The MyEMemorial Team</p></td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}
