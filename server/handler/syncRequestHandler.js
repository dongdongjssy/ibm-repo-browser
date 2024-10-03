/*
 * This service handles sync request sent through REST API. Once receive the request, it will sync data
 * from GitHub to local database. It creates a 'Worker' thread and let it run at the background. This 
 * will make sure while sync is processing, the server is still responsiable to other requests. 
 */
const { Worker } = require('worker_threads')
const client = require('../services/dbConnectionService')

const syncRequestHandler = async (request, response) => {
    try {
        // Check if there is already a sync job running, if so, do nothing.
        let syncStatus = await client.one('SELECT * FROM sync_status')

        if (syncStatus.value === 1) {
            console.info('Sync is in progress, please try again later')
            response.end('Sync is in progress, please try again later')
            return
        }

        console.log('Processing data sync request at background, you can still send request to the server')
        const worker = new Worker('./services/syncDataToLocalService.js')
        worker.on('error', error => {
            console.error('Data sync error', error)
            response.end('Sync error!')
        })
        worker.on('exit', exitCode => {
            console.log(`Data sync exit with code: ${exitCode}`)
            response.end('Oops! Sync is interrupted!')
        })
        worker.on('message', result => {
            result ? response.end(JSON.stringify('Hooray! Sync is completed!')) : response.end('Sync is not completed!')
        })
        worker.postMessage('start')
    } catch (error) {
        console.log('Error handling sync request', error)
        response.writeHeader(500)
        response.end('Oh no! Sync error!')
    }
}

module.exports = syncRequestHandler