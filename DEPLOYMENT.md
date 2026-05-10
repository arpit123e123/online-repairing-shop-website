# Deployment

## Backend

Set these environment variables on your backend host:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/online-shop
AUTH_SECRET=use-a-long-random-secret
PORT=5000
SELLER_EMAIL=owner@example.com
SELLER_PHONE=+919999999999
DEFAULT_COUNTRY_CODE=+91
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=Patwa Repair Shop <your-email@gmail.com>
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_PHONE=+1234567890
```

Start command:

```bash
npm run server
```

## Frontend

Set this environment variable on your frontend host:

```env
VITE_API_URL=https://online-repairing-shop-website.onrender.com/api
```

If you set only `https://online-repairing-shop-website.onrender.com`, the app will add `/api` automatically.

Build command:

```bash
npm run build --prefix frontend
```

Output directory:

```text
frontend/dist
```

## Local Run

```bash
npm run server
npm run client
```

Open:

```text
http://127.0.0.1:5173
```
