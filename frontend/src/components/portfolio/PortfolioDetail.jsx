import React from 'react'
import {Link} from 'react-router-dom'
import LogListDetail from '../log/LogListDetail'


export default class PortfolioDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            portfolio: {},
            logs: {},
            quotes: [],
            config: false,
            stocks_config: {},
            errors: {},
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_update = this.portfolio_update.bind(this)
        this.show_search = this.show_search.bind(this)
        this.stocks_search = this.stocks_search.bind(this)
        this.portfolio_delete = this.portfolio_delete.bind(this)
        this.stocks_add = this.stocks_add.bind(this)
        this.show_change_amount = this.show_change_amount.bind(this)
        this.hide_change_amount = this.hide_change_amount.bind(this)
        this.stocks_change_amount = this.stocks_change_amount.bind(this)
        this.stocks_delete = this.stocks_delete.bind(this)
        // Input reference initialization
        this.searchRef = React.createRef()
        this.stockBlockRef = React.createRef()
        this.nameRef = React.createRef()
        this.balanceRef = React.createRef()
        this.stocksAmountRef = React.createRef()
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

    portfolio_delete() {
        if (confirm('Do you really want to delete the portfolio?')) {
            $.ajax({
                url: `${window.location.origin}/portfolio/delete/${this.state.portfolio.slug}/`,
                type: 'DELETE',
                success: function () {
                    window.location.href = '/portfolio/list/'
                },
                error: function (response) {}
            })
        }
    }

    portfolio_update() {
        let current = this
        $.ajax({
            url: `${window.location.origin}/portfolio/update/${this.state.portfolio.slug}/`,
            type: 'PATCH',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: this.nameRef.current.value,
                balance: this.balanceRef.current.value
            },
            success: function (response) {
                current.setState({
                    portfolio: response.portfolio,
                    errors: {},
                    config: false,
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    show_search() {
        let search = $(this.stockBlockRef.current)
        if (search.css('display') === 'none') {
            search.show(300)
        } else {
            search.hide(300)
        }
    }

    stocks_search(event) {
        if (!event.target.value) {
            this.setState({
                quotes: []
            })
        } else {
            let current = this
            $.ajax({
                url: `${window.location.origin}/quotes/list/search/`,
                type: 'GET',
                data: {
                    query: event.target.value,
                    downloaded: true,
                    slug: this.state.portfolio.slug,
                },
                success: function (response) {
                    current.setState({
                        quotes: response
                    })
                },
                error: function (response) {
                    current.setState({
                        errors: response.responseJSON
                    })
                }
            })
        }
    }

    stocks_add(event) {
        let current = this
        $.ajax({
            url: `${window.location.href}stocks/add/`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                symbol: event.target.id
            },
            success: function (response) {
                current.setState({
                    portfolio: response.portfolio
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    show_change_amount(event) {
        let stocks_config = this.state.stocks_config
        stocks_config[event.target.id] = true
        this.setState({
            stocks_config: stocks_config
        })
    }

    hide_change_amount(event) {
        let stocks_config = this.state.stocks_config
        delete stocks_config[event.target.id]
        this.setState({
            stocks_config: stocks_config
        })
    }

    stocks_change_amount(event) {
        let current = this
        $.ajax({
            url: `${window.location.href}stocks/change_amount/`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                symbol: event.target.id,
                amount: current.stocksAmountRef.current.value,
            },
            success: function (response) {
                // Disabling config mode
                let stocks_config = current.state.stocks_config
                delete stocks_config[event.target.id]
                current.setState({
                    portfolio: response.portfolio,
                    stocks_config: stocks_config,
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    stocks_delete(event) {
        if (confirm(`Do you really want to delete the ${event.target.id} stock from your portfolio?`)) {
            let current = this
            $.ajax({
                url: `${window.location.href}stocks/delete/`,
                type: 'PUT',
                headers: {
                    'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
                },
                data: {
                    symbol: event.target.id,
                },
                success: function (response) {
                    current.setState({
                        portfolio: response.portfolio,
                    })
                },
                error: function (response) {
                    current.setState({
                        errors: response.responseJSON
                    })
                }
            })
        }
    }

    render() {
        try {
            // Checking the config mode
            let config = this.state.config ?
                <div className={'portfolio_detail_config_panel'}>
                    <span className="config_button" id="portfolio_config_cancel"
                          onClick={() => {this.setState({config: false, errors: {},})}}>Cancel</span>
                    <span className="config_button" id="portfolio_config_confirm"
                          onClick={this.portfolio_update}>Confirm</span>
                </div> : <div className={'portfolio_detail_config_panel'}>
                    <span className="config_button" id="portfolio_config"
                          onClick={() => {this.setState({config: true,})}}>Configure</span>
                    <span className="config_button" id="portfolio_delete"
                          onClick={this.portfolio_delete}>Delete</span>
                </div>
            let main_fields = !this.state.config ?
                <>
                    <h1 className="portfolio_detail_name">
                        {this.state.portfolio.name}
                    </h1>
                    <div className="portfolio_detail_balance">
                        Balance: {this.state.portfolio.balance} $
                    </div>
                </> :
                <>
                    {'name' in this.state.errors ? <ul>
                        {this.state.errors.name.map(error =>
                            <li key={error}>{error}</li>
                        )}
                    </ul> : null}
                    <input className="portfolio_detail_name" ref={this.nameRef}
                           defaultValue={this.state.portfolio.name} />
                    {'balance' in this.state.errors ? <ul>
                        {this.state.errors.balance.map(error =>
                            <li key={error}>{error}</li>
                        )}
                    </ul> : null}
                    <input className="portfolio_detail_balance" ref={this.balanceRef}
                           defaultValue={this.state.portfolio.balance} />
                </>
            // Checking whether there are stocks in portfolio
            let portfolio_stocks = Object.keys(this.state.portfolio.stocks).length ?
                <div className={'portfolio_detail_portfolio_stocks_list'}>
                    <ul className="portfolio_stocks_header">
                        <li className="portfolio_stocks_origin_symbol">Symbol</li>
                        <li className="portfolio_stocks_origin_name">Name</li>
                        <li className="portfolio_stocks_amount">Amount</li>
                        <li className="portfolio_stocks_price">Price $</li>
                        <li className="portfolio_stocks_change">Change $</li>
                        <li className="portfolio_stocks_change_percent">Change %</li>
                        <li className="portfolio_stocks_volume">Volume</li>
                    </ul>
                    {this.state.portfolio.stocks.map(stock =>
                        <ul className="portfolio_stocks" key={stock.origin.slug}>
                            <li className="portfolio_stocks_origin_symbol">{stock.origin.symbol}</li>
                            <li className="portfolio_stocks_origin_name">
                                <Link to={'quotes/detail/' + stock.origin.slug + '/'}>{stock.origin.name}</Link>
                            </li>
                            {stock.origin.symbol in this.state.stocks_config ?
                                <li className="portfolio_stocks_amount">
                                    {'amount' in this.state.errors ? <ul>
                                        {this.state.errors.amount.map(error =>
                                            <li key={error}>{error}</li>
                                        )}
                                    </ul> : null}
                                    <input name={'portfolio_stocks_amount_change'}
                                           defaultValue={stock.amount} ref={this.stocksAmountRef} />
                                </li> :
                                <li className="portfolio_stocks_amount">{stock.amount}</li>
                            }
                            <li className="quotes_list_detail_price">{stock.origin.tendency.quotes.close}</li>
                            <li className="quotes_list_detail_change">{stock.origin.tendency.change}</li>
                            <li className="quotes_list_detail_change_percent">{stock.origin.tendency.change_percent}</li>
                            <li className="quotes_list_detail_volume">{stock.origin.tendency.quotes.volume}</li>
                            <li className="portfolio_stocks_edit_menu">...
                                {stock.origin.symbol in this.state.stocks_config ?
                                    <ul>
                                        <li id={stock.origin.symbol}
                                         onClick={this.hide_change_amount}>Cancel</li>
                                        <li id={stock.origin.symbol}
                                            onClick={this.stocks_change_amount}>Confirm</li>
                                    </ul> :
                                    <ul>
                                        <li id={stock.origin.symbol}
                                        onClick={this.show_change_amount}>Change amount</li>
                                        <li id={stock.origin.symbol}
                                            onClick={this.stocks_delete}>Delete</li>
                                    </ul>
                                }
                            </li>
                        </ul>
                    )}
                </div>
                : <span>No stocks yet</span>
            // Checking whether there are logs where the portfolio is mentioned in
            let logs = this.state.logs.length ?
                <div className="portfolio_detail_log_list">
                    <h2>Logs</h2>
                    {this.state.logs.map(log =>
                        <LogListDetail log={log} key={log.slug}/>
                    )}
                </div> : <div className="portfolio_detail_log_list">No logs yet</div>
            // Search query stocks list
            let stocks = this.state.quotes.length ?
                <ul>
                    {this.state.quotes.map(quotes =>
                        <li key={quotes.slug}>
                            <ul>
                                <li className="quotes_list_detail_symbol">{quotes.symbol}</li>
                                <li className="quotes_list_detail_name">{quotes.name}</li>
                                <li className="quotes_list_detail_price">{quotes.tendency.quotes.close}</li>
                                <li className="quotes_list_detail_change">{quotes.tendency.change}</li>
                                <li className="quotes_list_detail_change_percent">{quotes.tendency.change_percent}</li>
                                <li className="quotes_list_detail_volume">{quotes.tendency.quotes.volume}</li>
                            </ul>
                            <div id={quotes.symbol} onClick={this.stocks_add}>Add</div>
                        </li>
                    )}
                </ul> : !this.searchRef.current ? null : this.searchRef.current.value ?
                    <span>No stocks matching query</span> : null
            // Rendering component
            return (
                <div className="portfolio_detail_block">
                    {config}
                    <div className="portfolio_detail">
                        {main_fields}
                        <div className="portfolio_detail_created">Created: {this.state.portfolio.created}</div>
                        <div className="portfolio_detail_last_updated">Last
                            updated: {this.state.portfolio.last_updated}</div>
                        <div className="portfolio_detail_stocks">
                            <h2>Stocks</h2>
                            <div id="portfolio_detail_stocks_add_button"
                                 onClick={this.show_search}>Add stocks +</div>
                            <div className={'portfolio_detail_stocks_add'} ref={this.stockBlockRef}
                                 style={{display: 'none'}}>
                                <input type="text" name="stock_name" placeholder="Type symbol or name here"
                                       maxLength="255" id="id_stock_name" ref={this.searchRef}
                                       onInput={this.stocks_search} onPaste={this.stocks_search}/>
                                {stocks}
                            </div>
                            <div className={'portfolio_detail_stocks_list'}>
                                {portfolio_stocks}
                            </div>
                        </div>
                        <div className="portfolio_detail_logs">
                            <h2>Logs</h2>
                            {logs}
                        </div>
                    </div>
                </div>
            )
        } catch (error) {
            console.log(error)
            return (<div className="portfolio_detail_block">
                Some error occurred
            </div>)
        }
    }
}
