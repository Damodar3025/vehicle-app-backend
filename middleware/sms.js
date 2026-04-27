const axios = require('axios');

const sendSMS = async (message) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = 'whatsapp:+14155238886';
    const to = `whatsapp:+91${process.env.ADMIN_MOBILE}`;

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({ From: from, To: to, Body: message }),
      { auth: { username: accountSid, password: authToken } }
    );
    console.log('WhatsApp sent:', response.data.sid);
    return { success: true };
  } catch (err) {
    console.error('WhatsApp error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendSMS;