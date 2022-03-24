import React from 'react'
import LogListDetail from "./LogListDetail";


export default class LogList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            logs: [],
        }
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.log_delete = this.log_delete.bind(this)
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
                    logs: response.logs
                })
            },
            error: function (response) {}
        })
    }

    log_delete(event) {
        if (confirm(`Do you really want to delete the log?`)) {
            let current = this
            $.ajax({
                url: `${window.location.origin}/log/delete/${event.target.id}/`,
                type: 'DELETE',
                success: function () {
                    current.setState({
                        logs: current.state.logs.filter(
                            log => log.slug !== event.target.id
                        ),
                    })
                },
                error: function (response) {}
            })
        }
    }

    render() {
        return(
            <div className={'log_list_block'}>
                {this.state.logs.length ?
                <div className="log_list">
                    {this.state.logs.map(log =>
                        <>
                            <span className="config_button" id={log.slug}
                                  onClick={this.log_delete}>Delete</span>
                            <LogListDetail log={log} key={log.slug}/>
                        </>
                    )}
                </div> : <div className="log_list">No logs yet</div>
                }
            </div>
        )
    }
}