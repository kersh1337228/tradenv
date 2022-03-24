import React from 'react'
import LogListDetail from '../log/LogListDetail'


export default class LogDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            log: {},
            errors: {},
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
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
                    log: response.log,
                })
            },
            error: function (response) {}
        })
    }

    render() {
        try {
            return (
                <div className="log_detail">
                    <h2 className="log_detail_header">
                        {this.state.log.strategy.name} strategy on {this.state.log.portfolio.name} portfolio from {this.state.log.time_interval_start} to {this.state.log.time_interval_end}
                    </h2>
                    <h3>Total price change</h3>
                    <table>
                        <tbody>
                        <tr>
                            <td className="delta_name">Balance</td>
                            <td className="delta_currency">{this.state.log.price_deltas.balance.currency} $</td>
                            <td className="delta_percent">{this.state.log.price_deltas.balance.percent} %</td>
                        </tr>
                        {this.state.log.price_deltas.stocks.map(delta =>
                            <tr key={delta.name}>
                                <td className="delta_name">{delta.name}</td>
                                <td className="delta_currency">{delta.currency} $</td>
                                <td className="delta_percent">{delta.percent} %</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )
        } catch (error) {
            return (<div className="log_detail">Error occurred</div>)
        }

    }
}
