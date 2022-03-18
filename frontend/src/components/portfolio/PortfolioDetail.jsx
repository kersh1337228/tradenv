import React from 'react'
import {Link} from 'react-router-dom'
import LogListDetail from '../log/LogListDetail'


export default class PortfolioDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            portfolio: {},
            logs: {},
            errors: {}
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_update = this.portfolio_update.bind(this)
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
                    portfolio: response.portfolio,
                    logs: response.logs,
                })
            },
            error: function (response) {}
        })
    }

    portfolio_update(event) {
        let current = this
        event.preventDefault()
        $.ajax({
            url: `${window.location.origin}/portfolio/create/`,
            type: 'PATCH',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: event.target.name.value,
                balance: event.target.balance.value
            },
            success: function (response) {
                let portfolios = this.state.portfolios
                portfolios.unshift(response.portfolio)
                current.setState({
                    portfolios: portfolios,
                    errors: {}
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    render() {
        try {
            // Checking whether there are stocks in portfolio
            let portfolio_stocks = Object.keys(this.state.portfolio.stocks).length ?
                <div className={'portfolio_detail_portfolio_stocks_list'}>
                    <ul className="portfolio_stocks_header">
                        <li className="portfolio_stocks_origin_name">Name</li>
                        <li className="portfolio_stocks_origin_symbol">Symbol</li>
                        <li className="portfolio_stocks_amount">Amount</li>
                    </ul>
                    {this.state.portfolio.stocks.map(stock =>
                        <ul className="portfolio_stocks" key={stock.origin.slug}>
                            <li className="portfolio_stocks_origin_name">
                                <Link to={'quotes/detail/' + stock.origin.slug + '/'}>{stock.origin.name}</Link>
                            </li>
                            <li className="portfolio_stocks_origin_symbol">{stock.origin.symbol}</li>
                            <li className="portfolio_stocks_amount">{stock.origin.amount}</li>
                            <li className="portfolio_stocks_edit_menu">...
                                <ul>
                                    <li id="portfolio_stocks_amount_change">Change amount</li>
                                    <li id="portfolio_stocks_delete">Delete</li>
                                </ul>
                            </li>
                        </ul>
                    )}
                </div>
                : <span>No stocks yet</span>
            // Checking whether there are logs where the portfolio is mentioned in
            let logs = this.state.logs.length ?
                <div className="portfolio_logs_list">
                    <h2>Logs</h2>
                    {this.state.logs.map(log =>
                        <LogListDetail log={log} key={log.slug}/>
                    )}
                </div> : <div className="portfolio_logs">No logs yet</div>
            // Rendering component
            return (
                <div className="portfolio_detail_block">
                    <span className="config_button" id="portfolio_config">Configure</span>
                    <span className="config_button" id="portfolio_delete">Delete</span>
                    <div className="portfolio_detail">
                        <h1 className="portfolio_detail_name">{this.state.portfolio.name}</h1>
                        <div className="portfolio_detail_created">Created: {this.state.portfolio.created}</div>
                        <div className="portfolio_detail_last_updated">Last
                            updated: {this.state.portfolio.last_updated}</div>
                        <div className="portfolio_detail_portfolio_balance">Balance: {this.state.portfolio.balance} $
                        </div>
                        <div className="portfolio_detail_portfolio_stocks">
                            <h2>Stocks</h2>
                            <div id="portfolio_add_shares">Add stocks +</div>
                            <input type="text" name="stock_name" placeholder="Type symbol or name here"
                                   maxLength="255" id="id_stock_name"/>
                            <div id="portfolio_confirm_add">Add</div>
                            {portfolio_stocks}
                        </div>
                        <div className="portfolio_logs">
                            <h2>Logs</h2>
                            {logs}
                        </div>
                    </div>
                </div>
            )
        } catch (error) {
            return (<div className="portfolio_detail_block">
                Some error occurred
            </div>)
        }
    }
}
