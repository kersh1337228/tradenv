import React from 'react'
import QuotesListDetail from "./QuotesListDetail";
import Pagination from "./Pagination";


export default class QuotesList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            quotes: {},
            pagination: {}
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.search = this.search.bind(this)
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

    search(event) {
        let current = this
        $.ajax({
            url: `${window.location.href}`,
            type: 'GET',
            data: {
                search: event.target.value,
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
                        <li className="quotes_symbol">Symbol</li>
                        <li className="quotes_name">Name</li>
                        <li className="quotes_price">Price $</li>
                        <li className="quotes_change">Change $</li>
                        <li className="quotes_change_percent">Change %</li>
                        <li className="quotes_volume">Volume</li>
                    </ul>
                </div>
                <div>{this.state.quotes.map(quotes =>
                    <QuotesListDetail quotes={quotes} key={quotes.symbol}/>
                )}</div>
                {this.state.pagination ? <Pagination pagination={this.state.pagination} /> : null}
            </div>
        ) : <span>No quotes. Update the data.</span>
        // Returning render
        return(
            <div className={'quotes'}>
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
