import React, { Component } from 'react'
import {
    Button,
    DataTable,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
    Pagination,
    Content,
    ToastNotification,
    DataTableSkeleton,
} from 'carbon-components-react'
import axios from 'axios'

class RepoDataTable extends Component {
    constructor(props) {
        super(props)
        this.state = {
            itemsShown: [], // the items that will be displayed in the table
            pageCounts: undefined, // the total pages
            totalItems: undefined, // the total items
            pageIndex: 1, // default display page 1 data
            itemsShownPerPage: 30, // how many items are listed in one page, default is 30
            loading: true, // control skeleton loading
            disableSync: false, // enable/disable sync button, after sync request is sent, button will be disabled until sync is done
            syncResponse: false, // control sync result notification which will be displayed on top of the screen
            syncMessage: '', // the sync result returned from the server and will be displayed in the notification on UI, will auto disappear after 10s
        }
        this.onPaginationNavChange = this.onPaginationNavChange.bind(this)
        this.onRequestSync = this.onRequestSync.bind(this)
    }

    componentDidMount() {
        this.fetchData(this.state.pageIndex, this.state.itemsShownPerPage)
    }

    // call server Rest API to get data
    fetchData(pageIndex, pageSize) {
        this.setState({ loading: true })

        axios.get(getRepoListApi + `?page=${pageIndex}&per_page=${pageSize}`).then(res => {
            if (res.status === 200 && res.data.repos) {
                this.setState({
                    itemsShown: res.data.repos,
                    totalItems: res.data.totalItems,
                    pageCounts: res.data.totalPages,
                })
            } else {
                console.log('Failed retrieving data from server!', res)
            }
        }).catch(err =>
            console.error('Error retreiving data from server!', err)
        ).finally(() => this.setState({ loading: false }))
    }

    // when pagination bar is clicked
    onPaginationNavChange(value) {
        this.setState({ pageIndex: value.page, itemsShownPerPage: value.pageSize })
        this.fetchData(value.page, value.pageSize)
    }

    // when 'sync' button is clicked
    onRequestSync() {
        this.setState({ disableSync: true })
        axios.post(syncReposApi).then(res => {
            this.setState({ syncResponse: true, syncMessage: res.data, disableSync: false })
        }).catch(err => {
            console.error('Error processing sync job!', err)
            this.setState({ disableSync: false })
        })
    }

    render() {
        return (
            <Content>
                {this.state.syncResponse ?
                    <ToastNotification style={{ width: '100%' }} timeout={5000} title={this.state.syncMessage} kind="info" /> : null
                }
                {this.state.loading && <DataTableSkeleton showHeader headers={headerData} />}
                {!this.state.loading &&
                    <section>
                        <DataTable rows={this.state.itemsShown} headers={headerData} isSortable>
                            {({ rows, headers, getHeaderProps, getTableProps, getBatchActionProps, onInputChange }) => (
                                <TableContainer title='Reposotory List' description="IBM's public reposotories in GitHub">
                                    <TableToolbar>
                                        <TableToolbarContent>
                                            {/** search input bar */}
                                            <TableToolbarSearch
                                                persistent={true}
                                                tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}
                                                onChange={onInputChange}
                                            />
                                            {/** sync button */}
                                            <Button
                                                tabIndex={getBatchActionProps().shouldShowBatchActions ? -1 : 0}
                                                onClick={() => {
                                                    this.setState({ disableSync: true })
                                                    this.onRequestSync()
                                                }}
                                                disabled={this.state.disableSync}
                                                size="small"
                                                kind="primary">
                                                Sync
                                            </Button>
                                        </TableToolbarContent>
                                    </TableToolbar>
                                    <Table {...getTableProps()}>
                                        {/** table header */}
                                        <TableHead>
                                            <TableRow>
                                                {headers.map((header, i) => (
                                                    <TableHeader key={i} {...getHeaderProps({ header })}>
                                                        {header.header}
                                                    </TableHeader>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        {/** table content */}
                                        <TableBody>
                                            {rows.map((row, i) => (
                                                <TableRow key={i}>
                                                    {row.cells.map((cell, index) => (
                                                        <TableCell key={index}>{cell.value}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </DataTable>
                        <Pagination
                            backwardText="Previous page"
                            forwardText="Next page"
                            itemsPerPageText="Items per page:"
                            page={this.state.pageIndex}
                            pageNumberText="Page Number"
                            pageSize={this.state.itemsShownPerPage}
                            pageSizes={[10, 20, 30, 40, 50]}
                            totalItems={this.state.totalItems}
                            onChange={this.onPaginationNavChange}
                        />
                    </section>
                }
            </Content>
        )
    }
}

const { REACT_APP_SERVER_PORT } = process.env
const getRepoListApi = `http://localhost:${REACT_APP_SERVER_PORT}/api/github/repos`
const syncReposApi = `http://localhost:${REACT_APP_SERVER_PORT}/api/repos/sync`

// hard coded table headers
const headerData = [
    {
        key: "name",
        header: "Repository Name",
    },
    {
        key: "language",
        header: "Repository Language",
    },
    {
        key: "starCount",
        header: "GitHub Stars Count",
    },
    {
        key: "updatedAt",
        header: "Last Time Updated",
    },
]

export default RepoDataTable