// Generates a VAPID keypair for Web Push and prints .env-ready lines.
// Run with: npm run vapid:generate
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nAdd these to your .env file:\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT="mailto:admin@example.com"`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(
  "\n(NEXT_PUBLIC_VAPID_PUBLIC_KEY must match VAPID_PUBLIC_KEY — it's the client-side copy exposed to the browser.)\n"
);
