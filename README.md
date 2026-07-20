# NoirWeb Studio

## Inquiry delivery setup

The contact form submits JSON to the server-side Netlify Function at `/api/inquiry`. The function validates every field and sends the inquiry through Resend. The Resend API key is never included in browser code.

Before deploying, add these site environment variables in **Netlify → Project configuration → Environment variables**. Make them available to the **Functions** scope (or all scopes) and to the Production deploy context:

| Variable | Required value |
| --- | --- |
| `RESEND_API_KEY` | A Resend API key with send permission. Mark it as a secret. |
| `INQUIRY_TO_EMAIL` | `noirwebstudio@gmail.com` |
| `INQUIRY_FROM_EMAIL` | A sender on a domain verified in Resend, for example `NoirWeb Studio <inquiries@yourdomain.com>`. |

After adding or changing variables, trigger a new production deploy so the function receives them. Do not place real values in `.env.example`, `netlify.toml`, `script.js`, or any committed file.

## Verification

Run the automated function tests with:

```sh
node --test tests/inquiry.test.mjs
```

After the production deploy, submit a clearly labeled test inquiry on the live site and confirm both the inline success message and delivery to `noirwebstudio@gmail.com`.
