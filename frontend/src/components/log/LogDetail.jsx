import React from 'react'
import PlotFinancial from "../plots/PlotFinancial/PlotFinancial";
import PlotDateValue from "../plots/PlotDateValue/PlotDateValue";
import './LogDetail.css'
import $ from 'jquery'


export default class LogDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            log: {},
            errors: {},
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
    }

    initial_request() {
        let current = this
        const slug = window.location.href.match(
            /\/log\/detail\/([\w]+)/
        )[1]
        $.ajax({
            url: `http://localhost:8000/log/api/detail/${slug}`,
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

    componentDidMount() {
        this.initial_request()
    }

    render() {
        try {
            return (
                <div className="log_detail">
                    <table className="log_detail_header">
                        <tbody>
                        <tr>
                            <td className="delta_name">Strategies:</td>
                            <td className="delta_name">
                                {Object.keys(this.state.log.strategies).join(', ')}
                            </td>
                        </tr>
                        <tr>
                            <td className="delta_name">Portfolio:</td>
                            <td className="delta_name">{this.state.log.portfolio.name}</td>
                        </tr>
                        <tr>
                            <td className="delta_name">Date range:</td>
                            <td className="delta_name">{this.state.log.range_start} - {this.state.log.range_end}</td>
                        </tr>
                        </tbody>
                    </table>
                    <h4>Total value change:</h4>
                    <table>
                        <tbody>
                        <tr><th className="delta_name">Portfolio:</th></tr>
                        {this.state.log.price_deltas.balance.map(delta =>
                            <tr key={delta.strategy}>
                                <td className="delta_name">{delta.strategy}</td>
                                <td className="delta_currency">{delta.currency} $</td>
                                <td className="delta_percent">{delta.percent} %</td>
                            </tr>
                        )}
                        <tr><th className="delta_name">Stocks:</th></tr>
                        {this.state.log.price_deltas.stocks.map(delta =>
                            <tr key={delta.symbol}>
                                <td className="delta_name">{delta.symbol}</td>
                                <td className="delta_currency">{delta.currency} $</td>
                                <td className="delta_percent">{delta.percent} %</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                    <div className={'log_detail_plots'}>
                        <h3>Portfolio tendency</h3>
                        <PlotDateValue data={this.state.log.logs} />
                        <h3>Stocks tendency</h3>
                        {Object.entries(this.state.log.stocks_quotes).map(([symbol, quotes]) =>
                            <div key={symbol}>
                                <h4>{symbol}</h4>
                                <PlotFinancial data={quotes} symbol={symbol} />
                            </div>
                        )}
                    </div>
                </div>
            )
        } catch (error) {
            return (<div className="log_detail">Loading...</div>)
        }
    }
}
