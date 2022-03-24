import React from 'react'
import LogListDetail from '../log/LogListDetail'


export default class StrategyDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            strategy: {},
            logs: {},
            errors: {},
            config: false,
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.strategy_update = this.strategy_update.bind(this)
        this.strategy_delete = this.strategy_delete.bind(this)
        // Creating references
        this.formRef = React.createRef()
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

    strategy_update() {
        let current = this
        const form = this.formRef.current
        $.ajax({
            url: `${window.location.origin}/strategy/update/${this.state.strategy.slug}/`,
            type: 'PATCH',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: form.name.value,
                long_limit: form.long_limit.value,
                short_limit: form.short_limit.value,
            },
            success: function (response) {
                current.setState({
                    strategy: response.strategy,
                    errors: {},
                    config: false,
                })
            },
            error: function (response) {
                current.setState({
                    errors: response.responseJSON
                })
            }
        })
    }

    strategy_delete() {
        if (confirm('Do you really want to delete the strategy?')) {
            $.ajax({
                url: `${window.location.origin}/strategy/delete/${this.state.strategy.slug}/`,
                type: 'DELETE',
                success: function () {
                    window.location.href = '/strategy/list/'
                },
                error: function (response) {}
            })
        }
    }

    render() {
        try {
            // Checking the config mode
            let config = this.state.config ?
                <div className={'strategy_detail_config_panel'}>
                    <span className="config_button" id="strategy_config_cancel"
                          onClick={() => {this.setState({config: false, errors: {},})}}>Cancel</span>
                    <span className="config_button" id="strategy_config_confirm"
                          onClick={this.strategy_update}>Confirm</span>
                </div> : <div className={'strategy_detail_config_panel'}>
                    <span className="config_button" id="strategy_config"
                          onClick={() => {this.setState({config: true,})}}>Configure</span>
                    <span className="config_button" id="strategy_delete"
                          onClick={this.strategy_delete}>Delete</span>
                </div>
            let main_fields = !this.state.config ?
                <div className="strategy_detail_main_fields">
                    <h1 className="strategy_detail_name">{this.state.strategy.name}</h1>
                    <div className="strategy_detail_long_limit">Long limit: {this.state.strategy.long_limit}</div>
                    <div className="strategy_detail_short_limit">Short limit: {this.state.strategy.short_limit}</div>
                </div> :
                <form ref={this.formRef}>
                    {'name' in this.state.errors ? <ul>
                        {this.state.errors.name.map(error =>
                            <li key={error}>{error}</li>
                        )}
                    </ul> : null}
                    <input className="strategy_detail_name" name={'name'}
                           defaultValue={this.state.strategy.name}
                           placeholder={'Strategy name'} />
                    {'long_limit' in this.state.errors ? <ul>
                        {this.state.errors.long_limit.map(error =>
                            <li key={error}>{error}</li>
                        )}
                    </ul> : null}
                    <input className="strategy_detail_long_limit" name={'long_limit'}
                           defaultValue={this.state.strategy.long_limit}
                           placeholder={'Strategy long limit'} />
                    {'short_limit' in this.state.errors ? <ul>
                        {this.state.errors.short_limit.map(error =>
                            <li key={error}>{error}</li>
                        )}
                    </ul> : null}
                    <input className="strategy_detail_short_limit" name={'short_limit'}
                           defaultValue={this.state.strategy.short_limit}
                           placeholder={'Strategy short limit'} />
                </form>
            // Logs list
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
                    {config}
                    {main_fields}
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
