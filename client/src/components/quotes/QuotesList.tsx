import React from 'react'
import Pagination, {PaginationProps} from "../general/Pagination";
import {Link} from "react-router-dom";
import {StockQuotesLiteType} from "../../types/quotes";
import {ajax} from "../../utils/functions";
import {bind} from "../../utils/decorators";

interface QuotesListState {
    quotes: StockQuotesLiteType[]
    pagination: PaginationProps['pagination'] | null
    loading: boolean
    search: boolean
    errors: {
        [key: string]: string[]
    }
}

export default class QuotesList extends React.Component<any, QuotesListState> {
    private page: number
    public constructor(props: any) {
        super(props)
        this.state = {
            quotes: [],
            pagination: null,
            loading: false,
            search: false,
            errors: {}
        }
        const page = window.location.href.match(
            /\?page=(?<number>[\w]+)/
        )
        this.page = parseInt(
            page?.groups?.number?
                page.groups?.number :'1'
        )
        this.search = this.search.bind(this)
        this.parse_quotes_request = this.parse_quotes_request.bind(this)
    }
    @bind
    public parse_quotes_request(): void {
        this.setState({loading: true}, async () => {
            await ajax(
                'http://localhost:8000/quotes/api/list/refresh',
                'PUT',
                (response: {
                    quotes: StockQuotesLiteType[],
                    pagination: PaginationProps['pagination']
                }) => {
                    this.setState({
                        quotes: response.quotes,
                        pagination: response.pagination,
                        loading: false
                    })
                },
                (response) => {
                    this.setState({
                        errors: response.responseJSON
                    })
                }
            )
        })
    }
    @bind
    public async search(event: React.ChangeEvent): Promise<void> {
        const value = (event.target as HTMLInputElement).value
        if (value) {
            await ajax(
                'http://localhost:8000/quotes/api/list',
                'GET',
                (response: {
                    query: string,
                    quotes: StockQuotesLiteType[],
                    pagination: PaginationProps['pagination']
                }) => {
                    if (response.query === value) {
                        this.setState({
                            quotes: response.quotes.length ?
                                response.quotes : [],
                            pagination: response.pagination,
                            search: true
                        })
                    }
                }, (response) => {},
                {
                    query: value,
                    page: this.page
                }
            )
        } else {
            this.setState({search: false})
        }
    }
    public componentDidMount(): void {
        this.setState({loading: true}, async () => {
            await ajax(
                'http://localhost:8000/quotes/api/list',
                'GET',
                (response: {
                    quotes: StockQuotesLiteType[],
                    pagination: PaginationProps['pagination']
                }) => {
                    this.setState({
                        quotes: response.quotes,
                        pagination: response.pagination,
                        loading: false
                    })
                }, (response) => {},
                {
                    page: this.page
                }
            )
        })
    }
    public render(): React.ReactElement {
        return(
            <div className={'quote_list_block'}>
                <div className={'quotes_search'}>
                    <input type="text" id="quotes_search"
                           placeholder="Type symbol or name here"
                           onChange={this.search}
                    />
                </div>
                {this.state.quotes.length ? (
                    <><table>
                        <thead>
                        <tr>
                            <th className="quotes_list_symbol">Symbol</th>
                            <th className="quotes_list_name">Name</th>
                            <th className="quotes_list_price">Close</th>
                            <th className="quotes_list_change">Change</th>
                            <th className="quotes_list_change_percent">Change %</th>
                            <th className="quotes_list_volume">Volume</th>
                            <th className="quotes_list_last_update">Last update</th>
                        </tr>
                        </thead>
                        <tbody>
                        {this.state.quotes.map(stock =>
                            <tr key={stock.symbol}>
                                <td>
                                    <Link to={'/quotes/detail/' + stock.symbol}>
                                        {stock.symbol}
                                    </Link>
                                </td>
                                <td>{stock.name}</td>
                                <td>{Math.round((stock.tendency.quotes.close + Number.EPSILON) * 100) / 100}</td>
                                <td>{stock.tendency.change}</td>
                                <td>{stock.tendency.change_percent}</td>
                                <td>{stock.tendency.quotes.volume}</td>
                                <td>{stock.last_timestamp}</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    {this.state.pagination ?
                        <Pagination pagination={this.state.pagination}/> : null
                    }</>
                ) : this.state.loading ? (
                <h3>Loading...</h3>
                ) : this.state.search ?
                    <span>No stocks matching query</span> : (
                    <span>
                        No stocks yet.
                        <span
                            onClick={this.parse_quotes_request}
                            style={{color: 'red', cursor: 'pointer'}}
                        >
                            Update the data.
                        </span>
                    </span>
                )
                }
            </div>
        )
    }
}
