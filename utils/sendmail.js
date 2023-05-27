require("dotenv").config()
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const axios = require("axios")

async function sendMail(receiver,subject,body) {
  console.log({subject,receiver,body:body.toString()});
  try {
    
    const res = await axios.post("https://api.brevo.com/v3/smtp/email",{
      sender:{
        email:"ankitdhaker00@gamil.com"
      },
      to:[{
        email:receiver
      }],
      "subject":subject,
   "htmlContent":"<p>"+body.toString() +"</p>"
    },{headers:{
      accept:"application/json",
      "api-key":process.env.BREVO_API_KEY,
      "content-type": "application/json"
    }})

console.log(res.data);
    return res.data;
  } catch (error) {
    console.log(error)
    return error;
  }
}

// sendMail("ankitdhaker000@gmail.com","hello",'Your Airlyft Campaign Manager password: "uzzlPmecR9KRt3qQ\n' +
//     '    Login here : https://demo-202.netlify.app/manager/login')

module.exports = sendMail