import nodemailer from "nodemailer";

const sendEmail = async ({
  to = [],
  cc = [],
  bcc = [],
  subject = "",
  text = "",
  html = "",
  attachments = [],
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAILER_USER,
      pass: process.env.MAILER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: `"Support Team" <${process.env.MAILER_USER}>`,
    to,
    cc,
    bcc,
    subject,
    text,
    html,
    attachments,
  });

  return info;
};

export default sendEmail;
