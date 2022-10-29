import React from 'react'
import {Link} from 'react-router-dom'


export default class StrategyList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            strategies: [],
            errors: {}
        }
        // Creating references
        this.formRef = React.createRef()
        // Methods binding
        this.initial_request = this.initial_request.bind(this)
        this.strategy_create = this.strategy_create.bind(this)
        this.show_form = this.show_form.bind(this)
        // Initial request
        this.initial_request()
    }

    initial_request() {
        let current = this
        $.ajax({
            url: `/strategy/api/list`,
            type: 'GET',
            data: {},
            success: function (response) {
                current.setState({
                    strategies: response.strategies
                })
            },
            error: function (response) {}
        })
    }

    show_form() {
        let form = $(this.formRef.current)
        if (form.css('display') === 'none') {
            form.show(300)
        } else {
            form.hide(300)
        }
    }

    strategy_create(event) {
        let current = this
        event.preventDefault()
        $.ajax({
            url: `${window.location.origin}/strategy/create/`,
            type: 'POST',
            headers: {
                'X-CSRFToken': document.cookie.match(/csrftoken=([\w]+)[;]?/)[1],
            },
            data: {
                name: event.target.name.value,
                long_limit: event.target.long_limit.value,
                short_limit: event.target.short_limit.value,
            },
            success: function (response) {
                let strategies = current.state.strategies
                strategies.unshift(response.strategy)
                current.setState({
                    strategies: strategies,
                    errors: {}
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
        let strategy_list = this.state.strategies.length ?
            <div className="strategy_list">
                <div className="strategy_list_header">
                    <ul>
                        <li className="strategy_list_name">Name</li>
                        <li className="strategy_list_long_limit">Long limit</li>
                        <li className="strategy_list_short_limit">Short limit</li>
                        <li className="strategy_list_created">Created</li>
                        <li className="strategy_list_last_updated">Last updated</li>
                    </ul>
                </div>
                {this.state.strategies.map(strategy =>
                    <Link to={'/strategy/detail/' + strategy.slug + '/'} key={strategy.slug}>
                        <div className="strategy_list_detail">
                            <ul>
                                <li className="strategy_list_name">{strategy.name}</li>
                                <li className="strategy_list_long_limit">{strategy.long_limit}</li>
                                <li className="strategy_list_short_limit">{strategy.short_limit}</li>
                                <li className="strategy_list_created">{strategy.created}</li>
                                <li className="strategy_list_last_updated">{strategy.last_updated}</li>
                            </ul>
                        </div>
                    </Link>
                )}
            </div> : <div className="strategy_list">No strategies yet</div>
        return(
            <div className={'strategy_list_block'}>
                <div className={'strategy_list_create'}>
                    <div className="button_div" id={'strategy_list_add_button'}
                         onClick={this.show_form}>
                        <div>Add Strategy</div>
                        <div>+</div>
                    </div>
                    <form className={'strategy_list_create_form'} style={{display: "none"}}
                          ref={this.formRef} onSubmit={this.strategy_create}>
                        {'name' in this.state.errors ? <ul>
                            {this.state.errors.name.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input name={'name'} type={'text'} placeholder={'Strategy name'} required={true}/>
                        {'long_limit' in this.state.errors ? <ul>
                            {this.state.errors.long_limit.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input name={'long_limit'} type={'text'} placeholder={'Strategy long limit'} required={true}/>
                        {'short_limit' in this.state.errors ? <ul>
                            {this.state.errors.short_limit.map(error =>
                                <li key={error}>{error}</li>
                            )}
                        </ul> : null}
                        <input name={'short_limit'} type={'text'} placeholder={'Strategy short limit'} required={true}/>
                        <input type={'submit'} value={'Submit'} className={'button_div'}
                               id={'portfolio_list_create_button'}/>
                    </form>
                </div>
                {strategy_list}
            </div>
        )
    }
}
