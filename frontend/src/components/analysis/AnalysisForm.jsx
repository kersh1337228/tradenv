import React from 'react'


export default class AnalysisForm extends React.Component {
    constructor(props) { // Initialization
        super(props)
        this.state = {
            portfolios: [],
            strategies: [],
            dates: [],
            end_dates: [],
            step: 'initial',
            errors: {},
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.portfolio_request = this.portfolio_request.bind(this)
        this.start_date_choose = this.start_date_choose.bind(this)
        this.end_date_choose = this.end_date_choose.bind(this)
        this.strategy_choose = this.strategy_choose.bind(this)
        // Making initial request
        this.initial_request()
    }

    // Request handlers
    initial_request() {
        let current = this
        $.ajax({
            url: `${window.location.origin}/analysis/form/`,
            type: 'GET',
            data: {
                step: 'initial',
            },
            success: function (response) {
                current.setState({
                    portfolios: response.portfolios,
                    strategies: response.strategies,
                })
            },
            error: function (response) {}
        })
    }

    portfolio_request(event) {
        if (event.target.value) {
            let current = this
            $.ajax({
                url: `${window.location.origin}/analysis/form/`,
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
            step: 'time_interval_start',
        })
    }

    end_date_choose() {
        this.setState({
            step: 'time_interval_end',
        })
    }

    strategy_choose(event) {
        this.setState({
            step: 'strategy',
        })
    }

    render() { // Choosing render
        // Step 1: Portfolio select
        let portfolio_list = this.state.portfolios.length ?
            <>{'portfolio' in this.state.errors ? <ul>
                {this.state.errors.portfolio.map(error =>
                    <li key={error}>{error}</li>
                )}
            </ul> : null}
            <select id="id_portfolio" name="portfolio" onChange={this.portfolio_request}>
                <option>Choose the portfolio</option>
                {this.state.portfolios.map(portfolio =>
                    <option value={portfolio.slug} key={portfolio.slug}>
                        {portfolio.name}
                    </option>
                )}
            </select></>: <span>No portfolios yet</span>
        // Step 2: Start date select
        let start_dates = this.state.step !== 'initial' ? this.state.dates.length ?
            <select id="id_time_interval_start" name="time_interval_start"
                    onChange={this.start_date_choose}>
                <option>Choose the start date</option>
                {this.state.dates.map(date =>
                    <option value={date} key={date}>{date}</option>
                )}
            </select>: null : null
        // Step 3: End date select
        let end_dates = ['initial', 'portfolio'].indexOf(this.state.step) === -1 ? this.state.end_dates.length ?
            <select id="id_time_interval_end" name="time_interval_end"
                    onChange={this.end_date_choose}>
                <option>Choose the end date</option>
                {this.state.end_dates.map(date =>
                    <option value={date} key={date}>{date}</option>
                )}
            </select>: null : null
        // Step 4: Strategy select
        let strategy_list = ['initial', 'portfolio', 'time_interval_start'].indexOf(this.state.step) === -1 ?
            this.state.strategies.length ?
            <select id="id_strategy" name="strategy"
                    onChange={this.strategy_choose}>
                <option>Choose the strategy</option>
                {this.state.strategies.map(strategy =>
                    <option value={strategy.slug} key={strategy.slug}>{strategy.name}</option>
                )}
            </select>: <span>No strategies yet</span> : null
        return(
            <div className="analysis_form">
                <form method="post" encType="multipart/form-data">
                    {portfolio_list}
                    {start_dates}
                    {end_dates}
                    {strategy_list}
                    {this.state.step === 'strategy' ?
                        <input type={'submit'} value={'Submit'} className={'button_div'}
                               id={'analyse_button'} /> : null
                    }
                </form>
            </div>
        )
    }
}