import React from 'react'
import {Link} from 'react-router-dom'


export default class LogListDetail extends React.Component {
    constructor(props) {
        super(props)
        this.log = props.log
    }

    render() {
        return (
            <div className="log_list_detail">
                <Link to={'/log/detail/' + this.log.slug + '/'}><h4 className="log_list_detail_header">
                    {this.log.strategy.name} strategy on {this.log.portfolio.name} portfolio from {this.log.time_interval_start} to {this.log.time_interval_end}
                </h4></Link>
                <h4>Total price change</h4>
                <table>
                    <tbody>
                        <tr>
                            <td className="delta_name">Balance</td>
                            <td className="delta_currency">{this.log.price_deltas.balance.currency} $</td>
                            <td className="delta_percent">{this.log.price_deltas.balance.percent} %</td>
                        </tr>
                        {this.log.price_deltas.stocks.map(delta =>
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
    }
}
