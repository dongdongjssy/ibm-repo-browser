# IBM Repository Browser Client

This is the client to list IBM's public repositories in GitHub. The client is build with `React` v17.0.2 and `Carbon Design System` components. The application contains only one page showing all data in a form, and provides some common functions like search, pagination and sort.

# Prerequisites/Dependencies
- React
- yarn

# Running
In command line under folder `/client`:
```
yarn install
yarn start
```
It will take some time for the app to start up, and by default it will be running on port 3000. Add a specific port to `.env` file if you want to run at a different port:
```
PORT=XXXX
```

The clien will connect to `ibm-repository-browser-server` which provides REST API to get data. By default the server runs on port `5000`, if for any reason the server runs on a different port, please update client `.env` file to match the port:
```
REACT_APP_SERVER_PORT=5000
```