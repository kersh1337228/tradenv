import React, {FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {PortfolioLiteType} from "../../types/portfolio"
import {ajax} from "../../utils/functions"

interface PortfolioListState {
    portfolios: PortfolioLiteType[]
    errors: {
        [key: string]: string[]
    }
    loading: boolean
}

export default class PortfolioList extends React.Component<any, PortfolioListState> {
    constructor(props: any) {
        super(props)
        this.state = {
            portfolios: [],
            errors: {},
            loading: false
        }
        this.portfolio_create = this.portfolio_create.bind(this)
    }
    public async portfolio_create(event: FormEvent): Promise<void> {
        event.preventDefault()
        const form = event.target as HTMLFormElement
        await ajax(
            'http://localhost:8000/analysis/api/submit',
            'POST',
            (response: {portfolio: PortfolioLiteType}) => {
                let portfolios = this.state.portfolios
                portfolios.unshift(response.portfolio)
                this.setState({
                    portfolios: portfolios,
                    errors: {}
                })
            },
            (response) => {
                this.setState({
                    errors: response.responseJSON
                })
            },
            {
                name: form._name.value,
                balance: form.balance.valueAsNumber
            }
        )
    }
    public async componentDidMount(): Promise<void> {
        await ajax(
            'http://localhost:8000/portfolio/api/list',
            'GET',
            (response: {portfolios: PortfolioLiteType[]}) => {
                this.setState({
                    portfolios: response.portfolios,
                    loading: false
                })
            }
        )
    }
    public render(): React.ReactElement {
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
                    <div className="button_div">
                        Add Portfolio
                    </div>
                    <form className={'portfolio_list_create_form'} onSubmit={this.portfolio_create}>
                        {'name' in this.state.errors ? <ul>
                            {this.state.errors.name.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input
                            name={'_name'}
                            type={'text'}
                            placeholder={'Portfolio name'}
                            required={true}
                        />
                        {'balance' in this.state.errors ? <ul>
                            {this.state.errors.balance.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input
                            name={'balance'}
                            type={'number'}
                            placeholder={'Portfolio balance'}
                            required={true}
                        />
                        <input type={'submit'} value={'Submit'} className={'button_div'}
                               id={'portfolio_list_create_button'}/>
                    </form>
                </div>
                {portfolio_list}
            </div>
        )
    }
}
