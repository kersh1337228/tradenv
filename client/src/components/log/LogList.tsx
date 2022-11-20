import React from 'react'
import LogListDetail from './LogListDetail'
import {LogType} from "../../types/log";
import {bind} from "../../utils/decorators";


export default class LogList extends React.Component<any, {logs: LogType[]}> {
    constructor(props: any) {
        super(props)
        this.state = {
            logs: [],
        }
    }
    @bind
    remove_log_from_list(slug: string) {
        this.setState({
            logs: this.state.logs.filter(
                log => log.slug !== slug
            ),
        })
    }
    async componentDidMount(): Promise<void> {
        await fetch(
            `http://localhost:8000/log/api/list`,
            {method: 'GET'}
        ).then(
            (response: Response) => response.json()
        ).then((response: {logs: LogType[]}) => {
            this.setState({
                logs: response.logs
            })
        })
    }
    public render(): React.ReactElement {
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