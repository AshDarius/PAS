# KALTA remote notification prototype

The GitHub Pages PWA remains at:

https://ashdarius.github.io/PAS/kaltaos/

Vercel runs the API functions. Upstash Redis stores registered push subscriptions.

## 1. Import the GitHub project into Vercel

1. Sign in at https://vercel.com/
2. Choose **Add New → Project**.
3. Import the GitHub repository **AshDarius/PAS**.
4. Set **Root Directory** to `kaltaos`.
5. Use the **Other** framework preset.
6. Leave the build command empty. The project uses Vercel Node.js functions in the `api` folder.
7. Deploy.

The Vercel project will serve the prototype files too, but the public PWA can continue to be used from GitHub Pages.

## 2. Create the subscription database

1. Sign in at https://upstash.com/
2. Create a Redis database.
3. Choose a region close to your Vercel deployment.
4. Open the database's **REST API** section.
5. Copy the REST URL and REST token. Add both to Vercel as environment variables in the next step.

Do not put either value in GitHub or in the PWA.

## 3. Generate VAPID keys

On your Windows computer, open PowerShell in any folder and run:

```powershell
npx --yes web-push generate-vapid-keys
```

This prints a **Public Key** and a **Private Key**. Keep the private key secret. The public key is used by the PWA through the Vercel config endpoint.

## 4. Add Vercel environment variables

In Vercel, open your project:

**Settings → Environment Variables**

Add these variables for **Production** (and Preview too if you plan to test preview deployments):

| Name | Value |
|---|---|
| `ALLOWED_ORIGIN` | `https://ashdarius.github.io` |
| `VAPID_PUBLIC_KEY` | Public key generated in step 3 |
| `VAPID_PRIVATE_KEY` | Private key generated in step 3 |
| `VAPID_SUBJECT` | `mailto:ash@ashdarius.com` |
| `SEND_API_TOKEN` | A long random secret you create |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

To create a strong send token in PowerShell:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Copy the output into the `SEND_API_TOKEN` environment variable. Keep it private. You will enter it into the PWA only when sending a message.

After adding or changing environment variables, redeploy the project from **Deployments → Redeploy**.

## 5. Check the API

Replace the example hostname with your actual Vercel deployment hostname:

- `https://YOUR-PROJECT.vercel.app/api/config`

A working config endpoint returns JSON containing a `publicKey`. It must not return an error.

The other endpoints are:

- `POST /api/subscribe` — saves a device subscription.
- `POST /api/send` — sends a notification; requires the private send token.

## 6. Connect the phone

1. Open the GitHub Pages PWA on the Android phone:
   `https://ashdarius.github.io/PAS/kaltaos/`
2. In **Remote notification**, enter the Vercel project address, for example `https://YOUR-PROJECT.vercel.app`. Do not add `/api` to the end.
3. Tap **Enable notifications** and allow the browser permission request.
4. The Push subscription status should change to **Registered**.

Repeat this on any other device that should receive KALTA notifications.

## 7. Send a remote test

1. Enter a title and message in the Test notification section.
2. In Private send token, enter the value you saved as `SEND_API_TOKEN`.
3. Tap **Send remote notification**.

The phone should receive the notification even when the PWA is not open. Tapping it should open KALTA and show the message.

## Security notes

- Never commit VAPID private key, Upstash credentials, or `SEND_API_TOKEN` to GitHub.
- The public VAPID key is not secret and is returned by `/api/config`.
- The send token is not stored by the PWA; it is cleared after a successful send.
- Anyone who has the send token can send notifications to all registered devices. Rotate it in Vercel if it is exposed.
- This prototype uses internet-based Web Push. It is not an offline notification system.
