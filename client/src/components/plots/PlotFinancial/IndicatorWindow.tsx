import React from 'react'
import './PlotFinancial.css'
import {Indicator, IndicatorManager} from './components/indicators'
import {PlotFinancialProps} from "./PlotFinancial"
import {Figure} from "./components/figures"
import {bind} from "../../../utils/decorators"
import {IndicatorAvailableType, IndicatorCalculatedType} from "../../../types/indicator"
import {ajax} from "../../../utils/functions";

interface IndicatorWindowProps extends PlotFinancialProps {
    mainFigure: Figure,
    setIndicators: Function
}

interface IndicatorWindowState {
    indicators: IndicatorManager | null
}

// PlotFinancial component allowing to draw charts using canvas tag
export default class IndicatorWindow extends React.Component<
    IndicatorWindowProps,
    IndicatorWindowState
> {
    public constructor(props: IndicatorWindowProps) {
        super(props)
        this.state = {
            indicators: null
        }
    }
    @bind
    public async calculateIndicator(event: React.FormEvent): Promise<void> {  // Calculate indicator
        event.preventDefault()
        await ajax(
            `http://localhost:8000/quotes/api/plot/indicators/detail/${
                this.state.indicators?.selected instanceof Indicator ?
                    this.state.indicators?.selected?.alias : null
            }`,
            'GET',
            (response: IndicatorCalculatedType) => {
                let state = this.state
                state.indicators?.append(response)
                this.setState(state, () => {
                    this.props.setIndicators(this.state.indicators)
                })
            }, (response) => {},
            {
                symbol: this.props.symbol,
                range_start: this.props.data[0].date,
                range_end: this.props.data[this.props.data.length - 1].date,
                args: JSON.stringify(Object.fromEntries(
                    (new FormData(
                        event.target as HTMLFormElement
                    )).entries()
                )),
            }
        )
    }
    @bind
    public setIndicatorColor(indicators: IndicatorManager): void {  // ColorPalette component callback
        this.setState(
            {indicators: indicators},
            () => {this.props.setIndicators(indicators)}
        )
    }
    public async componentDidMount(): Promise<void> {
        await ajax(
            'http://localhost:8000/quotes/api/plot/indicators/list',
            'GET',
            (response: IndicatorAvailableType[]) => {
                this.setState({
                    indicators: new IndicatorManager(
                        response,
                        this.setIndicatorColor,
                        this.calculateIndicator,
                        this.props.mainFigure
                    )
                })
            }
        )
    }
    public render(): React.ReactElement {
        return (
            <><div>Indicators</div>
            <div className={'indicator_window'}>
            <div>
                <span>Add</span>
                <ul className={'indicators_available_list'}
                >{this.state.indicators?.available.map(indicator =>
                        <li key={indicator.alias} onClick={() => {
                            let state = this.state
                            if (state.indicators) {
                                state.indicators.selected = indicator
                            }
                            this.setState(state)
                        }}>{indicator.verbose_name}</li>
                    )}
                </ul>
                <span>Indicators available:</span>
                <ul>{this.state.indicators?.calculated.map(
                    indicator => <li key={indicator.slug} onClick={() => {
                        let state = this.state
                        if (state.indicators) {
                            state.indicators.selected = indicator
                        }
                        this.setState(state)
                    }}><ul>
                        <li>{indicator.verbose_name}</li>
                        <li onClick={() => {
                            let state = this.state
                            state.indicators?.toggle(indicator)
                            this.setState(state, () => {
                                this.props.setIndicators(this.state.indicators)
                            })
                        }}>{indicator.active ? 'Hide' : 'Show'}</li>
                        <li onClick={() => {
                            let state = this.state
                            state.indicators?.remove(indicator)
                            this.setState(state, () => {
                                this.props.setIndicators(this.state.indicators)
                            })
                        }}>Remove</li>
                    </ul></li>
                )}</ul>
            </div>
            <div>
                <span>Arguments</span>
                {this.state.indicators?.args}
            </div>
            <div>
                <span>Style</span>
                {this.state.indicators?.style}
            </div>
        </div></>
        )
    }
}
