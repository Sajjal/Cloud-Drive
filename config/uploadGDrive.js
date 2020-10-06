const fs = require("fs");
const { google } = require("googleapis");

const TOKEN_PATH = "token.json";
let auth;

async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  const after = new Promise((resolve, reject) => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return;
      oAuth2Client.setCredentials(JSON.parse(token));
      auth = oAuth2Client;
      resolve(auth);
    });
  });
  await after;
  return after;
}

module.exports = { authorize };
