import { createHmac, timingSafeEqual } from "node:crypto";
import { escapeEmailHtml } from "./reminder-names";
import { ownerAnnouncementSkyImage } from "./owner-announcement-sky-image";

export function unsubscribeToken(ownerId: string, secret: string): string {
  return createHmac("sha256", secret).update(`owner-announcement:${ownerId}`).digest("hex");
}
export function verifyUnsubscribeToken(ownerId: string, token: string, secret: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(token)) return false;
  const expected = Buffer.from(unsubscribeToken(ownerId, secret), "hex");
  const supplied = Buffer.from(token, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
export function announcementMessage(name: string, body: string, ownerId: string, secret: string) {
  const url = `https://www.myememorial.com/api/owner-announcements/unsubscribe?owner=${encodeURIComponent(ownerId)}&token=${unsubscribeToken(ownerId, secret)}`;
  const text = `Hello ${name},\n\n${body}\n\nManage your MyEMemorial: https://www.myememorial.com/my-memorials\n\nWarmly,\nThe MyEMemorial Team\n\nUnsubscribe from improvement announcements: ${url}`;
  const safeBody = escapeEmailHtml(body).replace(/\r\n|\r|\n/g, "<br>");
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#dcecf8;color:#263a36;font-family:Arial,sans-serif;font-size:16px;line-height:1.65"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#dcecf8" background="https://www.myememorial.com/Images/home-sky-clouds.webp" style="background-color:#dcecf8;background-image:url('https://www.myememorial.com/Images/home-sky-clouds.webp');background-position:center center;background-size:cover;background-repeat:no-repeat"><tr><td align="center" style="padding:32px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff"><tr><td align="center" style="padding:0"><img src="cid:myememorial-sky-banner" alt="" width="600" height="120" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr><tr><td align="center" style="padding:28px 20px 16px"><img src="https://www.myememorial.com/Images/myememorial-logo.png" alt="MyEMemorial" width="400" style="display:block;width:100%;max-width:400px;height:auto;border:0"></td></tr><tr><td style="padding:12px 34px 34px;font-family:Arial,sans-serif;font-size:16px;line-height:1.65;color:#263a36"><p>Hello ${escapeEmailHtml(name)},</p><p>${safeBody}</p><p><a href="https://www.myememorial.com/my-memorials">Manage MyEMemorial</a></p><p>Warmly,<br>The MyEMemorial Team</p><p><a href="${escapeEmailHtml(url)}">Unsubscribe from improvement announcements</a></p></td></tr></table></td></tr></table></body></html>`;
  return { text, html, attachments: [{ filename: "myememorial-sky.jpg", content: Buffer.from(ownerAnnouncementSkyImage, "base64"), cid: "myememorial-sky-banner", contentDisposition: "inline" as const }] };
}
