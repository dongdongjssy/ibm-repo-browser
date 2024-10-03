/*
 * This is the service to sync GitHub data to local database(postgres). It is invented to avoid
 * frequently sending requests to GitHub. It is a long time running job and is suggested to put
 * this service running in a seperate thread instead of main thread to avoid blocking.
 * 
 * Note:
 * We are using unauthenticated request to communicate with GitHub, a rate limit of up to 60 
 * requests per hour is allowed, as indicated in their docs: 
 * https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
 * 
*/
const { parentPort } = require("worker_threads")
const { Octokit } = require('octokit')
const { CONNECTION, REPO_COLUMN_SET } = require('../resources/config')

const pgp = require('pg-promise')({
    capSQL: true // capitalize all generated SQL
})
const client = pgp(CONNECTION)

// GitHub Rest API client
const octokit = new Octokit()

parentPort.on("message", data => syncDataToLocalService())

const syncDataToLocalService = async () => {
    console.log('Start syncing...')

    // start a trasaction for bulk insert/update
    client.tx(async t => {
        try {
            setSyncStatus(1) // mark it as sync in progress
            let nextPage = 1

            // Github only allows a maximun of 100 items per request. we have to find if there is a 
            // next page from the response header info, then do a loop until to the last page. 
            while (nextPage) {
                let reposResponse = await octokit.rest.repos.listForOrg({
                    org: 'IBM',
                    type: 'public',
                    sort: 'name',
                    per_page: 100,
                    page: nextPage
                })

                let data = reposResponse.data.map(repo => {
                    return {
                        name: repo.name,
                        language: repo.language,
                        star_count: repo.stargazers_count,
                        updated_at: repo.updated_at,
                    }
                })

                // Here we always do 'INSERT' and if there is conflict then do 'UPDATE'
                console.log(`syncing 100 rows on page ${nextPage}...`)
                const columnSet = new pgp.helpers.ColumnSet(REPO_COLUMN_SET, { table: 'repos' })
                let query = pgp.helpers.insert(data, columnSet) +
                    ' ON CONFLICT (name) DO UPDATE SET' +
                    ' language=EXCLUDED.language,' +
                    ' star_count=EXCLUDED.star_count,' +
                    ' updated_at=EXCLUDED.updated_at;'
                await t.none(query)

                if (reposResponse.headers['link']) {
                    let nextPageLink = reposResponse.headers['link'].split(',').find(link => link.includes('rel="next"'))
                    if (nextPageLink) {
                        nextPageLink = nextPageLink.match(/(?<=<).*(?=>)/g)[0]
                        nextPage = Number(new URL(nextPageLink).searchParams.get('page'))
                    } else {
                        nextPage = undefined
                    }
                }
            }

            console.log('Sync is completed!')
            setSyncStatus(0) // mark sync is not in progress
            parentPort.postMessage(true)
        } catch (err) {
            console.error('Error importing data to database', err)
            setSyncStatus(0) // mark sync is not in progress
        }
    })
}

const setSyncStatus = async (status) => {
    console.log(`Updating sync status as [${status === 1 ? 'In Progress' : 'Not In Progress'}] and save it to database`)
    client.tx(async t => {
        await t.none('DELETE FROM sync_status')
        await t.none('INSERT INTO sync_status(value) VALUES($1)', [status])
    })
        .then(() => console.log('Sync status updated'))
        .catch(error => console.error('Error updating sync status', error))
}

module.exports = syncDataToLocalService