import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.sendGrid_API);

export const sendEmail = async({email, subject, message}) => {
  const msg = {
    to: email,
    from: process.env.Email_FROM,
    replyTo: process.env.Email_FROM,
    subject: subject,
    text: message
  };

  await sgMail.send(msg);
}

