import React from 'react'
import './PlotFinancial.css'
import {Candle, VolumeHist} from './components/drawings'
import {Figure, DatesScale, Hit} from './components/figures'
import IndicatorWindow from './IndicatorWindow'
import {QuotesType} from "../../../types/quotes";
import {IndicatorManager} from "./components/indicators";
import {bind} from "../../../utils/decorators";

export interface PlotFinancialProps {
    symbol: string,
    data: QuotesType[]
}

export interface PlotFinancialState {
    figures: Figure[]
    dates: DatesScale
    hit: Hit
    data_range: {
        start: number,
        end: number
    }
    data_amount: number | null
    indicators: object | null
    tooltips: React.ReactElement[] | null
}

// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotFinancial extends React.Component<
    PlotFinancialProps,
    PlotFinancialState
> {
    private settings: {
        max_data: number,
        base_figures: Figure[]
    }
    constructor(props: PlotFinancialProps) {
        super(props)
        this.settings = {
            max_data: 1000,
            base_figures: [
                new Figure(
                    'main',
                    850, 480,
                    1, 2,
                    0, 0.1, 0, 0.1,
                    10, '#d9d9d9', 1,
                    9, '#d9d9d9', 1,
                    1
                ),
                new Figure(
                    'volume',
                    850, 192,
                    2, 3,
                    0, 0, 0, 0,
                    10, '#d9d9d9', 1,
                    3, '#d9d9d9', 1,
                    1
                )
            ]
        }
        this.state = {
            figures: this.settings.base_figures,
            dates: new DatesScale(
                850, 48,
                3, 4,
                Array.from(props.data, obj => obj.date)
            ),
            hit: new Hit(
                850, 672,
                1, 3
            ),
            data_range: {
                start: 0,
                end: 1
            },
            data_amount: null,
            indicators: null,
            tooltips: null
        }
        // Methods binding
        this.recalculate_metadata = this.recalculate_metadata.bind(this)
        this.plot = this.plot.bind(this)
        this.setIndicators = this.setIndicators.bind(this)
    }
    @bind
    async recalculate_metadata(data_range: PlotFinancialState['data_range']) {  // Precalculating frequently used data
        let state = this.state
        state.figures.forEach(
            async figure =>
                await figure.recalculate_metadata(data_range)
        )
        await state.dates.recalculate_metadata(data_range)
        this.setState({
            ...state,
            data_range,
            data_amount: Math.max.apply(
                null, state.figures.map(
                    figure => figure.data_amount
                )
            )
        }, await this.plot)
    }
    @bind
    async plot() {
        // Drawing charts
        this.state.figures.forEach(
            async figure => await figure.plot()
        )
        // Drawing dates
        await this.state.dates.plot()
    }
    setIndicators(indicators: IndicatorManager) {
        let state = this.state
        let figures: Figure[] = []
        this.settings.base_figures.forEach(
            bf => figures.push(bf)
        )
        indicators.active.forEach(i => {
            if (i.figure.name !== this.settings.base_figures[0].name) {
                figures.push(i.figure)
            }
        })
        const separate = indicators.active.filter(
            i => i.template?.separate
        )
        state.dates.position.row = {
            start: separate.length + this.settings.base_figures.length + 1,
            end: separate.length + this.settings.base_figures.length + 2
        }
        state.hit.position.row = {
            start: 1,
            end: separate.length + this.settings.base_figures.length + 1
        }
        state.hit.window_size.height = [
            ...this.settings.base_figures.map(
                f => f.window_size.height
            ),
            ...separate.map(
                i => i.figure.window_size.height
            )
        ].reduce((partialSum, height) => partialSum + height, 0)
        this.setState({...state, figures}, () => {
            let state = this.state
            state.figures.forEach(figure => {
                figure.set_window()
            })
            state.dates.set_window()
            state.hit.set_window()
            this.setState(state, () => {
                this.recalculate_metadata(this.state.data_range)
            })
        })
    }
    // Mouse events
    @bind
    async mouseMoveHandlerMain(event: React.MouseEvent) {  // Draws coordinate pointer and tooltips if mouse pointer is over canvas
        const [x, y] = [  // Getting current in-object coordinates
            event.clientX - (
                event.target as HTMLCanvasElement
            ).getBoundingClientRect().left,
            event.clientY - (
                event.target as HTMLCanvasElement
            ).getBoundingClientRect().top
        ]
        if (x >= 0 && y >= 0) {
            let data_range = {start: 0, end: 1}
            Object.assign(data_range, this.state.data_range)
            if (this.state.hit.drag.state && this.state.data_amount) {  // If mouse is held moves data range
                const x_offset = (
                    x - this.state.hit.drag.position.x
                ) * this.state.data_amount / 100000000
                if (x_offset && this.state.data_range) {
                    // let data_range = {start: 0, end: 1}
                    // Object.assign(data_range, this.state.data_range)
                    if (x_offset < 0) { // Moving window to the left and data range to the right
                        data_range.end =
                            data_range.end - x_offset >= 1 ?
                                1 : data_range.end - x_offset
                        data_range.start =
                            data_range.end - (
                                this.state.data_range.end -
                                this.state.data_range.start
                            )
                    } else if (x_offset > 0) { // Moving window to the right and data range to the left
                        data_range.start =
                            data_range.start - x_offset <= 0 ?
                                0 : data_range.start - x_offset
                        data_range.end =
                            data_range.start + (
                                this.state.data_range.end -
                                this.state.data_range.start
                            )
                    } // Check if changes are visible (not visible on bounds)
                }
            }
            let state = this.state
            if (this.state.data_amount) {
                const segment_width = this.state.dates.width / this.state.data_amount
                const i = Math.floor(x / segment_width)
                await state.hit.show_tooltip(x, y, i, segment_width)
                // Drawing value tooltip
                let yi = y
                // Drawing date tooltip
                await state.dates.show_tooltip(i, segment_width)
                this.setState({
                    ...state,
                    tooltips: state.figures.map(
                        figure => {
                            const tooltips = figure.show_tooltips(yi, i)
                            yi -= figure.height
                            return tooltips
                        }
                    )
                })
            }
            if (
                data_range.start !== this.state.data_range.start &&
                data_range.end !== this.state.data_range.end
            ) {
                await this.recalculate_metadata(data_range)
            }
        }
    }
    @bind
    mouseOutHandlerMain() {  // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
        let state = this.state
        state.hit.hide_tooltip()
        state.hit.drag.state = false
        state.dates.hide_tooltip()
        state.figures.forEach(
            figure => figure.hide_tooltips()
        )
        this.setState({...state, tooltips: null})
    }
    @bind
    mouseDownHandlerMain(event: React.MouseEvent) {  // Date range drag change
        let hit = this.state.hit
        hit.drag = {
            state: true,
            position: {
                x: event.clientX - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().left,
                y: event.clientY - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().top,
            }
        }
        this.setState({hit})
    }
    @bind
    mouseUpHandlerMain() {  // Mouse hold off
        let hit = this.state.hit
        hit.drag = {
            ...hit.drag,
            state: false
        }
        this.setState({hit})
    }
    //// Dates canvas
    @bind
    async mouseMoveHandlerDates(event: React.MouseEvent) {
        if (this.state.dates.drag.state && this.state.data_amount) { // If mouse is held moves data range
            const x_offset = (
                this.state.dates.drag.position.x - (
                    event.clientX - (
                        event.target as HTMLCanvasElement
                    ).getBoundingClientRect().left
                )) * this.state.data_amount / 100000000
            if (x_offset && this.state.data_range) {
                let data_range = {start: 0, end: 1}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * Object.keys(this.props.data).length > this.settings.max_data ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the end
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * Object.keys(this.props.data).length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    await this.recalculate_metadata(data_range)
                }
            }
        }
    }
    @bind
    mouseOutHandlerDates() {  // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
        let dates = this.state.dates
        dates.drag.state = false
        this.setState({dates})
    }
    @bind
    mouseDownHandlerDates(event: React.MouseEvent) {
        let dates = this.state.dates
        dates.drag = {
            state: true,
            position: {
                x: event.clientX - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().left,
                y: event.clientY - (
                    event.target as HTMLCanvasElement
                ).getBoundingClientRect().top,
            }
        }
        this.setState({dates})
    }
    @bind
    mouseUpHandlerDates() {
        let dates = this.state.dates
        dates.drag = {
            ...dates.drag,
            state: false,
        }
        this.setState({dates})
    }
    // After-render plot building
    componentDidMount() {
        if (this.props.data.length > 5) {
            let state = this.state
            state.figures.forEach(
                figure => figure.set_window()
            )
            state.dates.set_window()
            state.hit.set_window()
            // Setting up main drawings
            state.figures[0].drawings.push(
                new Candle(
                    'Price',
                    this.props.data,
                    state.figures[0],
                    {
                        color: {
                            pos: '#53e9b5',
                            neg: '#da2c4d'
                        }
                    }
                )
            )
            state.figures[1].drawings.push(
                new VolumeHist(
                    'Volume',
                    this.props.data,
                    state.figures[1],
                    {
                        color: {
                            pos: '#53e9b5',
                            neg: '#da2c4d'
                        }
                    }
                )
            )
            // Applying changes and calling drawing method
            this.setState({
                ...state,
                data_range: {
                    start: 1 - (
                        this.props.data.length <= this.settings.max_data ?
                            this.props.data.length :
                            this.settings.max_data
                    ) / this.props.data.length,
                    end: 1
                }}, async () => {
                await this.recalculate_metadata(this.state.data_range)
            })
        }
    }
    render() {
        if (this.props.data.length >= 5) {
            return (
                <>
                    <IndicatorWindow
                        symbol={this.props.symbol}
                        data={this.props.data}
                        mainFigure={this.settings.base_figures[0]}
                        setIndicators={this.setIndicators}
                    />
                    <div className={'plot_financial_grid'}>
                        {this.state.figures.map((figure, i) =>
                                <div style={{display: "contents"}} key={i}>
                                    {this.state.tooltips ?
                                        <div
                                            className={'tooltips'}
                                            style={{
                                                marginTop: this.state.figures.slice(0, i).reduce(
                                                    (s, f) => s + f.height, 0
                                                )
                                        }}>
                                            {figure.tooltips?.map(tooltip => tooltip)}
                                        </div> : null}
                                    <canvas
                                        ref={figure.chart.canvas}
                                        className={`canvas_${figure.name}`}
                                    >Canvas tag is not supported by your browser.
                                    </canvas>
                                    <canvas
                                        ref={figure.value_scale.canvas}
                                        className={`canvas_${figure.name} value`}
                                    >Canvas tag is not supported by your browser.
                                    </canvas>
                                    <canvas
                                        ref={figure.value_scale.tooltip.canvas}
                                        className={`canvas_${figure.name} tooltip`}
                                    >Canvas tag is not supported by your browser.
                                    </canvas>
                                </div>
                        )}
                        <canvas
                            ref={this.state.hit.canvas}
                            onMouseMove={this.mouseMoveHandlerMain}
                            onMouseOut={this.mouseOutHandlerMain}
                            onMouseDown={this.mouseDownHandlerMain}
                            onMouseUp={this.mouseUpHandlerMain}
                            className={'canvas_hit'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.dates.canvas}
                            className={'canvas_dates'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.dates.tooltip.canvas}
                            className={'canvas_dates tooltip'}
                            onMouseMove={this.mouseMoveHandlerDates}
                            onMouseOut={this.mouseOutHandlerDates}
                            onMouseDown={this.mouseDownHandlerDates}
                            onMouseUp={this.mouseUpHandlerDates}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                    </div>
                </>
            )
        } else {
            return (
                <div className={'plot_financial_error_message'}>
                    Not enough data to observe.
                </div>
            )
        }
    }
}
