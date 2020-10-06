/********** Select Dom Elements *************/
function getElement(name) {
  return document.querySelector(`#${name}`);
}

// Pages
const upload = getElement("upload");
const login = getElement("login");
const navbar = getElement("navbar");
const credentialsPage = getElement("credentialsPage");
const tokenPage = getElement("tokenPage");
const dashboard = getElement("dashboard");
const modal = getElement("modal");

// Messages
const message = getElement("message");
const displayDocumentListMessage = getElement("displayDocumentListMessage");
const exploreDocumentMessage = getElement("exploreDocumentMessage");

// Page Elements
const gotoHome = getElement("gotoHome");
const gotoAdd = getElement("gotoAdd");
const logout = getElement("logout");
const searchForm = getElement("searchForm");
const loginForm = getElement("loginForm");
const credentialsForm = getElement("credentialsForm");
const generateTokenUrl = getElement("generateTokenUrl");
const generateTokeForm = getElement("generateTokeForm");
const directoryList = getElement("directoryList");
const directorySelector = getElement("directorySelector");
const documentList = getElement("documentList");
const documentInfo = getElement("documentInfo");
const span = document.getElementsByClassName("close")[0];

/********** Functions *************/

//Initial View Screen
async function initialView(API_URL) {
  let response = await fetch(API_URL, { method: "POST", headers: { "content-type": "application/json" } });
  if (!response.ok) {
    response = await response.json();
    if (response.type == "login") {
      login.style.display = "";
      dashboard.style.display = "none";
      upload.style.display = "none";
      navbar.style.display = "none";
      tokenPage.style.display = "none";
      credentialsPage.style.display = "none";
      message.textContent = response.Error;
    } else if (response.type == "credentials") {
      login.style.display = "none";
      upload.style.display = "none";
      dashboard.style.display = "none";
      tokenPage.style.display = "none";
      navbar.style.display = "none";
      credentialsPage.style.display = "";
      message.textContent = response.Error;
    } else if (response.type == "token") {
      login.style.display = "none";
      credentialsPage.style.display = "none";
      dashboard.style.display = "none";
      upload.style.display = "none";
      navbar.style.display = "none";
      tokenPage.style.display = "";
      message.textContent = response.Error;

      const html = ejs.render(`<a class="btn" href="${response.URL}">Generate Token From Google!</a>`);
      generateTokenUrl.innerHTML = html;

      const urlParams = new URLSearchParams(window.location.search);
      const tokenCode = urlParams.get("code");
      if (tokenCode) {
        tokenForm = ejs.render(`<input type="text" id="tokenValue" name="tokenValue" value="${tokenCode}" readOnly />
        <button class="btn" type="submit" value="${tokenCode}" onclick="submitToken(this.value)">Submit</button>
        <button class="btn" onclick="resetCredentials()">Reset Credentials</button>`);
      } else {
        tokenForm = ejs.render(`<input type="text" id="tokenValue" name="tokenValue" placeholder="Code will be Rendered Here!" readOnly />
            <button class="btn" onclick="resetCredentials()">Reset Credentials</button>`);
      }
      generateTokenForm.innerHTML = tokenForm;
    }
  } else showDashboard(response);
}
initialView("/dashboard");

// Login
async function submitLogin(API_URL, form) {
  const formData = new FormData(form);
  const accessCode = formData.get("accessCode");
  const data = { accessCode };

  let response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  });
  if (!response.ok) {
    response = await response.json();
    login.style.display = "";
    message.innerHTML = `<span style='color: #db2a07;'>${response.Error}</span>`;
  } else {
    form.reset();
    initialView("/dashboard");
  }
}

// Submit Google Credentials
async function submitCredentials(API_URL, form) {
  const formData = new FormData(form);
  const credentials = formData.get("credentials");
  const data = { credentials, type: "credentials" };
  await fetch(API_URL, { method: "POST", body: JSON.stringify(data), headers: { "content-type": "application/json" } });
  form.reset();
  initialView("/dashboard");
}

// Submit Google Token
async function submitToken(token) {
  const data = { token, type: "token" };
  await fetch("/drive", { method: "POST", body: JSON.stringify(data), headers: { "content-type": "application/json" } });
  initialView("/dashboard");
}

// Reset Google Credentials
async function resetCredentials() {
  await fetch("/drive/resetCredentials", { method: "GET", headers: { "content-type": "application/json" } });
  initialView("/dashboard");
}

//Show Dashboard
async function showDashboard(response) {
  login.style.display = "none";
  upload.style.display = "none";
  credentialsPage.style.display = "none";
  tokenPage.style.display = "none";
  navbar.style.display = "";
  dashboard.style.display = "";
  documentList.innerHTML = "";

  response = await response.json();
  message.textContent = response.message;
  const directories = response.directories;

  const screenSize = window.screen.width;
  const length = screenSize < 650 ? 7 : 18;

  if (directories.length < 1) {
    displayDocumentListMessage.innerHTML = "➡️ No Documents!";
    directoryList.innerHTML = "";
  } else {
    const html = ejs.render(
      `<% directories.forEach(directory => { %>
        <div>
          <button value="<%= directory.directory %>" 
          style="border: none;outline: none;
          background-color: inherit;
          padding: 3px 0px;
          font-size: 16px;
          cursor: pointer;" 
          onclick="getDocumentList(this.value)">➡️ <%= directory.directory.substring(0, ${length}) %></button>
        </div>
    <% }) %>`,
      { directories: directories }
    );
    directoryList.innerHTML = html;
    displayDocumentListMessage.innerHTML = "Select a Directory!";
  }
  const renderDirectories = ejs.render(
    `<select id="directory" onchange="selectDir()">
          <option value="others">Select a directory...</option>
          <% directories.forEach(directory => { %>
          <option value="<%=directory.directory%>"><%=directory.directory%></option>
          <% }) %> <option value="new">Create New Directory</option>
        </select>`,
    { directories: directories }
  );
  directorySelector.innerHTML = renderDirectories;
}

