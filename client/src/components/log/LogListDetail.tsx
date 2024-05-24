import React from 'react'
import {Link} from 'react-router-dom'
import {LogType} from '../../types/log'
import {ajax} from "../../utils/functions";

interface LogListDetailProps {
    log: LogType,
    remove: Function
}

export default class LogListDetail extends React.Component<LogListDetailProps, any> {
    public constructor(props: any) {
        super(props)
    }
    public async remove(): Promise<void> {
        if (window.confirm(`Do you really want to delete the log?`)) {
            await ajax(
                `http://localhost:8000/log/api/delete/${this.props.log.slug}`,
                'DELETE',
                () => {
                    this.props.remove(this.props.log.slug)
                }
            )
        }
    }
    public render(): React.ReactElement {
        return (
            <div className="log_list_detail">
                <Link to={'/log/detail/' + this.props.log.slug}><h3>Details</h3></Link>
                <table className="log_list_detail_header">
                    <tbody>
                    <tr>
                        <td className="delta_name">Strategies:</td>
                        <td className="delta_name">{Object.keys(this.props.log.strategies).join(', ')}</td>
                    </tr>
                    <tr>
                        <td className="delta_name">Portfolio:</td>
                        <td className="delta_name">{this.props.log.portfolio.name}</td>
                    </tr>
                    <tr>
                        <td className="delta_name">Date range:</td>
                        <td className="delta_name">{this.props.log.range_start} - {this.props.log.range_end}</td>
                    </tr>
                    </tbody>
                </table>
                <h4>Total value change:</h4>
                <table>
                    <tbody>
                    <tr><th className="delta_name">Portfolio:</th></tr>
                    {this.props.log.price_deltas.balance.map(delta =>
                        <tr key={delta.strategy}>
                            <td className="delta_name">{delta.strategy}</td>
                            <td className="delta_currency">{delta.currency} $</td>
                            <td className="delta_percent">{delta.percent} %</td>
                        </tr>
                    )}
                    <tr><th className="delta_name">Stocks:</th></tr>
                    {this.props.log.price_deltas.stocks.map(delta =>
                        <tr key={delta.symbol}>
                            <td className="delta_name">{delta.symbol}</td>
                            <td className="delta_currency">{delta.currency} $</td>
                            <td className="delta_percent">{delta.percent} %</td>
                        </tr>
                    )}
                    </tbody>
                </table>
                <span className="config_button"
                      onClick={this.remove}
                      style={{cursor: 'pointer', color: 'red'}}
                >Delete</span>
            </div>
        )
    }
}
