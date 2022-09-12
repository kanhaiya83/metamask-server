require("dotenv").config()
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// These id's and secrets should come from .env file.
 const {GOOGLE_CLIENT_ID,
 GOOGLE_CLIENT_SECRET,
 GOOGLE_REDIRECT_URI,
 GOOGLE_REFRESH_TOKEN
} = process.env
console.log({GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN});
async function sendMail(receiver,subject,body) {
  try {
    
const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'airlyft404@gmail.com',
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken,
      },
      sendMail:true
    });

    const mailOptions = {
      from: 'Airlyft',
      to: receiver,
      subject: subject,
      text: body,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.log(error)
    return error;
  }
}



module.exports = sendMail