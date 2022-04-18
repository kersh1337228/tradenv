import React from 'react'
import Plot from "../Plot";


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
        try{
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
                        <li>{this.state.quotes.tendency.quotes.open}</li>
                        <li>{this.state.quotes.tendency.quotes.high}</li>
                        <li>{this.state.quotes.tendency.quotes.low}</li>
                        <li>{this.state.quotes.tendency.quotes.close}</li>
                        <li>{this.state.quotes.tendency.quotes.volume}</li>
                        <li>{this.state.quotes.tendency.quotes.date}</li>
                    </ul>
                    <div className="quotes_price_plot">
                        <h3>Price change</h3>
                        <Plot />
                    </div>
                </div>
            )
        } catch (error) {
            return(
                <div className="quotes_detail">Error occurred</div>
            )
        }
    }
}
