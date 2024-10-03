/*
 * Github rest API request handler.
 */
const { Octokit } = require('octokit')
const { URL } = require('url')

// GitHub Rest API client
const octokit = new Octokit()

// used to determine should retrieve the total pages of repo list, this usually happens on the first
// request, so the client is acnowledged the total items and total pages which will be used for them
// to build their pagination strategy.
let totalPages = undefined
let totalItems = undefined

const githubRequestHandler = async (request, response) => {
    console.info(`Processing github request: ${request.url}`)

    // Currently it only handles request to 'GET' all IBM's public repositories. All other types
    // of requests will have 404 returned. 
    if (request.method !== 'GET') {
        console.debug('404 - request not supported')
        response.writeHead(404)
        response.end('404 Not Found!')
        return
    }

    try {
        // Send request to github
        let reposResponse = await octokit.rest.repos.listForOrg({
            org: 'IBM',
            type: 'public',
            sort: 'updatedAt',
            page: request.page,
            per_page: request.perPage,
        })

        if (reposResponse.status < 200 || reposResponse.status >= 300 || !reposResponse.data) {
            console.debug(`Oops! Something is wrong, request is not successful with code ${reposResponse.status}`, reposResponse)
            response.writeHead(reposResponse.status)
            response.end()
            return
        }

        console.info('Awesome! Request succeed, we got repository list')
        
        // Build a response data for client
        let responseForClient = {
            totalPages: this.totalPages,
            totalItems: this.totalItems,
            repos: reposResponse.data.map((repo, index) => {
                return {
                    id: `${index}`,
                    name: repo.name,
                    language: repo.language,
                    starCount: repo.stargazers_count,
                    updatedAt: repo.updated_at.replace('T', ' ').replace('Z', '')
                }
            })
        }

        // Not yet to return to client, still need to tell the client what is the total pages of the repository list,
        // client will need this to build their pagination. The 'link' info retruned by github contains the last page 
        // number, we can use it to calculate the total counts. To reduce communication with GitHub, this calculation 
        // only happens on the first request.
        //
        // TECH-DEBT: 
        // will need to find a way to trigger the recalculation, since when GitHub data is updated, the total counts
        // will be changed, however the server still have the outdated data. One possible solution might be integrating
        // with GitHub event API to receive any changes from remote.
        if (reposResponse.headers['link'] && !totalPages && !totalItems) {
            try {
                let lastPageLink = reposResponse.headers['link'].split(',').find(link => link.includes('rel="last"'))
                if (lastPageLink) {
                    lastPageLink = lastPageLink.match(/(?<=<).*(?=>)/g)[0]
                    totalPages = Number(new URL(lastPageLink).searchParams.get('page'))
                }

                if (totalPages > 1) {
                    let lastPageResponse = await octokit.rest.repos.listForOrg({
                        org: 'IBM',
                        type: 'public',
                        page: totalPages,
                        per_page: request.perPage,
                    })

                    this.totalPages = totalPages
                    this.totalItems = request.perPage * (totalPages - 1) + lastPageResponse.data.length
                    responseForClient.totalPages = this.totalPages
                    responseForClient.totalItems = this.totalItems
                }
            } catch (error) {
                console.error("Error retrieving the total page count!", error)
            }
        }

        response.end(JSON.stringify(responseForClient))
    } catch (err) {
        console.debug('Request error.', err)
        response.writeHead(500)
        response.end('500 Server Error!')
    }
}

module.exports = githubRequestHandler