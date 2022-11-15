import React from 'react'
import $ from 'jquery'
import {dtype_to_field} from '../../forms/utils'
import './PlotFinancial.css'
import ColorMixer from '../ColorMixer/ColorMixer.jsx'
import {Candle, VolumeHist} from './components/drawings'
import {Figure, DatesScale, Hit} from './components/figures'
import IndicatorWindow from './IndicatorWindow'

// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotFinancial extends React.Component {
    constructor(props) {
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
            data_range: null,
            data_amount: null,
            indicators: null,
            tooltips: null
        }
        // Methods binding
        this.recalculate_metadata = this.recalculate_metadata.bind(this)
        this.plot = this.plot.bind(this)
        this.setIndicators = this.setIndicators.bind(this)
        // UI events binding
        //// Main canvas
        this.mouseMoveHandlerMain = this.mouseMoveHandlerMain.bind(this)
        this.mouseOutHandlerMain = this.mouseOutHandlerMain.bind(this)
        this.mouseDownHandlerMain = this.mouseDownHandlerMain.bind(this)
        this.mouseUpHandlerMain = this.mouseUpHandlerMain.bind(this)
        //// Dates canvas
        this.mouseMoveHandlerDates = this.mouseMoveHandlerDates.bind(this)
        this.mouseDownHandlerDates = this.mouseDownHandlerDates.bind(this)
        this.mouseUpHandlerDates = this.mouseUpHandlerDates.bind(this)
    }
    async recalculate_metadata(data_range) {  // Precalculating frequently used data
        let state = this.state
        state.figures.forEach(
            async figure =>
                await figure.recalculate_metadata(data_range)
        )
        await state.dates.recalculate_metadata(data_range)
        state.data_amount = Math.max.apply(
            null, state.figures.map(
                figure => figure.data_amount
            )
        )
        state.data_range = data_range
        this.setState(state, this.plot)
    }
    async plot() {
        // Drawing charts
        this.state.figures.forEach(
            async figure => await figure.plot()
        )
        // Drawing dates
        await this.state.dates.plot()
    }
    setIndicators(indicators) {
        let state = this.state
        state.figures = [...this.settings.base_figures]
        indicators.active.forEach(i => {
            state.figures.push(i.figure)
        })
        state.dates.position.row = {
            start: indicators.active.length + 3,
            end: indicators.active.length + 4
        }
        state.hit.position.row = {
            start: 1,
            end: indicators.active.length + 3
        }
        state.hit.window_size.height = [
            ...this.settings.base_figures.map(
                f => f.window_size.height
            ),
            ...indicators.active.map(
                i => i.figure.window_size.height
            )
        ].reduce((partialSum, height) => partialSum + height, 0)
        this.setState(state, () => {
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
    async mouseMoveHandlerMain(event) {  // Draws coordinate pointer and tooltips if mouse pointer is over canvas
        const [x, y] = [  // Getting current in-object coordinates
            event.clientX - event.target.getBoundingClientRect().left,
            event.clientY - event.target.getBoundingClientRect().top
        ]
        if (x >= 0 && y >= 0) {
            if (this.state.hit.drag.state) {  // If mouse is held moves data range
                const x_offset = (
                    x - this.state.hit.drag.position.x
                ) * this.state.data_amount / 100000000
                if (x_offset) {
                    let data_range = {}  // Copying current data range to new object
                    Object.assign(data_range, this.state.data_range)
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
                    if (
                        data_range.start !== this.state.data_range.start &&
                        data_range.end !== this.state.data_range.end
                    ) {
                        await this.recalculate_metadata(data_range)
                    }
                }
            }
            let state = this.state
            const segment_width = this.state.dates.width / this.state.data_amount
            const i = Math.floor(x / segment_width)
            await state.hit.show_tooltips(x, y, i, segment_width)
            // Drawing value tooltip
            let yi = y
            state.tooltips = state.figures.map(
                figure => {
                    const tooltips = figure.show_tooltips(yi, i)
                    yi -= figure.height
                    return tooltips
                }
            )
            // Drawing date tooltip
            await state.dates.show_tooltips(i, segment_width)
            this.setState(state)
        }
    }
    mouseOutHandlerMain() {  // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
        this.state.hit.hide_tooltips()
        this.state.dates.hide_tooltips()
        this.state.figures.forEach(
            figure => figure.hide_tooltips()
        )
        this.setState({tooltips: null})
    }
    mouseDownHandlerMain(event) {  // Date range drag change
        this.state.hit.drag = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    mouseUpHandlerMain() {  // Mouse hold off
        this.state.hit.drag.state = false
    }
    //// Dates canvas
    async mouseMoveHandlerDates(event) {
        if (this.state.dates.drag.state) { // If mouse is held moves data range
            const x_offset = (
                this.state.dates.drag.position.x - (
                    event.clientX - event.target.getBoundingClientRect().left
                )) * this.state.data_amount / 100000000
            if (x_offset) {
                let data_range = {}  // Copying current data range to new object
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
    mouseDownHandlerDates(event) {
        this.state.dates.drag = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    mouseUpHandlerDates() {
        this.state.dates.drag.state = false
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
            // Setting basic observed data range
            state.data_range = {
                start: 1 - (
                    this.props.data.length <= this.settings.max_data ?
                        this.props.data.length :
                        this.settings.max_data
                ) / this.props.data.length,
                end: 1
            }
            // Applying changes and calling drawing method
            this.setState(state, () => {
                this.recalculate_metadata(state.data_range)
            })
        }
    }

    render() {
        if (this.props.data.length >= 5) {
            const tooltips = this.state.tooltips ?
                <div className={'plot_financial_tooltips'}>
                    {this.state.tooltips.map(tooltip => tooltip)}
                </div> : null
            return (
                <>
                    <IndicatorWindow
                        symbol={this.props.symbol}
                        data={this.props.data}
                        setIndicators={this.setIndicators}
                    />
                    {tooltips}
                    <div className={'plot_financial_grid'}>
                        {this.state.figures.map(figure =>
                            <><canvas
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
                            </canvas></>
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
