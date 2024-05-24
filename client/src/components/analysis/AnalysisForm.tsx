import React from 'react'
import {ajax, dtype_to_field} from "../../utils/functions"
import {PortfolioLiteType} from "../../types/portfolio"
import {StrategyType} from "../../types/strategy"
import {bind} from "../../utils/decorators"

interface AnalysisFormState {
    portfolios: PortfolioLiteType[],
    strategies: StrategyType[],
    dates: string[],
    end_dates: string[],
    step: 'initial' | 'portfolio' | 'range_start' | 'range_end' | 'strategy',
    selected_strategies: string[],
    errors: {
        [key: string]: string[]
    },
}

export default class AnalysisForm extends React.Component<any, AnalysisFormState> {
    constructor(props: any) { // Initialization
        document.title = 'Analysis'
        super(props)
        this.state = {
            portfolios: [],
            strategies: [],
            dates: [],
            end_dates: [],
            step: 'initial',
            selected_strategies: [],
            errors: {},
        }
    }
    @bind
    public async portfolio_request(event: React.ChangeEvent): Promise<void> {
        const value = (event.target as HTMLSelectElement).value
        if (value) {
            await ajax(
                'http://localhost:8000/analysis/api/form',
                'GET',
                (response: {dates: string[]}) => {
                    this.setState({
                        dates: response.dates,
                        errors: {},
                        step: 'portfolio'
                    })
                },
                (response) => {
                    this.setState({
                        errors: response.errors,
                        dates: [],
                        end_dates: [],
                        step: 'initial'
                    })
                },
                {
                    step: 'portfolio',
                    slug: value
                }
            )
        } else {
            this.setState({
                dates: [],
                errors: {},
                step: 'initial'
            })
        }
    }
    @bind
    public start_date_choose(event: React.ChangeEvent): void {
        this.setState({
            end_dates: this.state.dates.slice(
                this.state.dates.indexOf((
                    event.target as HTMLSelectElement
                ).value) + 4
            ),
            step: 'range_start',
        })
    }
    @bind
    public async end_date_choose(): Promise<void> {
        await ajax(
            'http://localhost:8000/strategy/api/list',
            'GET',
            (response: {strategies: StrategyType[]}) => {
                this.setState({
                    strategies: response.strategies,
                    errors: {},
                    step: 'range_end'
                })
            }
        )
    }
    @bind
    public strategy_choose(event: React.ChangeEvent): void {
        const selected = Array(
            ...(event.target as HTMLSelectElement).options
        ).filter(
            opt => opt.selected
        ).map(opt => opt.value)
        if (selected.length) {
            this.setState({
                step: 'strategy',
                selected_strategies: selected
            })
        } else {
            this.setState({
                step: 'range_end',
                selected_strategies: []
            })
        }
    }
    @bind
    public async formSubmit(event: React.FormEvent): Promise<void> {
        event.preventDefault()
        const form = event.target as HTMLFormElement
        let data: {[key: string]: any} = {
            portfolio: form.portfolio.value,
            range_start: form.range_start.value,
            range_end: form.range_end.value,
            strategies: this.state.selected_strategies
        }
        this.state.strategies.filter(
            strategy => this.state.selected_strategies.includes(strategy.alias)
        ).forEach((strategy: StrategyType) => {
            data[strategy.alias] = Object.fromEntries(
                Object.entries(strategy.args).map(([name, dtype]) =>
                    dtype === 'list[str]' || dtype === 'list[int]' || dtype === 'list[float]' ?
                        [name, Array(...form[strategy.alias].elements).filter(
                            el => !!el.name.match(new RegExp(`${strategy.alias}_${name}_[\\d]+`))
                        ).map(el => el.type === 'number' ? el.valueAsNumber : el.value)] :
                        [name, form[strategy.alias].elements[`${strategy.alias}_${name}`].type === 'number' ?
                            form[strategy.alias].elements[`${strategy.alias}_${name}`].valueAsNumber :
                            form[strategy.alias].elements[`${strategy.alias}_${name}`].value
                        ]
                )
            )
        })
        await ajax(
            'http://localhost:8000/analysis/api/submit',
            'POST',
            (response: {slug: string}) => {
                window.location.href = `log/detail/${response.slug}`
            },
            (response) => {
                this.setState({
                    errors: response.responseJSON
                })
            },
            data
        )
    }
    public async componentDidMount(): Promise<void> {
        await ajax(
            'http://localhost:8000/analysis/api/form',
            'GET',
            (response: {portfolios: PortfolioLiteType[]}) => {
                this.setState({
                    portfolios: response.portfolios
                })
            }, (response) => {},
            {
                step: 'initial'
            }
        )
    }
    public render() { // Sequential form render
        // Step 1: Portfolio select
        const portfolio_list = this.state.portfolios.length ?
            <>{'portfolio' in this.state.errors ? <ul>
                {this.state.errors.portfolio.map(error =>
                    <li key={error}>{error}</li>
                )}
            </ul> : null}
                <select id="id_portfolio" name="portfolio" onChange={this.portfolio_request}>
                    <option value={''}>Choose the portfolio</option>
                    {this.state.portfolios.map(portfolio =>
                        <option value={portfolio.slug} key={portfolio.slug}>
                            {portfolio.name}
                        </option>
                    )}
                </select></>: <span>No portfolios yet.</span>
        // Step 2: Start date select
        const start_dates = this.state.step !== 'initial' ? this.state.dates.length ?
            <select id="id_range_start" name="range_start"
                    onChange={this.start_date_choose}>
                <option>Choose the start date.</option>
                {this.state.dates.map(date =>
                    <option value={date} key={date}>{date}</option>
                )}
            </select>: null : null
        // Step 3: End date select
        const end_dates = ['initial', 'portfolio'].indexOf(this.state.step) === -1 ? this.state.end_dates.length ?
            <select id="id_range_end" name="range_end"
                    onChange={this.end_date_choose}>
                <option>Choose the end date.</option>
                {this.state.end_dates.map(date =>
                    <option value={date} key={date}>{date}</option>
                )}
            </select>: null : null
        // Step 4: Strategy select
        const strategy_list = ['initial', 'portfolio', 'range_start'].indexOf(this.state.step) === -1 ?
            this.state.strategies.length ?
                <select id="id_strategies"
                        name="strategies"
                        onChange={this.strategy_choose}
                        multiple
                >
                    {this.state.strategies.map(strategy =>
                        <option value={strategy.alias} key={strategy.alias}>
                            {strategy.verbose_name}
                        </option>
                    )}
                </select>: <span>No strategies yet.</span> : null
        // Step 5: Strategy arguments input
        const arguments_form = this.state.selected_strategies.length ?
            <div id={'id_strategies_args'}>
                {this.state.strategies.filter(
                    strategy => this.state.selected_strategies.includes(strategy.alias)
                ).map(strategy =>
                    <fieldset id={`id_${strategy.alias}`} key={strategy.alias} name={strategy.alias}>
                        <legend>{strategy.verbose_name}</legend>
                        {Object.entries(strategy.args).map(([name, dtype]) =>
                            <div key={name}>
                                <label htmlFor={`${strategy.alias}_${name}`}>
                                    {(() => {
                                        let s = name.replace('_', ' ')
                                        return s.charAt(0).toUpperCase() + s.slice(1)
                                    })()}
                                </label>
                                {dtype_to_field(`${strategy.alias}_${name}`, dtype)}
                            </div>
                        )}
                    </fieldset>
                )}
            </div> : null
        return(
            <div className="analysis_form">
                <form method="post" encType="multipart/form-data" onSubmit={this.formSubmit}>
                    {portfolio_list}
                    {start_dates}
                    {end_dates}
                    {strategy_list}
                    {arguments_form}
                    {this.state.step === 'strategy' ?
                        <input
                            type={'submit'}
                            value={'Submit'}
                            className={'button_div'}
                            id={'analyse_button'}
                        /> : null
                    }
                </form>
            </div>
        )
    }
}