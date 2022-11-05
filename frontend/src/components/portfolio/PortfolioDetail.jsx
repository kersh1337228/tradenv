import React from 'react'
import {Link} from 'react-router-dom'
import LogListDetail from '../log/LogListDetail'
import PortfolioStockDetail from "./PortfolioStockDetail";


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
            loading: false
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_update = this.portfolio_update.bind(this)
        this.show_search = this.show_search.bind(this)
        this.stocks_search = this.stocks_search.bind(this)
        this.portfolio_delete = this.portfolio_delete.bind(this)
        this.stocks_add = this.stocks_add.bind(this)
        this.stocks_alter = this.stocks_alter.bind(this)
        this.stocks_remove = this.stocks_remove.bind(this)
        // Input reference initialization
        this.searchRef = React.createRef()
        this.stockBlockRef = React.createRef()
    }

    initial_request() {
        let current = this
        const symbol = window.location.href.match(
            /\/portfolio\/detail\/([\w]+)/
        )[1]
        this.setState({loading: true}, () => {
            $.ajax({
                url: `/portfolio/api/detail/${symbol}`,
                type: 'GET',
                data: {},
                success: function (response) {
                    current.setState({
                        portfolio: response.portfolio,
                        logs: response.logs,
                        loading: false
                    })
                },
                error: function (response) {
                    if (response.status === 404) {
                        window.location.href = '/notfound'
                    }
                }
            })
        })
    }

    portfolio_delete() {
        if (confirm('Do you really want to delete the portfolio?')) {
            $.ajax({
                url: `/portfolio/api/delete/${this.state.portfolio.slug}`,
                type: 'DELETE',
                success: function () {
                    window.location.href = '/portfolio/list'
                },
                error: function (response) {}
            })
        }
    }

    portfolio_update(event) {
        event.preventDefault()
        let current = this
        $.ajax({
            url: `/portfolio/api/update/${this.state.portfolio.slug}`,
            type: 'PATCH',
            headers: {  // Sending CSRF token not to get blocked
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            contentType: 'application/json',
            data: JSON.stringify(
                Object.fromEntries(
                    $(event.target).serializeArray().map(
                        pair => [
                            pair.name,
                            pair.value.length ?
                                $.isNumeric(pair.value) ?
                                    Number(pair.value) :
                                    pair.value :
                                null
                        ]
                    )
                )
            ),
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
                url: `/quotes/api/list`,
                type: 'GET',
                data: {
                    query: event.target.value,
                },
                success: function (response) {
                    if (response.query === event.target.value) {
                        current.setState({
                            quotes: response.quotes
                        })
                    }
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
            url: `/portfolio/api/detail/${this.state.portfolio.slug}/stocks/add`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            contentType: 'application/json',
            data: JSON.stringify({symbol: event.target.id}),
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

    stocks_alter(stock, priority, amount) {
        let current = this
        $.ajax({
            url: `/portfolio/api/detail/${this.state.portfolio.slug}/stocks/alter`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            contentType: 'application/json',
            data: JSON.stringify({
                symbol: stock.props.stock.quotes.symbol,
                priority: priority,
                amount: amount
            }),
            success: function (response) {
                current.setState({
                    portfolio: response.portfolio
                }, () => {
                    stock.setState({config: false})
                })
            },
            error: function (response) {
                stock.setState({
                    config: true,
                    errors: response.responseJSON
                })
            }
        })
    }

    stocks_remove(symbol) {
        let current = this
        $.ajax({
            url: `/portfolio/api/detail/${this.state.portfolio.slug}/stocks/remove`,
            type: 'PUT',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            contentType: 'application/json',
            data: JSON.stringify({symbol: symbol}),
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

    componentDidMount() {
        this.initial_request()
    }

    render() {
        try {
            let main_fields = !this.state.config ?
                <>
                    <h1 className="portfolio_detail_name">
                        {this.state.portfolio.name}
                    </h1>
                    <div className={'portfolio_detail_config_panel'}>
                        <button className="config_button"
                                id="portfolio_config"
                                onClick={() => {
                                    this.setState({config: true})
                                }}>Configure
                        </button>
                        <button className="config_button"
                                id="portfolio_delete"
                                onClick={this.portfolio_delete}
                                style={{color: 'red'}}>Delete
                        </button>
                    </div>
                    <table className="portfolio_detail_details">
                        <tbody>
                            <tr>
                                <td>Balance:</td>
                                <td>{this.state.portfolio.balance ?
                                    this.state.portfolio.balance : '-'} $</td>
                            </tr>
                            <tr>
                                <td>Max long number: </td>
                                <td>{this.state.portfolio.long_limit ?
                                    this.state.portfolio.long_limit : '-'}</td>
                            </tr>
                            <tr>
                                <td>Max short number: </td>
                                <td>{this.state.portfolio.short_limit ?
                                    this.state.portfolio.short_limit : '-'}</td>
                            </tr>
                            <tr>
                                <td>Buy stop:</td>
                                <td>{this.state.portfolio.buy_stop ?
                                    this.state.portfolio.buy_stop : '-'}</td>
                            </tr>
                            <tr>
                                <td>Sell stop:</td>
                                <td>{this.state.portfolio.sell_stop ?
                                    this.state.portfolio.sell_stop : '-'}</td>
                            </tr>
                            <tr>
                                <td>Buy limit:</td>
                                <td>{this.state.portfolio.buy_limit ?
                                    this.state.portfolio.buy_limit : '-'}</td>
                            </tr>
                            <tr>
                                <td>Sell limit:</td>
                                <td>{this.state.portfolio.sell_limit ?
                                    this.state.portfolio.sell_limit : '-'}</td>
                            </tr>
                            <tr>
                                <td>Stop loss:</td>
                                <td>{this.state.portfolio.stop_loss ?
                                    this.state.portfolio.stop_loss : '-'}</td>
                            </tr>
                            <tr>
                                <td>Take profit:</td>
                                <td>{this.state.portfolio.take_profit ?
                                    this.state.portfolio.take_profit : '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </> :
                <form onSubmit={this.portfolio_update}>
                    {[
                        ['name', 'Name'], ['balance', 'Balance'],
                        ['long_limit', 'Max long number'], ['short_limit', 'Max short number'],
                        ['buy_stop', 'Buy stop'], ['sell_stop', 'Sell stop'],
                        ['buy_limit', 'Buy limit'], ['sell_limit', 'Sell limit'],
                        ['stop_loss', 'Stop loss'], ['take_profit', 'Take profit']
                    ].map(([fname, alias]) =>
                        <div id={`portfolio_detail_${fname}`} key={fname}>
                            {fname in this.state.errors ? <ul>
                                {this.state.errors[fname].map(error =>
                                    <li key={error}>{error}</li>
                                )}
                            </ul> : null}
                            <label htmlFor={fname}>{alias}</label>
                            <input name={fname} defaultValue={this.state.portfolio[fname]} />
                        </div>
                    )}
                    <div className={'portfolio_detail_config_panel'}>
                        <button className="config_button"
                            id="portfolio_config_cancel"
                            onClick={() => {
                                this.setState({config: false, errors: {}})
                            }}>Cancel
                        </button>
                        <button className="config_button"
                              id="portfolio_config_confirm"
                              type={'submit'}
                        >Confirm
                        </button>
                    </div>
                </form>
            // Checking whether there are stocks in portfolio
            let portfolio_stocks = Object.keys(this.state.portfolio.stocks).length ?
                <table className={'portfolio_detail_portfolio_stocks_list'}>
                    <thead>
                        <tr className="portfolio_stocks_header">
                            <th className="portfolio_stocks_priority">Priority</th>
                            <th className="portfolio_stocks_symbol">Symbol</th>
                            <th className="portfolio_stocks_name">Name</th>
                            <th className="portfolio_stocks_amount">Amount</th>
                            <th className="portfolio_stocks_price">Close price $</th>
                            <th className="portfolio_stocks_change">Change $</th>
                            <th className="portfolio_stocks_change_percent">Change %</th>
                            <th className="portfolio_stocks_volume">Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.portfolio.stocks.map(
                            stock => <PortfolioStockDetail
                                stock={stock}
                                key={stock.symbol}
                                alter={this.stocks_alter}
                                remove={this.stocks_remove}
                            />
                        )}
                    </tbody>
                </table>
                : <span className={'portfolio_detail_portfolio_stocks_list'}>
                    No stocks yet
                </span>
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
                        <li key={quotes.symbol}>
                            <ul>
                                <li className="quotes_list_detail_symbol">{quotes.symbol}</li>
                                <li className="quotes_list_detail_name">
                                    <Link to={'/quotes/detail/' + quotes.symbol}>{quotes.name}</Link>
                                </li>
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
                            {logs}
                        </div>
                    </div>
                </div>
            )
        } catch (error) {
            if (this.state.loading) {
                return (
                    <h1 className="portfolio_detail_block">
                        Loading...
                    </h1>
                )
            } else {
                return (
                    <h1 className="portfolio_detail_block">
                        Some error occurred.
                    </h1>
                )
            }
        }
    }
}
