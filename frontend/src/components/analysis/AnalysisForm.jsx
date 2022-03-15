import React from 'react'


export default class AnalysisForm extends React.Component {
    constructor(props) { // Initialization
        super(props)
        this.state = {
            csrftoken: document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            portfolios: [],
            strategies: [],
            dates: [],
            step: 'initial',
            error_message: '',
            portfolio: '',
            time_interval_start: '',
            time_interval_end: '',
            strategy: ''
        }
        // Methods binding
        this.portfolio_render = this.portfolio_render.bind(this)
        this.initial_request = this.initial_request.bind(this)
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
                    strategies: response.strategies
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
                        portfolio: event.target.value,
                        dates: response.dates,
                        step: 'portfolio'
                    })
                },
                error: function (response) {
                    current.setState({
                        error_message: response.responseJSON.error_message
                    })
                }
            })
        }
    }

    // Render methods
    initial_render() {
        if (this.state.portfolios.length) {
            return(
                <div className="analysis_form">
                    <form method="post" encType="multipart/form-data">
                        <select id="id_portfolio" name="portfolio" onChange={this.portfolio_request}>
                            {this.state.error_message ? <span className={'form_error'}>
                                {this.state.error_message}
                            </span> : null}
                            <option>Choose the portfolio</option>
                            {this.state.portfolios.map(portfolio => {
                                <option value={portfolio.slug}>{portfolio.name}</option>
                            })}
                        </select>
                    </form>
                </div>
            )
        } else {
            return(<div className="analysis_form">No portfolios yet</div>)
        }
    }

    portfolio_render() {
        if (this.state.portfolios.length) {
            return(
                <div className="analysis_form">
                    <form method="post" encType="multipart/form-data">
                        <select id="id_portfolio" name="portfolio" onChange={this.portfolio_request}>
                            <option>Choose the portfolio</option>
                            {this.state.portfolios.map(portfolio => {
                                <option value={portfolio.slug}>{portfolio.name}</option>
                            })}
                        </select>
                    </form>
                </div>
            )
        } else {
            return(<div className="analysis_form">No portfolios yet</div>)
        }
    }

    render() { // Choosing render
        if (!this.state.error_message) {
            switch (this.state.step) {
                case 'initial':
                    return this.initial_render()
                case 'portfolio':
                    return this.portfolio_render()
            }
        } else {
            return this.initial_render()
        }
    }
}