import React from 'react'
import QuotesListDetail from "./QuotesListDetail";
import Pagination from "./Pagination";


export default class QuotesList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            quotes: [],
            pagination: {},
            loading: false
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.search = this.search.bind(this)
        this.parse_quotes_request = this.parse_quotes_request.bind(this)
    }

    initial_request() {
        let current = this
        this.setState({loading: true}, () => {
            $.ajax({
                url: '/quotes/api/list',
                type: 'GET',
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

    parse_quotes_request() {
        let current = this
        $.ajax({
            url: `${window.location.href}`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {},
            success: function (response) {
                current.setState({
                    quotes: response.quotes,
                    pagination: response.pagination
                })
            },
            error: function (response) {}
        })
    }

    search(event) {
        let current = this
        const current_page = window.location.href.match(/\/\?page=([\w]+)/)
        $.ajax({
            url: `/quotes/api/list`,
            type: 'GET',
            data: {
                query: event.target.value,
                page: current_page ? current_page[1] : 1
            },
            success: function (response) {
                if (response.query === event.target.value) {
                    current.setState({
                        quotes: response.quotes.length ? response.quotes : 'No quotes matching query',
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
                <div className={'quotes_list'}>
                    <div className="quotes_list_header">
                        <ul>
                            <li className="quotes_list_symbol">Symbol</li>
                            <li className="quotes_list_name">Name</li>
                            <li className="quotes_list_price">Price $</li>
                            <li className="quotes_list_change">Change $</li>
                            <li className="quotes_list_change_percent">Change %</li>
                            <li className="quotes_list_volume">Volume</li>
                        </ul>
                    </div>
                    <div>{this.state.quotes.map(quotes =>
                        <QuotesListDetail quotes={quotes} key={quotes.symbol}/>
                    )}</div>
                    {this.state.pagination ? <Pagination pagination={this.state.pagination} /> : null}
                </div>
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
            quotes_list = <h1>Some error occurred during loading stocks</h1>
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
