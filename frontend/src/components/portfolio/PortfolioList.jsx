import React from 'react'
import {Link} from 'react-router-dom'


export default class PortfolioList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            portfolios: [],
            errors: {}
        }
        // Creating references
        this.formRef = React.createRef()
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_create = this.portfolio_create.bind(this)
        this.show_form = this.show_form.bind(this)
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
                    portfolios: response.portfolios
                })
            },
            error: function (response) {}
        })
    }

    show_form() {
        let form = $(this.formRef.current)
        if (form.css('display') === 'none') {
            form.show(300)
        } else {
            form.hide(300)
        }
    }

    portfolio_create(event) {
        let current = this
        event.preventDefault()
        $.ajax({
            url: `${window.location.origin}/portfolio/create/`,
            type: 'POST',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: event.target.name.value,
                balance: event.target.balance.value
            },
            success: function (response) {
                let portfolios = current.state.portfolios
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
        let portfolio_list = this.state.portfolios.length ?
            <div className="portfolio_list">
                <div className="portfolio_list_header">
                    <ul>
                        <li className="portfolio_list_name">Name</li>
                        <li className="portfolio_list_balance">Balance</li>
                        <li className="portfolio_list_stocks">Shares</li>
                        <li className="portfolio_list_logs">Logs</li>
                        <li className="portfolio_list_created">Created</li>
                        <li className="portfolio_list_updated">Last updated</li>
                    </ul>
                </div>
                {this.state.portfolios.map(portfolio =>
                    <Link to={'/portfolio/detail/' + portfolio.slug + '/'} key={portfolio.slug}>
                        <div className="portfolio_list_detail">
                            <ul>
                                <li className="portfolio_list_detail_name">{portfolio.name}</li>
                                <li className="portfolio_list_detail_balance">{portfolio.balance}</li>
                                <li className="portfolio_list_detail_stocks">{portfolio.stocks.length}</li>
                                <li className="portfolio_list_detail_created">{portfolio.created}</li>
                                <li className="portfolio_list_detail_last_updated">{portfolio.last_updated}</li>
                            </ul>
                        </div>
                    </Link>
                )}
            </div> : <div className="portfolio_list">No portfolios yet</div>
        return(
            <div className={'portfolio_list_block'}>
                <div className={'portfolio_list_create'}>
                    <div className="button_div" id={'portfolio_list_add_button'}
                         onClick={this.show_form}>
                        <div>Add Portfolio</div>
                        <div>+</div>
                    </div>
                    <form className={'portfolio_list_create_form'} style={{display: "none"}}
                          ref={this.formRef} onSubmit={this.portfolio_create}>
                        {'name' in this.state.errors ? <ul>
                            {this.state.errors.name.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input name={'name'} type={'text'} placeholder={'Portfolio name'} required={true}/>
                        {'balance' in this.state.errors ? <ul>
                            {this.state.errors.balance.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input name={'balance'} type={'text'} placeholder={'Portfolio balance'} required={true}/>
                        <input type={'submit'} value={'Submit'} className={'button_div'}
                               id={'portfolio_list_create_button'}/>
                    </form>
                </div>
                {portfolio_list}
            </div>
        )
    }
}
