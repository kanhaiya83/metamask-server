// import { Client, auth } from "twitter-api-sdk";
// import express from "express";
// import {config} from "dotenv"
// import cors from "cors"
const express=require("express")
const cors=require("cors")
require("dotenv").config()
const baseUrl = process.env.BASE_URL;
const callback = `${baseUrl}/callback`;
const state = "my-state";
const port = process.env.PORT || 5000;

const app = express();
app.use(cors())

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

if (!client_id) throw "Please add a CLIENT_ID environment variable in the Secrets section";
if (!client_secret) throw "Please add a CLIENT_SECRET environment variable in the Secrets section";
app.use("/user",userRoute)
// const authClient = new auth.OAuth2User({
//   client_id,
//   client_secret,
//   callback,
//   scopes: ["users.read", "tweet.read"],
// });

// const client = new Client(authClient);

// function renderProfile({ profile_image_url, name, description }) {
//   return `
// <head>
//   <style>
//     .profile {
//       width: 20%;
//       margin: auto;
//     }
//     .profile img {
//       width: 100%;
//     }
//     .container {
//       padding: 4px 15px;
//     }
//   </style>
// </head>

// <body>
// <div class="profile">
//   <img src="${profile_image_url}" alt="profile_image_url">
//   <div class="container">
//     <h4><b>${name}</b></h4>
//     <p>${description}</p>
//   </div>
// </div>
// </body>
// `;
// }

// app.get("/twitter", async function(req, res) {
//   const authUrl = authClient.generateAuthURL({
//     state,
//     code_challenge_method: "s256",
//   });
//   res.send({authUrl});
// });

// app.get("/callback", async function(req, res) {
//   try {
//     const { code, state } = req.query;
//     if (state !== state) return res.status(500).send("State isn't matching");
//     if (typeof code !== "string")
//       return res.status(500).send("Code isn't a string");
//     await authClient.requestAccessToken(code);
//     res.redirect("/me");
//   } catch (error) {
//     console.log(error);
//   }
// });

// app.get("/me", async function(req, res) {
//   const { data } = await client.users.findMyUser({
//     "user.fields": ["profile_image_url", "description", "name"],
//   });
//   if (!data) return res.status(500).send()
//   res.send(renderProfile({ profile_image_url: data.profile_image_url, name: data.name, description: data.description }));
// });

// app.get("/revoke", async function(req, res) {
//   try {
//     const response = await authClient.revokeAccessToken();
//     res.send(response);
//   } catch (error) {
//     console.log(error);
//   }
// });

app.listen(port, () => {
  console.log(`Open this link in a new window to login: ${baseUrl}`);})