const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");
const crypto = require("crypto");
const { Transform } = require("stream");
const { google } = require("googleapis");

const { authorize } = require("../config/uploadGDrive");
const { verifyLogin } = require("../config/verify");

const db = require("grantha");
const dbToken = process.env.GRANTHA;

/**************** Setup Encryption **************************/

const password = process.env.PASSWORD;

function getCipherKey(password) {
  return crypto.createHash("sha256").update(password).digest();
}

class AppendInitializationVector extends Transform {
  constructor(initVect, opts) {
    super(opts);
    this.initVect = initVect;
    this.appended = false;
  }
  _transform(chunk, encoding, cb) {
    if (!this.appended) {
      this.push(this.initVect);
      this.appended = true;
    }
    this.push(chunk);
    cb();
  }
}

/**************** Setup Multer **************************/
const maxSize = 11 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "application/pdf" ||
      file.mimetype == "application/zip"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("File format not supported!"));
    }
  },
}).array("filepond");

/**************** configure Google Drive **************************/
const TOKEN_PATH = "token.json";
async function configure() {
  try {
    const content = fs.readFileSync("credentials.json", "utf8");
    JSON.parse(content);

    const tokenFile = fs.readFileSync("token.json", "utf8");
    JSON.parse(tokenFile);

    auth = await authorize(JSON.parse(content));
    drive = google.drive({ version: "v3", auth });
  } catch (err) {
    drive = null;
  }
  return drive;
}

/**************** Setup Routes **************************/

router.post("/", verifyLogin, (req, res) => {
  if (req.body.type == "credentials") {
    fs.writeFile("credentials.json", req.body.credentials, (err) => {
      if (err) return;
    });
    return res.json({ Message: "Success" });
  } else if (req.body.type == "token") {
    fs.readFile("credentials.json", async (err, content) => {
      if (err) return console.log("Unable to Read credentials.json");
      content = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = content.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      oAuth2Client.getToken(req.body.token, (err, token) => {
        if (err) {
          //console.error("Error retrieving access token");
          return res.json({ Message: "Token Error" });
        } else {
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            //console.log("Token stored to", TOKEN_PATH);
            res.json({ Message: "Success" });
          });
        }
      });
    });
  }
  return;
});

router.post("/upload", verifyLogin, async (req, res) => {
  upload(req, res, async function (err) {
    const drive = await configure();
    if (!drive) return res.status(400).json({ Error: "Error on Upload!" });

    const directory = req.header("directory");
    const oldDirectory = { token: dbToken, collection: "directories", data: { directory } };
    const result = await db.searchData(oldDirectory);
    if (result.length < 1) await db.addData(oldDirectory);

    if (err instanceof multer.MulterError) {
      return res.status(400).json(err);
    } else if (err) {
      return res.status(400).json(err);
    }
    req.files.forEach(async function (document) {
      //Compress and Encrypt Each file
      const initVect = crypto.randomBytes(16);
      // Generate a cipher key from the password.
      const CIPHER_KEY = getCipherKey(password);
      const readStream = fs.createReadStream(document.path);
      const gzip = zlib.createGzip();
      const cipher = crypto.createCipheriv("aes256", CIPHER_KEY, initVect);
      const appendInitVect = new AppendInitializationVector(initVect);
      // Create a write stream with a different file extension.
      const writeStream = fs.createWriteStream(path.join(document.path + ".enc"));
      readStream.pipe(gzip).pipe(cipher).pipe(appendInitVect).pipe(writeStream);
      //Upload file to Google Drive after Encryption
      writeStream.on("finish", async function () {
        let fileMetadata = { name: document.filename };
        let media = { mimeType: "application/enc", body: fs.createReadStream(`${document.path}.enc`) };

        drive.files.create({ resource: fileMetadata, media: media, fields: "id" }, function (err, file) {
          if (err) {
            console.error("Error uploading file!");
            return res.status(400).json(err);
          } else {
            //console.log("File Id: ", file.data.id);
            //Add record to DB
            const record = {
              token: dbToken,
              collection: "uploads",
              data: {
                user: req.user.id,
                date: Date.now(),
                fileID: file.data.id,
                fileName: document.filename.toString(),
                fileSize: `${(document.size / 1024 / 1024).toFixed(2)} MB`,
                directory,
              },
            };
            db.addData(record);
            //Remove files after upload is complete
            fs.unlink(`${document.path}.enc`, (err) => {});
            fs.unlink(document.path, (err) => {});
            res.status(200).json({ Message: "Success" });
          }
        });
      });
    });
  });
});

router.get("/download", verifyLogin, async function (req, res) {
  const drive = await configure();
  if (!drive) return res.status(400).json({ Error: "Error on Download!" });

  let fileID = req.query.fileID;
  if (!fileID) return res.status(400).json({ Error: "File ID is Required" });

  let document = await db.searchData({ token: dbToken, collection: "uploads", data: { fileID } });
  fileName = document[0].fileName;

  const writeStream = fs.createWriteStream(`./public/temp/${fileName}.enc`);
  drive.files
    .get({ fileId: fileID, alt: "media" }, { responseType: "stream" })
    .then((driveResponse) => {
      driveResponse.data
        .on("end", () => {
          //console.log(" Done downloading file.");
        })
        .on("error", (err) => {
          res.status(400).json("Error downloading file.");
        })
        .pipe(writeStream);
    })
    .catch((err) => res.status(400).json({ Error: "Some Error Detected" }));

  //Decrypt file after Download is complete
  writeStream.on("finish", async function () {
    // First, get the initialization vector from the file.
    const file = writeStream.path;
    const readInitVect = fs.createReadStream(file, { end: 15 });
    let initVect;
    readInitVect.on("data", (chunk) => {
      initVect = chunk;
    });

    // Once we’ve got the initialization vector, we can decrypt the file.
    readInitVect.on("close", () => {
      const cipherKey = getCipherKey(password);
      const readStream = fs.createReadStream(file, { start: 16 });
      const decipher = crypto.createDecipheriv("aes256", cipherKey, initVect);
      const unzip = zlib.createUnzip();
      const writeStream = fs.createWriteStream(file.slice(0, -4));
      readStream.pipe(decipher).pipe(unzip).pipe(writeStream);
      //Remove the encrypted file after decryption is completed.
      writeStream.on("finish", async function () {
        fs.unlink(file, (err) => {});
        //Send the file to Client and Remove it.
        return res.download(writeStream.path, () => {
          fs.unlinkSync(writeStream.path);
        });
      });
    });
  });
});

router.get("/delete", verifyLogin, async function (req, res) {
  const drive = await configure();
  if (!drive) return res.status(400).json({ Error: "Unable to Delete File!" });

  let fileID = req.header("fileID");
  let recordID = req.header("recordID");

  if (!fileID) return res.status(400).json({ Error: "File ID is Required" });

  drive.files.delete({ fileId: fileID }).then(
    async function (response) {
      await db.removeData({ token: dbToken, collection: "uploads", id: recordID });
      return res.json({ Success: "File Deleted" });
    },
    function (err) {
      return res.json({ Error: "Unable to Delete File!" });
    }
  );
});

router.get("/resetCredentials", verifyLogin, (req, res) => {
  fs.unlink("credentials.json", (err) => {});
  return res.json({ Message: "Success" });
});

module.exports = router;
