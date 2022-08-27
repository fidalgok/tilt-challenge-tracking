import Mailjet, { SendEmailV3_1 } from 'node-mailjet'
import invariant from 'tiny-invariant';

invariant(process.env.MAILJET_KEY, "Mailjet key is missing")
invariant(process.env.MAILJET_SECRET, "Mailjet key is missing")


export const mailjet = new Mailjet({
    apiKey: process.env.MAILJET_KEY,
    apiSecret: process.env.MAILJET_SECRET
});

export async function sendTestEmail() {

    const data: SendEmailV3_1.IBody = {
        Messages: [
            {
                From: {
                    Email: 'support@tilt-challenges.com',
                },
                To: [
                    {
                        Email: 'kyle.fidalgo@gmail.com',
                    },
                ],

                Subject: 'Your email flight plan!',
                HTMLPart: '<h3>Dear passenger, welcome to Mailjet!</h3><br />May the delivery force be with you!',
                TextPart: 'Dear passenger, welcome to Mailjet! May the delivery force be with you!',
            },
        ],
    };

    const result = await mailjet
        .post('send', { version: 'v3.1' })
        .request({ ...data });

    const status = result.body;
    //console.log(status)

}

export async function sendRecoveryEmail(email: string, resetToken: string) {
    let params = new URLSearchParams({ token: resetToken });
    const data: SendEmailV3_1.IBody = {
        Messages: [
            {
                From: {
                    Email: 'support@tilt-challenges.com',
                },
                To: [
                    {
                        Email: email,
                    },
                ],

                Subject: 'Your password reset request',
                HTMLPart: `<h3>Looks like you are having problems logging in!</h3>
          <p>Here is your reset link:</p>
          <p><a href="https://tilt-challenges.com/reset-password?${params}">
          https://tilt-challenges.com/reset-password?${params}
          </a></p>`,
                TextPart: `It looks like you're having trouble logging in! Here is your reset link: https://tilt-challenges.com/reset-password?${params}`,
            },
        ],
    };

    const result = await mailjet
        .post('send', { version: 'v3.1' })
        .request({ ...data });

    const status = result.body;
    console.log(status)
}

