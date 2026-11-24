const nodemailer = require("nodemailer");

const FROM = process.env.MAIL_FROM || "superb.diamonds@gmail.com";

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: FROM, pass: process.env.TWO_FACTOR_AUTH },
    });
  }
  return transporter;
};

const COPY = {
  signup: {
    subject: "Verify your email address",
    heading: "Email Verification",
    intro: "Thank you for signing up with Superb Diamonds. To complete your registration, use this one-time password:",
  },
  reset: {
    subject: "Reset your Superb Diamonds password",
    heading: "Password Reset",
    intro: "We received a request to reset your password. Use this one-time password to choose a new one:",
  },
};

const sendOtpEmail = async (to, otp, purpose, minutes) => {
  const c = COPY[purpose];
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${c.heading}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#16202c;max-width:600px;margin:0 auto;padding:24px;background:#f6f7fb">
  <div style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#0c3c60;margin-bottom:16px">Superb Diamonds</div>
  <div style="background:#ffffff;border-radius:12px;padding:24px;border:1px solid #e3e8ef">
    <h2 style="margin-top:0;color:#0c3c60">${c.heading}</h2>
    <p>${c.intro}</p>
    <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0c3c60;text-align:center;margin:24px 0;padding:14px;background:#f3ead8;border-radius:8px">${otp}</div>
    <p>This code expires in ${minutes} minutes. If you didn't request it, you can ignore this email.</p>
  </div>
  <p style="color:#5b6776">Best regards,<br>The Superb Diamonds Team</p>
</body></html>`;

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: c.subject,
    text: `${c.intro} ${otp}. It expires in ${minutes} minutes.`,
    html,
  });
};

module.exports = { sendOtpEmail };
