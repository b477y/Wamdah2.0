import { EventEmitter } from "node:events";
import sendEmail from "../email/send.email";
import welcomeTemplate from "../email/templates/welcome.template";
import purchaseConfirmationTemplate from "../email/templates/purchaseConfirmation.template";
import subscribeTemplate from "../email/templates/subscribe.template";

export const emailEvent = new EventEmitter();

emailEvent.on("sendWelcome", async ({ email, name }) => {
  await sendEmail({
    to: email,
    subject: "Welcome to our Platform!",
    html: welcomeTemplate({ name }),
  });
});

emailEvent.on("sendPurchaseConfirmation", async ({ email, name, credits }) => {
  await sendEmail({
    to: email,
    subject: "Purchase Confirmation",
    html: purchaseConfirmationTemplate({ name, credits }),
  });
});

emailEvent.on("subscribe", async ({ email }) => {
  await sendEmail({
    to: email,
    subject: "Subscription to newsletter",
    html: subscribeTemplate({ email }),
  });
});
