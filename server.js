const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const expressip = require("express-ip");
const dotenv = require("dotenv");
dotenv.config();

//Set View Engine and Static Directory Path
app.use(express.static("public"));
app.set("view engine", "ejs");

//Import routes
const uploadRoute = require("./routes/uploadRouter");
const mainRouter = require("./routes/mainRouter");

//MiddleWares
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(expressip().getIpInfoMiddleware);
app.use(express.json());
app.use("/", mainRouter);
app.use("/drive", uploadRoute);

//Express Error Handler
app.use((error, req, res, next) => {
  if (error) {
    return res.status(400).send({ error: "Invalid JSON Input!" });
  } else {
    next();
  }
});

let port = process.env.PORT || 3000;

app.get("*", function (req, res) {
  res.redirect("/");
});

app.listen(port, function () {
  return console.log(`Listening on localhost:${port}`);
});
