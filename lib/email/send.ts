import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
}

export type HitEmailPayload = {
  to: string;
  userName: string;
  campgroundName: string;
  park: string;
  siteName: string;
  arriveDate: string;
  departDate: string;
  bookingUrl: string;
};

export async function sendHitEmail(p: HitEmailPayload) {
  const arriveDate = new Date(p.arriveDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const departDate = new Date(p.departDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const nights = Math.round(
    (new Date(p.departDate).getTime() - new Date(p.arriveDate).getTime()) / 86400000
  );

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden">
  <tr><td style="padding:10px 16px;background:#f4f4f0;color:#666;font-size:11px;border-bottom:1px solid #e5e5e5">
    CampSearch &nbsp;·&nbsp; alerts@campsearch.app &nbsp;·&nbsp; to ${p.to}
  </td></tr>
  <tr><td style="padding:32px 36px 24px">
    <div style="margin-bottom:32px">
      <span style="display:inline-block;width:28px;height:28px;border-radius:6px;background:#2D4A36;color:#FBF6EA;font-size:14px;line-height:28px;text-align:center">🌲</span>
      <strong style="font-size:14px;color:#2D4A36;vertical-align:top;line-height:28px;margin-left:8px">CampSearch</strong>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.2">
      Site found —<br>${p.campgroundName} ${p.siteName}
    </h1>
    <p style="color:#444;line-height:1.55;margin-bottom:24px;font-size:14px">
      ${p.userName}, a campsite matching your alert just opened up on Recreation.gov.
      These don't last — most are claimed within 3 minutes.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;font-size:13px;border-collapse:collapse">
      <tr style="border-top:1px solid #eee;border-bottom:1px solid #eee">
        <td style="padding:10px 0;color:#888;width:130px;font-size:12px">Campground</td>
        <td style="padding:10px 0;color:#1a1a1a;font-weight:500">${p.campgroundName}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:10px 0;color:#888;font-size:12px">Park</td>
        <td style="padding:10px 0;color:#1a1a1a;font-weight:500">${p.park}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:10px 0;color:#888;font-size:12px">Site</td>
        <td style="padding:10px 0;color:#1a1a1a;font-weight:500">${p.siteName}</td>
      </tr>
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:10px 0;color:#888;font-size:12px">Dates</td>
        <td style="padding:10px 0;color:#1a1a1a;font-weight:500">${arriveDate} → ${departDate} · ${nights} night${nights !== 1 ? "s" : ""}</td>
      </tr>
    </table>
    <a href="${p.bookingUrl}" style="display:inline-block;padding:14px 22px;background:#2D4A36;color:#FBF6EA;font-weight:600;border-radius:6px;text-decoration:none;margin-bottom:14px;font-size:14px">
      Book now on Recreation.gov →
    </a>
    <p style="font-size:12px;color:#888">
      Tip: have your Recreation.gov login handy. Sites at ${p.campgroundName} are usually claimed within 2–3 minutes of opening.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
    <p style="font-size:11px;color:#888;line-height:1.6">
      You're receiving this because a CampSearch alert matched.
      <a href="https://campsearch.vercel.app/dashboard" style="color:#2D4A36">Manage alerts</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return getResend().emails.send({
    from: "CampSearch <alerts@campsearch.app>",
    to: p.to,
    subject: `🏕 Site found — ${p.campgroundName} ${p.siteName}`,
    html,
  });
}
