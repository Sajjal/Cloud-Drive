const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const fsExtra = require("fs-extra");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

const db = require("grantha");
const dbToken = process.env.GRANTHA;

const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // start blocking after 3 requests
  message: {
    status: 429,
    Error: "429: Access Denied",
  },
});

const { verifyLogin, verifyCredentials } = require("../config/verify");

router.get("/", (req, res) => {
  return res.render("index");
});

router.post("/dashboard", verifyLogin, verifyCredentials, async (req, res) => {
  const directories = await db.getData({ token: dbToken, collection: "directories" });
  return res.json({ message: `Sajjal's Dashboard !`, directories });
});

router.post("/listDocument", verifyLogin, verifyCredentials, async (req, res) => {
  const documents = await db.searchData({ token: dbToken, collection: "uploads", data: { directory: req.body.directory } });
  return res.json({ documents });
});

router.post("/documentInfo", verifyLogin, verifyCredentials, async (req, res) => {
  const document = await db.searchData({ token: dbToken, collection: "uploads", data: { fileID: req.body.fileID } });
  return res.json({ document: document[0] });
});

router.post("/search", verifyLogin, verifyCredentials, async (req, res) => {
  const data = await db.searchData({
    token: dbToken,
    collection: "uploads",
    data: { fileName: { $regex: req.body.search, $options: "i" } },
  });
  return res.json({ data });
});

router.post("/login", createAccountLimiter, async (req, res) => {
  //const response = await axios.post(`${process.env.ACCESS_URL}`, { service: "personaldrive", uuid: req.body.accessCode });
  //if (!response.data.status) return res.status(400).json({ Error: "Invalid Access Code" });

  if (req.body.accessCode != process.env.ACCESS_CODE) return res.status(400).json({ Error: "Invalid Access Code" });
  const ipInfo = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const accessToken = jwt.sign({ id: "mrsajjal" }, process.env.TOKEN_SECRET, { expiresIn: "960s" }); //16 Minutes
  const record = { token: dbToken, collection: "userInfo", data: { user: "mrsajjal", login: Date.now(), location: ipInfo } };

  //Remove everything from temp directory (if any)
  fsExtra.emptyDirSync("public/temp");
  await fsExtra.outputFile("public/temp/temp.txt", "Temp files will be stored here!");

  //add login record to the database
  db.addData(record);

  //Save accessToken to Client's Browser Cookie and Redirect to Dashboard
  res.cookie("accessToken", accessToken).status(200).json({ message: "You are Logged In !" });
  //res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "strict" }).status(200).json({ message: "You are Logged In !" });
});

router.post("/logout", verifyLogin, async (req, res) => {
  //const token = req.cookies.accessToken;
  //await expiredToken(token);
  return res.cookie("accessToken", "", { maxAge: 1 }).status(400).json({ Error: "You are Logged out !", type: "login" });
});

module.exports = router;
