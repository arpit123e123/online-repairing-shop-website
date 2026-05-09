const nodemailer = require("nodemailer");

const currency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const configured = (value) => Boolean(String(value || "").trim());

const getOrderId = (order) => order._id?.toString?.() || order.id || "new-order";

const getAddressText = (address = {}) => {
  return [
    address.fullName,
    address.phone,
    address.line1,
    address.city,
    address.pincode
  ].filter(Boolean).join(", ");
};

const getItemsText = (items = []) => {
  return items
    .map((item) => `${item.name} x ${item.quantity} - ${currency(item.price * item.quantity)}`)
    .join("\n");
};

const getItemsHtml = (items = []) => {
  return items
    .map((item) => (
      `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${currency(item.price * item.quantity)}</td>
      </tr>`
    ))
    .join("");
};

const createTransporter = () => {
  if (!configured(process.env.SMTP_HOST) || !configured(process.env.SMTP_USER) || !configured(process.env.SMTP_PASS)) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const buildEmail = (order, recipientType) => {
  const orderId = getOrderId(order);
  const customerName = order.customer?.name || order.address?.fullName || "Customer";
  const subjectPrefix = recipientType === "seller" ? "New order received" : "Order confirmed";
  const intro = recipientType === "seller"
    ? `A new order has been placed by ${customerName}.`
    : `Hi ${customerName}, your order has been placed successfully.`;

  const text = `${intro}

Order ID: ${orderId}
Total: ${currency(order.total)}
Payment: ${(order.paymentMethod || "cod").toUpperCase()}
Address: ${getAddressText(order.address)}

Items:
${getItemsText(order.items)}
`;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 8px;">${subjectPrefix}</h2>
      <p style="margin:0 0 16px;">${intro}</p>
      <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:16px;">
        <p style="margin:0 0 6px;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin:0 0 6px;"><strong>Total:</strong> ${currency(order.total)}</p>
        <p style="margin:0;"><strong>Payment:</strong> ${(order.paymentMethod || "cod").toUpperCase()}</p>
      </div>
      <h3 style="margin:0 0 8px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>${getItemsHtml(order.items)}</tbody>
      </table>
      <h3 style="margin:0 0 8px;">Delivery address</h3>
      <p style="margin:0;">${getAddressText(order.address)}</p>
    </div>
  `;

  return { subject: `${subjectPrefix} - ${orderId}`, text, html };
};

const sendOrderEmails = async (order) => {
  const transporter = createTransporter();
  if (!transporter) {
    return { skipped: true, reason: "SMTP settings missing" };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const recipients = [
    {
      to: order.customer?.email,
      type: "customer"
    },
    {
      to: process.env.SELLER_EMAIL,
      type: "seller"
    }
  ].filter((recipient) => configured(recipient.to));

  if (recipients.length === 0) {
    return { skipped: true, reason: "No email recipients configured" };
  }

  const results = await Promise.allSettled(
    recipients.map((recipient) => {
      const email = buildEmail(order, recipient.type);
      return transporter.sendMail({
        from,
        to: recipient.to,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
    })
  );

  return {
    sent: results.filter((result) => result.status === "fulfilled").length,
    failed: results.filter((result) => result.status === "rejected").length
  };
};

const normalizePhone = (phone) => {
  const rawPhone = String(phone || "").trim();
  const countryCode = process.env.DEFAULT_COUNTRY_CODE || "+91";

  if (!rawPhone) return "";
  if (rawPhone.startsWith("+")) return rawPhone.replace(/[^\d+]/g, "");

  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) return `${countryCode}${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return "";
};

const sendSms = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;

  if (!configured(accountSid) || !configured(authToken) || !configured(from)) {
    return { skipped: true, reason: "Twilio settings missing" };
  }

  if (typeof fetch !== "function") {
    return { skipped: true, reason: "Node fetch API missing" };
  }

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) return { skipped: true, reason: "Invalid phone number" };

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: from,
      To: normalizedTo,
      Body: body
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio SMS failed: ${response.status} ${text}`);
  }

  return { sent: true };
};

const sendOrderSms = async (order) => {
  const orderId = getOrderId(order);
  const sellerPhone = process.env.SELLER_PHONE;
  const customerPhone = order.address?.phone;
  const total = currency(order.total);

  const messages = [
    {
      to: customerPhone,
      body: `Patwa Repair Shop: Your order ${orderId} is placed. Total ${total}.`
    },
    {
      to: sellerPhone,
      body: `New order ${orderId}: ${order.customer?.name || order.address?.fullName || "Customer"} placed an order of ${total}. Phone: ${order.address?.phone || "N/A"}.`
    }
  ].filter((message) => configured(message.to));

  if (messages.length === 0) {
    return { skipped: true, reason: "No SMS recipients configured" };
  }

  const results = await Promise.allSettled(messages.map((message) => sendSms(message.to, message.body)));

  return {
    sent: results.filter((result) => result.status === "fulfilled" && !result.value?.skipped).length,
    failed: results.filter((result) => result.status === "rejected").length,
    skipped: results.filter((result) => result.status === "fulfilled" && result.value?.skipped).length
  };
};

const notifyOrderPlaced = async (order) => {
  const [email, sms] = await Promise.allSettled([
    sendOrderEmails(order),
    sendOrderSms(order)
  ]);

  const result = {
    email: email.status === "fulfilled" ? email.value : { failed: true, error: email.reason.message },
    sms: sms.status === "fulfilled" ? sms.value : { failed: true, error: sms.reason.message }
  };

  if (email.status === "rejected" || sms.status === "rejected") {
    console.warn("Order notification issue:", result);
  } else {
    console.info("Order notification result:", result);
  }

  return result;
};

module.exports = {
  notifyOrderPlaced
};
