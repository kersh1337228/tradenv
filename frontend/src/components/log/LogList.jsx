import React from 'react'
import LogListDetail from './LogListDetail'
import $ from 'jquery'


export default class LogList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            logs: [],
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.remove_log_from_list = this.remove_log_from_list.bind(this)
    }

    initial_request() {
        let current = this
        $.ajax({
            url: `http://localhost:8000/log/api/list`,
            type: 'GET',
            data: {},
            success: function (response) {
                current.setState({
                    logs: response.logs
                })
            },
            error: function (response) {}
        })
    }

    remove_log_from_list(slug) {
        this.setState({
            logs: this.state.logs.filter(
                log => log.slug !== slug
            ),
        })
    }

    componentDidMount() {
        this.initial_request()
    }

    render() {
        return(
            <div className={'log_list_block'}>
                {this.state.logs.length ?
                <div className="log_list">
                    {this.state.logs.map(log =>
                        <LogListDetail key={log.slug} log={log} remove={this.remove_log_from_list}/>
                    )}
                </div> : <div className="log_list">No logs yet</div>
                }
            </div>
        )
    }
}