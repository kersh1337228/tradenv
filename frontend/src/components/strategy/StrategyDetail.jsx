import React from 'react'
import {Link} from 'react-router-dom'
import LogListDetail from '../log/LogListDetail'


export default class StrategyDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            strategy: {},
            logs: {},
            errors: {}
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.strategy_update = this.strategy_update.bind(this)
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
                    strategy: response.strategy,
                    logs: response.logs,
                })
            },
            error: function (response) {}
        })
    }

    strategy_update(event) {
        let current = this
        event.preventDefault()
        $.ajax({
            url: `${window.location.origin}/strategy/update/`,
            type: 'PATCH',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: event.target.name.value,
                long_limit: event.target.long_limit.value,
                short_limit: event.target.short_limit.value,
            },
            success: function (response) {
                current.setState({
                    strategy: response.strategy,
                    errors: {},
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    render() {
        try {
            let logs = this.state.logs.length ?
                <div className="strategy_detail_log_list">
                    <h2>Logs</h2>
                    {this.state.logs.map(log =>
                        <LogListDetail log={log} key={log.slug}/>
                    )}
                </div> : <div className="strategy_detail_log_list">No logs yet</div>
            // Rendering component
            return (
                <div className="strategy_detail_block">
                    <span className="config_button" id="strategy_config">Configure</span>
                    <span className="config_button" id="strategy_delete">Delete</span>
                    <div className="strategy_detail">
                        <h1 className="strategy_detail_name">{this.state.strategy.name}</h1>
                        <div className="strategy_detail_long_limit">Long limit: {this.state.strategy.long_limit}</div>
                        <div className="strategy_detail_short_limit">Short limit: {this.state.strategy.short_limit}</div>
                    </div>
                    <div className="strategy_detail_logs">
                        <h2>Logs</h2>
                        {logs}
                    </div>
                </div>
            )
        } catch (error) {
            return (<div className="strategy_detail_block">
                Some error occurred
            </div>)
        }
    }
}
