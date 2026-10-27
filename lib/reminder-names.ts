/** Names are supplied by account holders and must be escaped in HTML emails. */
export function cleanReminderName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[\r\n\t]+/g, ' ').trim();
  return name ? name.slice(0, 100) : null;
}
export function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));
}
