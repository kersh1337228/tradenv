import React from 'react'
import {dtype_to_field, form_serialize} from '../forms/utils'


export default class AnalysisForm extends React.Component {
    constructor(props) { // Initialization
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
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_request = this.portfolio_request.bind(this)
        this.start_date_choose = this.start_date_choose.bind(this)
        this.end_date_choose = this.end_date_choose.bind(this)
        this.strategy_choose = this.strategy_choose.bind(this)
        this.formSubmit = this.formSubmit.bind(this)
    }

    // Request handlers
    initial_request() {
        let current = this
        $.ajax({
            url: `/analysis/form`,
            type: 'GET',
            data: {
                step: 'initial',
            },
            success: function (response) {
                current.setState({
                    portfolios: response.portfolios
                })
            },
            error: function (response) {}
        })
    }

    portfolio_request(event) {
        if (event.target.value) {
            let current = this
            $.ajax({
                url: `/analysis/form`,
                type: 'GET',
                data: {
                    step: 'portfolio',
                    slug: event.target.value
                },
                success: function (response) {
                    current.setState({
                        dates: response.dates,
                        errors: {},
                        step: 'portfolio'
                    })
                },
                error: function (response) {
                    current.setState({
                        errors: response.responseJSON,
                        dates: [],
                        end_dates: [],
                        step: 'initial',
                    })
                }
            })
        } else {
            this.setState({
                dates: [],
                errors: {},
                step: 'initial'
            })
        }
    }

    start_date_choose(event) {
        this.setState({
            end_dates: this.state.dates.slice(
                this.state.dates.indexOf(event.target.value) + 4
            ),
            step: 'range_start',
        })
    }

    end_date_choose() {
        let current = this
        $.ajax({
            url: `/strategy/api/list`,
            type: 'GET',
            data: {},
            success: function (response) {
                current.setState({
                    strategies: response.strategies,
                    step: 'range_end',
                })
            },
            error: function (response) {}
        })
    }

    strategy_choose(event) {
        const selected = Array(
            ...event.target.options
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

    formSubmit(event) {
        event.preventDefault()
        let data = {
            portfolio: event.target.portfolio.value,
            range_start: event.target.range_start.value,
            range_end: event.target.range_end.value,
            strategies: this.state.selected_strategies,
        }
        this.state.strategies.filter(
            strategy => this.state.selected_strategies.includes(strategy.alias)
        ).forEach(strategy => {
            data[strategy.alias] = Object.fromEntries(
                Object.entries(strategy.args).map(([name, dtype]) =>
                    dtype.includes('list') ?
                        [name, Array(...event.target[strategy.alias].elements).filter(
                            el => !!el.name.match(new RegExp(`${strategy.alias}_${name}_[\\d]+`))
                        ).map(el => el.type === 'number' ? el.valueAsNumber : el.value)] :
                        [name, event.target[strategy.alias].elements[`${strategy.alias}_${name}`].type === 'number' ?
                            event.target[strategy.alias].elements[`${strategy.alias}_${name}`].valueAsNumber :
                            event.target[strategy.alias].elements[`${strategy.alias}_${name}`].value
                        ]
                )
            )
        })
        let current = this
        $.ajax({
            url: `/analysis/api/submit`,
            type: 'POST',
            headers: {  // Sending CSRF token not to get blocked
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (response) {
                window.location.href = `log/detail/${response.slug}`
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

    render() { // Sequential form render
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
                                    {name.replace('_', ' ').replace(name[0], name[0].toUpperCase())}
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