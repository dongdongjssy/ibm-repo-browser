// db connection
const CONNECTION = {
    user: 'postgres',
    host: 'localhost',
    database: 'repos',
    password: 'supersecret',
    port: 5432,
}

// repo table info for bulk insert/update use
const REPO_COLUMN_SET = ['name', 'language', 'star_count', 'updated_at']

module.exports = { CONNECTION, REPO_COLUMN_SET }