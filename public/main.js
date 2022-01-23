const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const axios = require("axios");

const isDev = require("electron-is-dev");
const { electron } = require("process");
const fs = require("fs");

let win = null;

// Conditionally include the dev tools installer to load React Dev Tools
let installExtension, REACT_DEVELOPER_TOOLS; // NEW!

if (isDev) {
  const devTools = require("electron-devtools-installer");
  installExtension = devTools.default;
  REACT_DEVELOPER_TOOLS = devTools.REACT_DEVELOPER_TOOLS;
} // NEW!

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
} // NEW!

require("@electron/remote/main").initialize();

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 770,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  if (isDev) {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((error) => console.log(`An error occurred: , ${error}`));
  }
}); // UPDATED!

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const saveFile = async (url, saveLocation, username, accessKey) => {
  await axios
    .get(url, {
      auth: {
        username: username,
        password: accessKey,
      },
      responseType: "stream",
    })
    .then((response) => {
      const writer = fs.createWriteStream(saveLocation);
      response.data.pipe(writer);
    })
    .catch((error) => {
      console.log(error);
    });
};

const getJobIds = async (username, accessKey, url) => {
  const jobs = await axios
    .get(url, {
      auth: {
        username: username,
        password: accessKey,
      },
    })
    .catch((error) => {
      console.log(error);
    });
  return jobs.data.map((a) => a.id);
};

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let jobsProcessed = 0;
ipcMain.handle("getTestAssets", async (event, data) => {
  let saveLocation = data.saveLocation;
  let username = data.username;
  let accessKey = data.accessKey;

  if (!fs.existsSync(saveLocation)) {
    fs.mkdirSync(saveLocation, { recursive: true });
  }

  const jobIds = await getJobIds(username, accessKey, data.jobsEndpoint);

  jobIds.forEach((id) => {
    processJobAssets(id, saveLocation, data);
  });
});

const downloadComplete = () => {
  win.webContents.send("completed-message", "Finished");
};

const createDirectories = (id, saveLocation) => {
  if (!fs.existsSync(`${saveLocation}/${id}`)) {
    fs.mkdirSync(`${saveLocation}/${id}`, { recursive: true });
  }
  if (!fs.existsSync(`${saveLocation}/${id}/screenshots`)) {
    fs.mkdirSync(`${saveLocation}/${id}/screenshots`, { recursive: true });
  }
};

const processJobAssets = async (id, saveLocation, data) => {
  createDirectories(id, saveLocation);

  const jobs_assets = await axios.get(
    data.endpoint + `/rest/v1/${data.username}/jobs/${id}/assets`,
    {
      auth: {
        username: data.username,
        password: data.accessKey,
      },
    }
  );

  await Promise.all(
    Object.keys(jobs_assets.data).map((key) => {
      let value = jobs_assets.data[key];
      if (key === "screenshots") {
        for (let name of value) {
          saveFile(
            data.endpoint +
              `/rest/v1/${data.username}/jobs/${id}/assets/${name}`,
            `${saveLocation}/${id}/screenshots/${name}`,
            data.username,
            data.accessKey
          );
        }
      } else {
        saveFile(
          data.endpoint +
            `/rest/v1/${data.username}/jobs/${id}/assets/${value}`,
          `${saveLocation}/${id}/${value}`,
          data.username,
          data.accessKey
        );
      }
    })
  );
  return downloadComplete();
};

ipcMain.handle("showSaveLocation", async (event, args) => {
  return dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });
});
