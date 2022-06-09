import React from 'react'
import {NavLink} from 'react-router-dom'


export default class NavigationBar extends React.Component {
    constructor(props) {
        super(props)
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
    }

    render() {
        return(
            <nav><ul>{this.tabs.map(
                tab => <li key={tab.name}>
                    <NavLink to={tab.link}>{tab.name}</NavLink>
                </li>)}
            </ul></nav>
        )
    }
}
