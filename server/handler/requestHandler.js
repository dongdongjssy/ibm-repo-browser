/*
 * This is the main entrance of request handling, it retrieves the request url and then determines
 * what handler should be dispatched to for further processing.
 * 
 * Note:
 * Currently only sync and github related requests are processed (start with '/api/github'). All 
 * other types of requests will have 404 returned.
 */
const githubRequestHandler = require('./githubRequestHandler')
const localRequestHandler = require('./localRequestHandler')
const syncRequestHandler = require('./syncRequestHandler')
const client = require('../services/dbConnectionService')

const GITHUB_REQUEST = '/api/github/repos'
const SYNC_REQUEST = '/api/repos/sync'

const requestHandler = async (request, response) => {
    console.info('Processing request: ', request.url)

    // set response format as JSON
    response.setHeader('Content-type', 'application/json')
    // enable CORS
    response.setHeader('Access-Control-Allow-Origin', '*')

    // if this is a sync request
    if (request.url.startsWith(SYNC_REQUEST)) {
        syncRequestHandler(request, response)
        return
    }

    // if this is not github related requests
    if (!request.url.startsWith(GITHUB_REQUEST)) {
        console.info('Request is not supported')
        response.writeHead(404)
        response.end('404 Not Found!')
        return
    }

    // retrieve request parameters
    const url = new URL(`${request.protocol}://${request.host}${request.url}`)
    request.page = url.searchParams.get('page') || 1
    request.perPage = url.searchParams.get('per_page') || 30

    // if data has already been synced to local database, retrieve from local
    try {
        let syncStatus = await client.one('SELECT * FROM sync_status')
        if (syncStatus.value === 0) {
            console.info('Redirect to local request handler for processing...')
            localRequestHandler(request, response)
            return
        }
    } catch (error) {
        console.error('Error getting sync status', error)
    }

    console.info('Redirect to github request handler for processing...')
    githubRequestHandler(request, response)
}

module.exports = requestHandler