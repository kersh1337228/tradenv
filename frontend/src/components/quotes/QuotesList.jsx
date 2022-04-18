import React from 'react'
import QuotesListDetail from "./QuotesListDetail";
import Pagination from "./Pagination";


export default class QuotesList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            quotes: [],
            pagination: {}
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.search = this.search.bind(this)
        this.parse_quotes_request = this.parse_quotes_request.bind(this)
        // Initial request
        this.initial_request()
    }

    initial_request() {
        let current = this
        $.ajax({
            url: `${window.location.href}`,
            type: 'GET',
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
        $.ajax({
            url: `${window.location.href}`,
            type: 'GET',
            data: {
                query: event.target.value,
                page: window.location.href.match(/\/\?page=([\w]+)/) ?
                    window.location.href.match(/\/\?page=([\w]+)/)[1] : 1
            },
            async: false,
            success: function (response) {
                current.setState({
                    quotes: response.quotes,
                    pagination: response.pagination
                })
            },
            error: function (response) {}
        })
    }

    render() {
        // Checking if there are quotes downloaded
        let quotes_list = this.state.quotes.length ? (
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
                    <QuotesListDetail quotes={quotes} key={quotes.slug}/>
                )}</div>
                {this.state.pagination ? <Pagination pagination={this.state.pagination} /> : null}
            </div>
        ) : <span>No quotes. <span onClick={this.parse_quotes_request}>
            Update the data.
        </span></span>
        // Returning render
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
