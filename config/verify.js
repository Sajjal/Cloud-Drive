const fs = require("fs");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

async function verifyCredentials(req, res, next) {
  fs.readFile("credentials.json", async (err, content) => {
    if (err) return res.status(400).json({ Error: "Paste Google Credentials", type: "credentials" });
    else {
      try {
        JSON.parse(content);
      } catch {
        return res.status(400).json({ Error: "Invalid Credentials", type: "credentials" });
      }
      fs.readFile("token.json", async (err, content) => {
        if (err) {
          fs.readFile("credentials.json", async (err, content) => {
            try {
              content = JSON.parse(content);
              const { client_secret, client_id, redirect_uris } = content.web;
              const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
              const authUrl = oAuth2Client.generateAuthUrl({ access_type: "offline", scope: SCOPES });
              return res
                .status(400)
                .json({ Message: "Only Copy Code", Code: req.query, Error: "Generate Token", URL: authUrl, type: "token" });
            } catch {
              return res.status(400).json({ Error: "Paste Google Credentials" });
            }
          });
        } else {
          try {
            JSON.parse(content);
            next();
          } catch {
            return res.status(400).json({ Error: "Invalid Token", type: "token" });
          }
        }
      });
    }
  });
}

async function verifyLogin(req, res, next) {
  const token = req.cookies.accessToken;

  if (!token) return res.status(400).json({ Error: "Enter Access Code", type: "login" });
  //Verify token and Allow access if Everything is good
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verified;
    next();
  } catch {
    return res.status(400).json({ Error: "Enter Access Code", type: "login" });
  }
}

module.exports = { verifyCredentials, verifyLogin };
