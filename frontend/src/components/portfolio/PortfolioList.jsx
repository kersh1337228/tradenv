import React from 'react'
import {Link} from 'react-router-dom'
import $ from 'jquery'


export default class PortfolioList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            portfolios: [],
            errors: {},
            loading: false
        }
        // Creating references
        this.formRef = React.createRef()
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_create = this.portfolio_create.bind(this)
        this.show_form = this.show_form.bind(this)
    }

    initial_request() {
        let current = this
        current.setState({loading: true})
        $.ajax({
            url: `http://localhost:8000/portfolio/api/list`,
            type: 'GET',
            data: {},
            success: function (response) {
                current.setState({
                    portfolios: response.portfolios,
                    loading: false
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
            url: `http://localhost:8000/portfolio/api/create`,
            type: 'POST',
            headers: {
                'X-CSRFToken': document.cookie.match(
                    /csrftoken=([\w]+)[;]?/
                )[1],
            },
            contentType: 'application/json',
            data: JSON.stringify({
                name: event.target.name.value,
                balance: event.target.balance.valueAsNumber
            }),
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

    componentDidMount() {
        this.initial_request()
    }

    render() {
        let portfolio_list = this.state.portfolios.length ?
            <table>
                <thead>
                    <tr>
                        <th className="portfolio_list_name">Name</th>
                        <th className="portfolio_list_balance">Balance</th>
                        <th className="portfolio_list_stocks">Stocks amount</th>
                        <th className="portfolio_list_created">Created</th>
                        <th className="portfolio_list_updated">Last updated</th>
                    </tr>
                </thead>
                <tbody>
                {this.state.portfolios.map(portfolio =>
                    <tr key={portfolio.slug}>
                        <td className="portfolio_list_detail_name">
                            <Link to={'/portfolio/detail/' + portfolio.slug}>
                                {portfolio.name}
                            </Link>
                        </td>
                        <td className="portfolio_list_detail_balance">{portfolio.balance}</td>
                        <td className="portfolio_list_detail_stocks">{portfolio.stocks_amount}</td>
                        <td className="portfolio_list_detail_created">{portfolio.created}</td>
                        <td className="portfolio_list_detail_last_updated">{portfolio.last_updated}</td>
                    </tr>
                )}
                </tbody>
            </table> : <h1 className="portfolio_list">
                {this.state.loading ? 'Loading...' : 'No portfolios yet.'}
            </h1>
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
                        <input name={'balance'} type={'number'} placeholder={'Portfolio balance'} required={true}/>
                        <input type={'submit'} value={'Submit'} className={'button_div'}
                               id={'portfolio_list_create_button'}/>
                    </form>
                </div>
                {portfolio_list}
            </div>
        )
    }
}
