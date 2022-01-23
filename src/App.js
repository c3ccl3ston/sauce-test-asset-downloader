import React, { useRef } from "react";
import "./App.css";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  CssBaseline,
  Container,
  TextField,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  ThemeProvider,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import Logo from "./assets/logo.png";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import MobileDatePicker from "@mui/lab/MobileDatePicker";
import MobileDateRangePicker from "@mui/lab/MobileDateRangePicker";
import useColorScheme from "./useColorScheme";
import { LIGHT_THEME, DARK_THEME } from "./theme";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ApiIcon from "@mui/icons-material/Api";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";

function App() {
  const { ipcRenderer } = window.require("electron");
  const [open, setOpen] = React.useState(false);

  const dark = useColorScheme("dark");
  const theme = dark ? DARK_THEME : LIGHT_THEME;

  const numberOfTestsField = useRef(null);
  const specificDateField = useRef(null);
  const dateRangeField = useRef(null);
  const saveLocationField = useRef("");

  const [specificDateValue, setSpecificDateValue] = React.useState(null);
  const [dateRangeValue, setDateRangeValue] = React.useState([null, null]);
  const [numberOfTests, setNumberOfTests] = React.useState(1);
  const [endpointValue, setEndpointValue] = React.useState("US");
  const [typeValue, setTypeValue] = React.useState("number");
  const [username, setUsername] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [saveLocation, setSaveLocation] = React.useState("");
  const [snackbarMessage, setSnackbarMessage] = React.useState("");

  const handleSnakbarClick = () => {
    setOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const getJobsEndpoint = (_endpoint) => {
    var endpoint = _endpoint + `/rest/v1/${username}/jobs`;

    let fromDateString = "";
    let toDateString = "";
    let fromDate = null;
    let toDate = null;

    switch (typeValue) {
      case "number":
        endpoint = endpoint + `?limit=${numberOfTests}`;
        break;
      case "specificDate":
        fromDateString = Date.parse(specificDateValue);
        fromDate = new Date(fromDateString);
        fromDate.setHours(0, 0, 0);
        fromDate = fromDate / 1000;
        toDate = fromDate + 86400;
        endpoint = endpoint + `?from=${fromDate}&to=${toDate}`;
        break;
      case "dateRange":
        fromDateString = Date.parse(dateRangeValue[0]);
        toDateString = Date.parse(dateRangeValue[1]);
        fromDate = new Date(fromDateString);
        fromDate.setHours(0, 0, 0);
        fromDate = fromDate / 1000;
        toDate = new Date(toDateString);
        toDate.setHours(23, 59, 59);
        toDate = toDate / 1000;
        endpoint = endpoint + `?from=${fromDate}&to=${toDate}`;
        break;
      default:
        break;
    }
    return endpoint;
  };

  ipcRenderer.on("completed-message", function (evt, message) {
    setSnackbarMessage(message);
    handleSnakbarClick();
  });

  const getData = async () => {
    if (username === "" || username === null || username === undefined) {
      setSnackbarMessage("Please enter a username");
      handleSnakbarClick();
      return;
    }

    if (accessKey === "" || accessKey === null || accessKey === undefined) {
      setSnackbarMessage("Please enter an access key");
      handleSnakbarClick();
      return;
    }

    switch (typeValue) {
      case "number":
        if (
          numberOfTests === "" ||
          numberOfTests === null ||
          numberOfTests === undefined
        ) {
          setSnackbarMessage("Please enter number of tests");
          handleSnakbarClick();
          return;
        }
        break;
      case "specificDate":
        if (
          specificDateValue === "" ||
          specificDateValue === null ||
          specificDateValue === undefined
        ) {
          setSnackbarMessage("Please enter a date");
          handleSnakbarClick();
          return;
        }
        break;
      case "dateRange":
        if (
          dateRangeValue[0] === "" ||
          dateRangeValue[0] === null ||
          dateRangeValue[0] === undefined ||
          dateRangeValue[1] === "" ||
          dateRangeValue[1] === null ||
          dateRangeValue[1] === undefined
        ) {
          setSnackbarMessage("Please enter dates");
          handleSnakbarClick();
          return;
        }
        break;
      default:
        break;
    }

    if (
      saveLocation === "" ||
      saveLocation === null ||
      saveLocation === undefined
    ) {
      setSnackbarMessage("Please enter a save location");
      handleSnakbarClick();
      return;
    }

    var _endpoint = "";
    switch (endpointValue) {
      case "EU":
        _endpoint = "https://api.eu-central-1.saucelabs.com";
        break;
      case "APAC":
        _endpoint = "https://api.apac-southeast-1.saucelabs.com";
        break;
      case "US":
      default:
        _endpoint = "https://api.us-west-1.saucelabs.com";
        break;
    }

    var obj = {
      endpoint: _endpoint,
      jobsEndpoint: getJobsEndpoint(_endpoint),
      username: username,
      accessKey: accessKey,
      saveLocation: saveLocation,
    };

    try {
      setSnackbarMessage("Downloading...");
      await ipcRenderer.invoke("getTestAssets", obj);
      handleSnakbarClick();
      return true;
    } catch (resp) {
      return console.warn(resp);
    }
  };

  const showSaveLocation = async () => {
    try {
      const data = await ipcRenderer.invoke("showSaveLocation");
      if (!data.canceled) {
        setSaveLocation(data.filePaths[0] + "/test-assets");
      }
    } catch (resp) {
      return console.warn(resp);
    }
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleAccessKeyChange = (event) => {
    setAccessKey(event.target.value);
  };

  const handleEndpointChange = (event) => {
    setEndpointValue(event.target.value);
  };

  const handleTypeChange = (event) => {
    setTypeValue(event.target.value);
    switch (event.target.value) {
      case "number":
        numberOfTestsField.current.classList.remove("hidden");
        specificDateField.current.classList.add("hidden");
        dateRangeField.current.classList.add("hidden");
        break;
      case "specificDate":
        numberOfTestsField.current.classList.add("hidden");
        specificDateField.current.classList.remove("hidden");
        dateRangeField.current.classList.add("hidden");
        break;
      case "dateRange":
        numberOfTestsField.current.classList.add("hidden");
        specificDateField.current.classList.add("hidden");
        dateRangeField.current.classList.remove("hidden");
        break;
      default:
        break;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="error" enableColorOnDark>
          <Toolbar className="no-left">
            <Box
              component="img"
              sx={{
                height: 64,
              }}
              alt="Sauce Labs logo"
              src={Logo}
            />
            <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
              Test Asset Downloader
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
      <Container maxWidth="md" sx={{ pt: 2 }}>
        <Box
          component="form"
          sx={{
            "& .MuiTextField-root": { m: 1, width: "25ch" },
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
          noValidate
          autoComplete="off"
        >
          <Paper elevation={3} sx={{ p: 1 }}>
            <Box
              sx={{
                m: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <AccountCircleIcon />
              <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, ml: 1 }}
              >
                User Info
              </Typography>
            </Box>
            <Box>
              <TextField
                required
                id="outlined-required"
                label="Sauce Username"
                value={username}
                onChange={handleUsernameChange}
              />
              <TextField
                required
                id="outlined-required"
                label="Sauce Access Key"
                value={accessKey}
                onChange={handleAccessKeyChange}
                type="password"
              />
            </Box>
          </Paper>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              gap: "10px",
            }}
          >
            <Paper elevation={3} sx={{ p: 1 }}>
              <Box
                sx={{
                  m: 1,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ApiIcon />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ flexGrow: 1, ml: 1 }}
                >
                  API Endpoint
                </Typography>
              </Box>
              <Box sx={{ m: 1 }}>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="controlled-radio-buttons-endpoint"
                    name="controlled-radio-buttons-endpoint-group"
                    value={endpointValue}
                    onChange={handleEndpointChange}
                  >
                    <FormControlLabel
                      value="US"
                      control={<Radio />}
                      label="US"
                    />
                    <FormControlLabel
                      value="EU"
                      control={<Radio />}
                      label="EU"
                    />
                    <FormControlLabel
                      value="APAC"
                      control={<Radio />}
                      label="APAC"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            </Paper>
            <Paper elevation={3} sx={{ p: 1, flex: 1 }}>
              <Box
                sx={{
                  m: 1,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <SettingsIcon />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ flexGrow: 1, ml: 1 }}
                >
                  Job Criteria
                </Typography>
              </Box>
              <Box sx={{ m: 1 }}>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="controlled-radio-buttons-type"
                    name="controlled-radio-buttons-type-group"
                    value={typeValue}
                    onChange={handleTypeChange}
                  >
                    <FormControlLabel
                      value="number"
                      control={<Radio />}
                      label="Previous x # of Tests"
                    />
                    <FormControlLabel
                      value="specificDate"
                      control={<Radio />}
                      label="Specific Date"
                    />
                    <FormControlLabel
                      value="dateRange"
                      control={<Radio />}
                      label="Date Range"
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
              <Box ref={numberOfTestsField}>
                <TextField
                  id="outlined"
                  label="# of Tests"
                  type="number"
                  value={numberOfTests}
                  onChange={(newValue) => {
                    setNumberOfTests(newValue.currentTarget.value);
                  }}
                />
              </Box>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box className="hidden" ref={specificDateField}>
                  <MobileDatePicker
                    disableFuture
                    label="Specific Date"
                    views={["month", "day"]}
                    value={specificDateValue}
                    onChange={(newValue) => {
                      setSpecificDateValue(newValue);
                    }}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box className="hidden" ref={dateRangeField}>
                  <MobileDateRangePicker
                    startText="Start"
                    value={dateRangeValue}
                    onChange={(newValue) => {
                      setDateRangeValue(newValue);
                    }}
                    renderInput={(startProps, endProps) => (
                      <React.Fragment>
                        <TextField {...startProps} />
                        <Box sx={{ mx: 2 }}> to </Box>
                        <TextField {...endProps} />
                      </React.Fragment>
                    )}
                  />
                </Box>
              </LocalizationProvider>
            </Paper>
          </Box>
          <Paper elevation={3} sx={{ p: 1 }}>
            <Box
              sx={{
                m: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <SaveIcon />
              <Typography
                variant="h6"
                component="div"
                sx={{ flexGrow: 1, ml: 1 }}
              >
                Save Location
              </Typography>
            </Box>
            <Box
              sx={{
                m: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TextField
                disabled
                id="outlined-disabled"
                value={saveLocation}
                ref={saveLocationField}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={showSaveLocation}
                sx={{ ml: 2 }}
              >
                Browse...
              </Button>
            </Box>
          </Paper>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" onClick={getData} sx={{ mt: 2 }}>
              Get Test Assets
            </Button>
          </Box>
        </Box>
        <Snackbar
          open={open}
          autoHideDuration={2000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity="info"
            // sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
