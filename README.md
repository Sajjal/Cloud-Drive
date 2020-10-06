[![GitHub stars](https://img.shields.io/github/stars/Sajjal/Cloud-Drive)](https://github.com/Sajjal/Cloud-Drive/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/Sajjal/Cloud-Drive)](https://github.com/Sajjal/Cloud-Drive/issues)
![Website](https://img.shields.io/website?down_color=lightgrey&down_message=offline&up_color=blue&up_message=online&url=https%3A%2F%2Fdrive.mrsajjal.com)
![GitHub language count](https://img.shields.io/github/languages/count/Sajjal/Cloud-Drive)
![GitHub top language](https://img.shields.io/github/languages/top/Sajjal/Cloud-Drive)
![GitHub repo size](https://img.shields.io/github/repo-size/Sajjal/Cloud-Drive)

# Welcome to S & D Cloud Drive!

### File Storage and Synchronization Service Application.

A web-based lightweight file storage and synchronization service application that allows users to store and retrieve encrypted files on and from Google Drive. It is also a SPA (Single Page Application).

This application is developed using Node.js, Express.js, HTML, CSS, and Vanilla JavaScript. **[Grantha](https://github.com/Sajjal/Grantha)** is used as a database. The user interface is responsive and minimal.

---

## Background (_Why this application was developed?_)

There is no specific reason for the development of this application. I did it as a fun project and it turns out to be a secure vault to store sensitive personal documents.

---

## Prerequisites:

### Node.js:

- Install **Node.js** on your machine

### Grantha API:

- Get an API key from **[Grantha](https://db.mrsajjal.com)**
- Alternatively, you can setup your own **[Grantha Server](https://github.com/Sajjal/Grantha)**

---

### Google Drive API:

- Go to [Google Developers Console](https://console.developers.google.com) and create a new project
- Click on Enable API and Services
- Scroll down to **Google Drive API** and click Enable
- Click on **Credentials** on the left side bar
- Click on **Create Credentials** ----> OAuth client ID
- Application type -----> Web Application
- Name it anything and add `http://localhost:3000` as both **Authorized JavaScript origins** and **Authorized redirect URIs**
- Click on **Create** and Download _(we will need it later)_

---

## Installation:

- Clone this Project
- **cd** to the server directory
- Modify the value of `PASSWORD`, `TOKEN_SECRET` and `ACCESS_CODE` _(You can put anything)_ and Replace the value of `GRANTHA`, with **Grantha API Key** on `.env` file
  <br>
  **Note:** `.env` file might be hidden
- Open terminal/command-prompt and type:

  i. `npm install`

  ii. `npm start`

- Type `http://localhost:3000` on your browser's address bar and hit Enter
- It will ask for the **Access Code**, type the same access code you put on `.env` file
- It will then ask you to paste **Google Credentials**, copy everything from previously downloaded **credentials.json** file and paste it
- Finally, it will ask you to generate **token**, click on _Generate Token_, sign in with _Google_, authorize the app and click on _Submit_
- **Enjoy** the service

---

## Cloud-Drive Flow Chart:

<img src="https://github.com/Sajjal/Cloud-Drive/blob/master/public/images/Screen_shots/flow-chart.svg">

---

## Demo:

**Login Page:**

<img src="https://github.com/Sajjal/Cloud-Drive/blob/master/public/images/Screen_shots/login.png">

---

**Home Page:**

<img src="https://github.com/Sajjal/Cloud-Drive/blob/master/public/images/Screen_shots/home.png">

---

**Upload New File:**

<img src="https://github.com/Sajjal/Cloud-Drive/blob/master/public/images/Screen_shots/upload.png">

---

**Document Info:**

<img src="https://github.com/Sajjal/Cloud-Drive/blob/master/public/images/Screen_shots/info.png">

---

With Love,

**Sajjal**
