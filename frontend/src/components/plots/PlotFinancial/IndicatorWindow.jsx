import React from 'react'
import $ from 'jquery'
import './PlotFinancial.css'
import {IndicatorManager} from './components/indicators'

// PlotFinancial component allowing to draw charts using canvas tag
export default class IndicatorWindow extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            indicators: {
                available: [],
                calculated: [],
                selected: null
            }
        }
        this.indicatorAll = React.createRef()
        this.indicatorAvailable = React.createRef()
        // Methods binding
        this.calculateIndicator = this.calculateIndicator.bind(this)
        this.setIndicatorColor = this.setIndicatorColor.bind(this)
        this.showIndicatorAll = this.showIndicatorAll.bind(this)
        this.showIndicatorAvailable = this.showIndicatorAvailable.bind(this)
    }
    showIndicatorAll() {
        const window = $(this.indicatorAll.current)
        if (window.css('display') === 'none') {
            window.show(300)
        } else {
            window.hide(300)
        }
    }
    showIndicatorAvailable() {
        const window = $(this.indicatorAvailable.current)
        if (window.css('display') === 'none') {
            window.show(300)
        } else {
            window.hide(300)
        }
    }
    calculateIndicator(event) {  // Calculate indicator
        event.preventDefault()
        let current = this
        $.ajax({
            url: `http://localhost:8000/quotes/api/plot/indicators/detail/${
                this.state.indicators.selected.alias
            }`,
            type: 'GET',
            data: {
                symbol: this.props.symbol,
                range_start: this.props.data[0].date,
                range_end: this.props.data[this.props.data.length - 1].date,
                args: JSON.stringify(
                    Object.fromEntries(
                        (new FormData(event.target)).entries()
                    )
                ),
            },
            success: function (response) {
                let state = current.state
                state.indicators.append(response)
                current.setState(state, () => {
                    current.props.setIndicators(current.state.indicators)
                })
            },
            error: function (response) {}
        })
    }
    setIndicatorColor(indicators) {  // ColorMixer component callback
        this.setState(
            {indicators: indicators},
            () => {this.props.setIndicators(indicators)}
        )
    }
    componentDidMount() {
        let current = this
        $.ajax({
            url: 'http://localhost:8000/quotes/api/plot/indicators/list',
            type: 'GET',
            data: {},
            success: function (response) {
                current.setState({
                    indicators: new IndicatorManager(
                        response,
                        current.setIndicatorColor,
                        current.calculateIndicator
                    )
                })
            },
            error: function (response) {}
        })
    }
    render() {
        return (
            <><div onClick={this.showIndicatorAll}>Indicators</div>
            <div
                className={'indicator_window'}
                ref={this.indicatorAll}
                style={{display: 'none'}}
            >
            <div>
                <span onClick={this.showIndicatorAvailable}>+</span>
                <ul
                    className={'indicators_available_list'}
                    ref={this.indicatorAvailable}
                    style={{display: 'none'}}
                >{this.state.indicators.available.map(indicator =>
                        <li key={indicator.alias} onClick={() => {
                            let state = this.state
                            state.indicators.selected = indicator
                            this.setState(state)
                        }}>{indicator.verbose_name}</li>
                    )}
                </ul>
                <span>Indicators available:</span>
                <ul>{this.state.indicators.calculated.map(
                    indicator => <li key={indicator.slug} onClick={() => {
                        let state = this.state
                        state.indicators.selected = indicator
                        this.setState(state)
                    }}><ul>
                        <li>{indicator.verbose_name}</li>
                        <li onClick={() => {
                            let state = this.state
                            state.indicators.toggle(indicator)
                            this.setState(state, () => {
                                this.props.setIndicators(this.state.indicators)
                            })
                        }}>{indicator.active ? 'Hide' : 'Show'}</li>
                        <li onClick={() => {
                            let state = this.state
                            state.indicators.remove(indicator)
                            this.setState(state, () => {
                                this.props.setIndicators(this.state.indicators)
                            })
                        }}>Remove</li>
                    </ul></li>
                )}</ul>
            </div>
            <div>
                <span>Arguments</span>
                {this.state.indicators.args}
            </div>
            <div>
                <span>Style</span>
                {this.state.indicators.style}
            </div>
        </div></>
        )
    }
}
