import React from 'react'
import {NavLink} from 'react-router-dom'


export default class NavBar extends React.Component<any, any> {
    private readonly tabs: {name: string, link: string}[]
    public constructor(props: any) {
        super(props)
        this.tabs = [
            {
                name: 'Analysis',
                link: '/analysis'
            }, {
                name: 'Quotes',
                link: '/quotes/list'
            }, {
                name: 'Portfolios',
                link: '/portfolio/list'
            }, {
                name: 'Logs',
                link: '/log/list'
            },
        ]
    }
    public render(): React.ReactElement {
        return(
            <nav><ul>{this.tabs.map(
                tab => <li key={tab.name}>
                    <NavLink to={tab.link}>{tab.name}</NavLink>
                </li>)}
            </ul></nav>
        )
    }
}
