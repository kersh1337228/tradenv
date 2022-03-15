import React from 'react'
import {BrowserRouter, NavLink} from 'react-router-dom'


export default class NavigationBar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selected: 'Analysis'
        }
        this.tabs = [
            {
                name: 'Analysis',
                link: '/analysis/'
            }, {
                name: 'Quotes',
                link: '/quotes/list/'
            }, {
                name: 'Portfolios',
                link: '/portfolio/list/'
            }, {
                name: 'Strategies',
                link: '/strategy/list/'
            }, {
                name: 'Logs',
                link: '/log/list/'
            },
        ]
        // Methods binding
        this.move_to = this.move_to.bind(this)
    }

    move_to(event) {
        this.setState({selected: event.target.text})
    }

    render() {
        return(
            <BrowserRouter><ul>{this.tabs.map(
                tab => <li key={tab.name.toLowerCase()}>
                    <NavLink to={tab.link}
                             onClick={this.move_to}
                             className={
                        this.state.selected === tab.name ? 'navbar_link_selected': 'navbar_link'
                    }>
                        {tab.name}
                    </NavLink></li>)
            }</ul></BrowserRouter>
        )
    }
}
