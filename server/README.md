# IBM Repository Browser Server

This is a mini server to retreve a list of IBM's public repositories on GitHub. The server is created by Nodejs and it integrates [octokit.js](https://github.com/octokit/octokit.js) to send request to GitHub REST API to retrieve data. It also has a feature to sync data to local database to avoid frequently request to GitHub.

# Prerequisites/Dependencies
- Node (version v14 and above) / NPM / yarn

Please refer to the Nodejs official website for installation instructions:
```
https://nodejs.org/en/download/
```

Another recommend way to install and manage Nodejs/NPM is to use `NVM`. For Linux or MacOS, follow instructions here:
```
https://github.com/nvm-sh/nvm
```
For Windows, follow instructions here:
```
https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows
```
And then from command line:
```
nvm install 14
nvm use 14
npm i --global yarn
```

# Running
Make sure you have Nodejs enviroment setup successfully by checking from command line, it should return `v14.18.1`(the latest lts version to date) or up.
```
node -v
```
From the project folder(/server) in the command line, build and run:
```
yarn install
yarn start
```
By default, the server runs at localhost:5000, if for any reason a port conflic happens, try run with different port:
```
yarn start -p [port]
```

# Testing
REST endpoint is:
```
http://localhost:[port]/api/github/repos?page=16&per_page=30
```
- The `page` is optional, default is 1.
- The `per_page` is optional, default is 30. 

With server running, use any tools available to test the REST api, an exmaple is:
```
curl http://localhost:5000/api/github/repos?page=2&per_page=5 | jq
```

# Optional Settings (local database)
Install Postgres from here: https://www.postgresql.org/download/
Then, config your database the same as the following:
```
CONNECTION = {
    user: 'postgres',
    host: 'localhost',
    database: 'repos',
    password: 'supersecret',
    port: 5432,
}
```
This is the settings the server connects to the db. The configuration is defined in `/server/resources/config.js`, if for any reason you need change the values, please update the file.

Another quick and recommended way to setup Postgres locally is using Docker, if you have docker and psql(postgres cli tools) installed on your machine, run the following command to create a postgres docker instance running on port 5432, with username as 'postgres' and password as 'supersecret':
```
docker run -it -p 5432:5432 -e POSTGRES_PASSWORD=supersecret -e POSTGRES_DB=repos -d postgres

# assume you run the following command under /server folder
# connect to db
psql -h localhost -p 5432 -U postgres

# init tables
postgres=#\c repos
postgres=#\i resources/repos.database.sql
```

With all these setup and ready, you can use the `sync` functionality. There are two ways to sync data:
- with '-s' option when start the server, e.g. 'yarn start -s'
- with rest api, send a POST request to `http://<host>:<port>/api/repos/sync`