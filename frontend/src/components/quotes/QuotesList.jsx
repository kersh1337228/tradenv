import React from 'react'
import Pagination from "./Pagination";
import {Link} from "react-router-dom";
import $ from 'jquery'


export default class QuotesList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            quotes: [],
            pagination: {},
            loading: false
        }
        const page = window.location.href.match(
            /\?page=(?<number>[\w]+)/
        )
        this.page = page ? page.groups.number : 1
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.search = this.search.bind(this)
        this.parse_quotes_request = this.parse_quotes_request.bind(this)
    }

    initial_request() {
        let current = this
        this.setState({loading: true}, () => {
            $.ajax({
                url: 'http://localhost:8000/quotes/api/list',
                type: 'GET',
                data: {
                    page: this.page
                },
                success: function (response) {
                    current.setState({
                        quotes: response.quotes,
                        pagination: response.pagination,
                        loading: false
                    })
                },
                error: function (response) {}

            })
        })
    }

    parse_quotes_request() {
        let current = this
        this.setState({loading: true}, () => {
            $.ajax({
                url: 'http://localhost:8000/quotes/api/list/refresh',
                type: 'PUT',
                headers: {
                    'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
                },
                data: {},
                success: function (response) {
                    current.setState({
                        quotes: response.quotes,
                        pagination: response.pagination,
                        loading: false
                    })
                },
                error: function (response) {}
            })
        })
    }

    search(event) {
        let current = this
        $.ajax({
            url: `http://localhost:8000/quotes/api/list`,
            type: 'GET',
            data: {
                query: event.target.value,
                page: this.page
            },
            success: function (response) {
                if (response.query === event.target.value) {
                    current.setState({
                        quotes: response.quotes.length ?
                            response.quotes :
                            'No quotes matching query',
                        pagination: response.pagination
                    })
                }
            },
            error: function (response) {}
        })
    }

    componentDidMount() {
        this.initial_request()
    }

    render() {
        try {  // Checking if there are quotes downloaded
            var quotes_list = this.state.quotes.length ? (
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
                {
                    this.state.pagination ?
                        <Pagination pagination={this.state.pagination}/> :
                        null
                }</>
            ) : this.state.loading ? (
                <h3>Loading...</h3>
            ) : (
                <span>
                    No stocks yet.
                    <span
                        onClick={this.parse_quotes_request}
                        style={{color: 'red', cursor: 'pointer'}}> Update the data.
                    </span>
                </span>
            )
        } catch(error) {
            quotes_list = <h3>{this.state.quotes}</h3>
        }
        return(
            <div className={'quote_list_block'}>
                <div className={'quotes_search'}>
                    <input type="text" id="quotes_search"
                           placeholder="Type symbol or name here"
                           onInput={this.search} onPaste={this.search}
                    />
                </div>
                {quotes_list}
            </div>
        )
    }
}
