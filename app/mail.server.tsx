import Mailjet from 'node-mailjet'
import invariant from 'tiny-invariant';

invariant(process.env.MAILJET_KEY, "Mailjet key is missing")
invariant(process.env.MAILJET_SECRET, "Mailjet key is missing")
console.log(process.env.MAILJET_SECRET)
export const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_KEY,
    apiSecret: process.env.MAILJET_SECRET
});

