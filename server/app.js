const http = require('http')
const requestHandler = require('./handler/requestHandler')
const { Worker } = require('worker_threads')

// server is running on port 5000 by default until specified
let port = 5000

// process parameters from command, we only accept following two options:
// -p [PORT]: to specify a port instead of the default 5000
// -s: to start a data sync from GitHub to local database while server is starting
// 
// Example start on port 6000 and also do sync at startup: 
// yarn start -p 6000 -s
let commandArgs = process.argv
if (commandArgs.length > 2) {
    for (var i = 2; i < commandArgs.length; i++) {
        if (commandArgs[i] === '-p') {
            try {
                port = Number(commandArgs[i + 1])
            } catch (error) {
                console.error('Invalid port number specified.', error)
                process.exit(1)
            }
        }

        if (commandArgs[i] === '-s') {
            // start sync job
            console.log('Start data sync at background, you can still send request to the server')
            const worker = new Worker('./services/syncDataToLocalService.js')
            worker.on('error', error => console.error('Data sync error', error))
            worker.on('exit', exitCode => console.log(`Data sync exit with code: ${exitCode}`))
            worker.on('message', result => result ? console.log('Hooray! Sync is completed!') : console.log('Sync is not completed!'))
            worker.postMessage('start')
        }
    }
}

const server = http.createServer(requestHandler)

server.listen(port, () => {
    console.log(`ibm-repo-browser server is started and running at http://localhost:${port}...`)
})