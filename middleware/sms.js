const axios = require('axios');

const sendSMS = async (message) => {
  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: process.env.ADMIN_MOBILE,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('SMS sent:', response.data);
    return { success: true, data: response.data };
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendSMS;