// Get Document List
async function getDocumentList(directory) {
  const screenSize = window.screen.width;
  const length = screenSize < 650 ? 15 : 30;
  documentList.innerHTML = "";
  displayDocumentListMessage.innerHTML = directory.substring(0, length);
  const data = { directory };
  let response = await fetch("/listDocument", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json" },
  });
  response = await response.json();
  documents = response.documents;

  if (documents.length < 1) {
    documentList.innerHTML = "➡️ No Documents!";
  } else {
    const html = ejs.render(
      `<% documents.forEach(document => { %>
        <div>
          <button value="<%=document.fileID%>" 
          style="border: none;outline: none;
          background-color: inherit;
          padding: 3px 0px;
          font-size: 14px;
          cursor: pointer;" 
          onclick="singleDocumentInfo(this.value)">➡️ <%= document.fileName.substring(0, ${length}) %></button>
        </div>
    <% }) %>`,
      { documents: documents }
    );
    documentList.innerHTML = html;
  }
}

// Single Document Info
async function singleDocumentInfo(fileID) {
  let response = await fetch("/documentInfo", {
    method: "POST",
    body: JSON.stringify({ fileID }),
    headers: { "content-type": "application/json" },
  });
  response = await response.json();
  response = response.document;
  modal.style.display = "block";
  const html = ejs.render(
    `<p><strong>Name:</strong> ${response.fileName}</p><br>
    <p><strong>Size:</strong> ${response.fileSize}</p><br>
    <p><strong>Directory:</strong> ${response.directory}</p><br>
    <p><strong>Upload Date:</strong> ${new Date(response.date)}</p><br><br>
    <div><a class="btn" href="/drive/download?fileID=${fileID}" >Download</a>
    <button class="btn btn_delete" value="${fileID}|||${response._id}" onclick="deleteDocument(this.value)">Delete</button></div>`
  );
  documentInfo.innerHTML = html;
}

// Search Documents
async function searchDocuments(API_URL, form) {
  upload.style.display = "none";
  dashboard.style.display = "";
  const screenSize = window.screen.width;
  const length = screenSize < 650 ? 15 : 30;
  documentList.innerHTML = "";
  const formData = new FormData(form);
  const search = formData.get("search");
  let response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ search }),
    headers: { "content-type": "application/json" },
  });
  form.reset();
  response = await response.json();
  displayDocumentListMessage.textContent = `Results for: ${search.substring(0, length - 10)}`;
  documents = response.data;
  if (documents.length < 1) {
    documentList.innerHTML = "➡️ No Documents!";
  } else {
    const html = ejs.render(
      `<% documents.forEach(document => { %>
        <div>
          <button value="<%=document.fileID%>" 
          style="border: none;outline: none;
          background-color: inherit;
          padding: 3px 0px;
          font-size: 14px;
          cursor: pointer;" 
          onclick="singleDocumentInfo(this.value)">➡️ <%= document.fileName.substring(0, ${length}) %></button>
        </div>
    <% }) %>`,
      { documents: documents }
    );
    documentList.innerHTML = html;
  }
}

async function deleteDocument(fileInfo) {
  const confirmDelete = confirm("Are you Sure to Delete?");
  if (confirmDelete) {
    fileInfo = fileInfo.split("|||");
    fileID = fileInfo[0];
    recordID = fileInfo[1];
    await fetch("/drive/delete", { headers: { "content-type": "application/json", fileID, recordID } });
    modal.style.display = "none";
    initialView("/dashboard");
  }
}

/**************** Event Listeners ***********/

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitLogin("/login", loginForm);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchDocuments("/search", searchForm);
});

credentialsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitCredentials("/drive", credentialsForm);
});

gotoHome.addEventListener("click", (event) => {
  FilePond.destroy();
  initialView("/dashboard");
});

gotoAdd.addEventListener("click", (event) => {
  dashboard.style.display = "none";
  credentialsPage.style.display = "none";
  tokenPage.style.display = "none";
  upload.style.display = "";
  message.textContent = "Upload Files";
});

logout.addEventListener("click", (event) => {
  loginForm.reset();
  navbar.style.display = "none";
  upload.style.display = "none";
  dashboard.style.display = "none";
  initialView("/logout");
});

/********** File Upload *************/

let directory = "others";

function selectDir() {
  directory = getElement("directory").value;
  if (directory == "new") {
    getElement("newDirectory").style.display = "";
  } else {
    getElement("newDirectory").style.display = "none";
    FilePond.destroy();
    filePond();
  }
}

function newDir() {
  directory = getElement("newDirectory").value.toString().toLowerCase();
  FilePond.destroy();
  filePond();
}

function filePond() {
  const inputElement = document.querySelector('input[type="file"]');
  FilePond.registerPlugin(FilePondPluginFileValidateType);
  FilePond.registerPlugin(FilePondPluginFileValidateSize);
  FilePond.create(inputElement, {
    maxFiles: 20,
    allowRevert: false,
    allowRemove: false,
    maxFileSize: "10MB",
    acceptedFileTypes: ["image/png", "image/jpg", "image/jpeg", "application/pdf", "application/zip"],
  });
  FilePond.setOptions({ server: { process: "./drive/upload", method: "POST", headers: { directory } } });
}
filePond();

/********** Modal *************/
function closeModal() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
