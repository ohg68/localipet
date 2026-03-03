export interface NotificationPayload {
    to: string; // Phone number, Telegram ID, or Expo Push Token
    message: string;
    type: "whatsapp" | "telegram" | "sms" | "expo";
    title?: string;
    data?: any;
}

export async function sendNotification(payload: NotificationPayload) {
    const { to, message, type, title, data } = payload;

    console.log(`Sending ${type} notification to ${to}: ${message}`);

    try {
        if (type === "telegram") {
            await sendTelegram(to, message);
        } else if (type === "whatsapp") {
            await sendWhatsApp(to, message);
        } else if (type === "sms") {
            await sendSMS(to, message);
        } else if (type === "expo") {
            await sendExpoPush(to, title || 'Localipet', message, data);
        }
    } catch (error) {
        console.error(`Failed to send ${type} notification:`, error);
    }
}

async function sendExpoPush(expoPushToken: string, title: string, body: string, data: any = {}) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });

    if (!response.ok) {
        throw new Error(`Expo Push API Error: ${await response.text()}`);
    }
}

async function sendTelegram(chatId: string, message: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.warn("TELEGRAM_BOT_TOKEN not set");
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
        }),
    });
}

async function sendWhatsApp(to: string, message: string) {
    // Example using Twilio or Meta API
    // For now, let's just log or use a placeholder
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !from) {
        console.warn("Twilio credentials for WhatsApp not set");
        return;
    }

    // Twilio implementation would go here
    console.log("Twilio WhatsApp integration placeholder");
}

async function sendSMS(to: string, message: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
        console.warn("Twilio credentials for SMS not set");
        return;
    }

    // Twilio implementation would go here
    console.log("Twilio SMS integration placeholder");
}
