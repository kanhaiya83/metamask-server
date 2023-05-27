require("dotenv").config()
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const axios = require("axios")
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
    
    const res = await axios.post("https://api.brevo.com/v3/smtp/email",{
      sender:{
        email:"ankitdhaker00@gamil.com"
      },
      to:[{
        email:receiver
      }],
      "subject":subject,
   "htmlContent":body
    },{headers:{
      accept:"application/json",
      "api-key":"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",
      "content-type": "application/json"
    }})

console.log(res.data);
    return res.data;
  } catch (error) {
    console.log(error)
    return error;
  }
}

// sendMail("kanhaiya2778@gmail.com","hello","hello")

module.exports = sendMail