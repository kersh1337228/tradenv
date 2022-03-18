import React from 'react'
import Plot from "./Plot";


export default class QuotesDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            quotes: {},
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        // Sending initial request
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
                })
            },
            error: function (response) {}
        })
    }

    render() {
        let last_quotes = this.state.quotes.quotes[
            Object.keys(this.state.quotes.quotes)[
                    Object.keys(this.state.quotes.quotes).length - 1
            ]
        ]
        last_quotes = last_quotes ? last_quotes : []
        return(
            <div className="quotes_detail">
                <h1 className="quotes_detail_name">{this.state.quotes.name}</h1>
                <h1 className="quotes_detail_symbol">{this.state.quotes.symbol}</h1>
                <h3 className="quotes_detail_last_quotes">Last quotes</h3>
                <ul className="quotes_detail_quotes_header">
                    <li>Open</li>
                    <li>High</li>
                    <li>Low</li>
                    <li>Close</li>
                    <li>Volume</li>
                    <li>Date</li>
                </ul>
                <ul className="quotes_detail_quotes">
                    <li>{last_quotes.open}</li>
                    <li>{last_quotes.high}</li>
                    <li>{last_quotes.low}</li>
                    <li>{last_quotes.close}</li>
                    <li>{last_quotes.volume}</li>
                    <li>{Object.keys(this.state.quotes.quotes)[
                        Object.keys(this.state.quotes.quotes).length - 1
                    ]}</li>
                </ul>
                <div className="quotes_price_plot">
                    <h3>Price change</h3>
                    <Plot className={'quotes_price_plot_canvas'} />
                </div>
            </div>
        )
    }
}