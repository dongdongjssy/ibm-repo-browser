/*
 * This is the service to handle request and retrieve data from local database.
 * The server will redirect request to this service only when data has already 
 * been synced from github to local database.
 */
const client = require('../services/dbConnectionService')

const localRequestHandler = async (request, response) => {
    try {
        const page = Number(request.page)
        const perPage = Number(request.perPage)

        // get total items count
        let totalItemsQueryResult = await client.one('SELECT count(*) FROM REPOS')
        const totalItems = Number(totalItemsQueryResult.count)

        // select data based on passed page and per_page values
        let reposQueryResult = await client.any('SELECT * FROM repos ORDER BY repos.name LIMIT $1 OFFSET $2', [perPage, (page - 1) * perPage])
        const repos = reposQueryResult.map(repo => {
            return {
                id: repo.id.toString(),
                name: repo.name,
                language: repo.language,
                starCount: repo.star_count,
                updatedAt: repo.updated_at.slice(0, 19).replace('T', ' ')
            }
        })

        console.info('Awesome! Request succeed, we got repository list')
        response.end(JSON.stringify({
            totalItems: totalItems,
            totalPages: Math.round(totalItems / perPage),
            repos: repos
        }))
    } catch (error) {
        console.error('Error retriving data from database', error)
        response.writeHead(500)
        response.end('Error retriving data from database')
    }
}

module.exports = localRequestHandler