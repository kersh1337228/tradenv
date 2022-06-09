import React from 'react'
import ColorMixer from '../ColorMixer/ColorMixer'
import './PlotFinancial.css'


// Figure class containing main plot component data
class Figure {
    constructor(
        window_size_width, window_size_height,
        padding_left=0, padding_top=0, padding_right=0, padding_bottom=0,
        grid_vertical_amount=10, grid_vertical_color='#000000', grid_vertical_width=1,
        grid_horizontal_amount=10, grid_horizontal_color='#000000', grid_horizontal_width=1,
        canvas_density=1
    ) {
        this.window_size = {
            width: window_size_width,
            height: window_size_height,
        }
        this.scale = {
            width: 1,
            height: 1,
        }
        this.padding = {
            left: padding_left,
            top: padding_top,
            right: padding_right,
            bottom: padding_bottom
        }
        this.axes = {
            x: 0,
            y: 0,
        }
        this.grid = {
            vertical: {
                amount: grid_vertical_amount,
                color: grid_vertical_color,
                width: grid_vertical_width,
            },
            horizontal: {
                amount: grid_horizontal_amount,
                color: grid_horizontal_color,
                width: grid_horizontal_width,
            },
        }
        this.canvas = React.createRef()
        this.context = null
        this.canvas_density = canvas_density
    }
    // Canvas actual width
    get_width() {
        return this.window_size.width * this.canvas_density
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height * this.canvas_density
    }
    set_window() {
        this.canvas.current.style.width = `${this.window_size.width}px`
        this.canvas.current.style.height = `${this.window_size.height}px`
        this.canvas.current.width = this.get_width()
        this.canvas.current.height = this.get_height()
    }
}


// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotFinancial extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        // Mutable data (influence on render)
        this.state = {
            data: props.data,
            figures: {
                main: new Figure(
                    850, 480,
                    0, 0.1, 0, 0.1,
                    10, '#d9d9d9', 1,
                    10, '#d9d9d9', 1,
                    1
                ),
                volume: new Figure(
                    850, 192,
                    0, 0.1, 0, 0,
                    10, '#d9d9d9', 1,
                    4, '#d9d9d9', 1,
                    1
                ),
                hit: new Figure(850, 672),
                dates: new Figure(850, 48, 0, 0.1)
            },
            data_range: null,
            tooltips: null,
            indicators: {
                available: [],
                active: [],
                selected: null,
            }
        }
        // Data range navigation
        this.drag = {
            main: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            },
            dates: {
                state: false,
                position: {
                    x: 0,
                    y: 0
                }
            }
        }
        this.indicatorWindow = React.createRef() // Indicator window interface block
        this.slug = props.slug  // Quotes identification slug
        // Methods binding
        this.get_indicator = this.get_indicator.bind(this)
        this.setIndicatorColor = this.setIndicatorColor.bind(this)
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
    // Financial type plot (
    //      <date:String>,
    //      (<open:Number>, <high:Number>, <low:Number>, <close:Number>, <volume:Number>)
    // )
    plot() {
        let state = this.state
        // Clear
        state.figures.main.context.clearRect(0, 0, state.figures.main.get_width(), state.figures.main.get_height())
        state.figures.volume.context.clearRect(0, 0, state.figures.volume.get_width(), state.figures.volume.get_height())
        state.figures.dates.context.clearRect(0, 0, state.figures.dates.get_width(), state.figures.dates.get_height())
        // Drawing grid on plot canvases
        this.show_grid(state.figures.main)
        this.show_grid(state.figures.volume)
        // Getting observed data range
        const n = Object.keys(state.data).length
        const data = Object.fromEntries(
            Object.entries(state.data).slice(
                Math.floor(n * state.data_range.start),
                Math.ceil(n * state.data_range.end)
            )
        )
        // Rescaling
        const active_indicators_data = [].concat(...Array.from(
            state.indicators.active, indicator => indicator.data.slice(
                Math.floor(n * state.data_range.start),
                Math.ceil(n * state.data_range.end)
            )  // Active indicators data
        )).filter(value => value !== null)
        const [lows, highs, volumes] = [  // Quotes data
            Array.from(Object.values(data), obj => obj.low),
            Array.from(Object.values(data), obj => obj.high),
            Array.from(Object.values(data), obj => obj.volume),
        ]
        //// Main
        state.figures.main.scale.height = (
            state.figures.main.get_height() * (1 - state.figures.main.padding.bottom - state.figures.main.padding.top)) /
            Math.abs(Math.max.apply(null, highs.concat(
                active_indicators_data
            )) - Math.min.apply(null, lows.concat(
                active_indicators_data
            )))
        state.figures.main.scale.width = state.figures.volume.scale.width = (
            state.figures.main.get_width() * (1 - state.figures.main.padding.left - state.figures.main.padding.right)) / (highs.length)
        //// Volume
        state.figures.volume.scale.height = (
            state.figures.volume.get_height() * (1 - state.figures.volume.padding.bottom - state.figures.volume.padding.top)) /
            Math.abs(Math.max.apply(null, volumes) - Math.min.apply(null, volumes))
        // Moving coordinates system
        //// Main
        state.figures.main.axes.y = Math.max.apply(null, highs) *
            state.figures.main.scale.height + state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x = state.figures.main.padding.left * state.figures.main.get_width()
        state.figures.main.context.save()
        state.figures.main.context.translate(state.figures.main.axes.x, state.figures.main.axes.y)
        state.figures.main.context.scale(1, -state.figures.main.scale.height)
        //// Volume
        state.figures.volume.axes.y = Math.max.apply(null, volumes) *
            state.figures.volume.scale.height + state.figures.volume.padding.top * state.figures.volume.get_height()
        state.figures.volume.axes.x = state.figures.volume.padding.left * state.figures.volume.get_width()
        state.figures.volume.context.save()
        state.figures.volume.context.translate(state.figures.volume.axes.x, state.figures.volume.axes.y)
        state.figures.volume.context.scale(1, -state.figures.volume.scale.height)
        // Drawing plots
        const data_amount = Object.keys(data).length
        for (let i = 0; i < data_amount; ++i) {
            const {open, high, low, close, volume} = Object.values(data)[i]
            const style = close - open > 0 ? '#53e9b5' : '#da2c4d'
            // Candle
            state.figures.main.context.beginPath()
            state.figures.main.context.strokeStyle = style
            state.figures.main.context.moveTo((2 * i + 1.1) * state.figures.main.scale.width / 2, low)
            state.figures.main.context.lineTo((2 * i + 1.1) * state.figures.main.scale.width / 2, high)
            state.figures.main.context.stroke()
            state.figures.main.context.fillStyle = style
            state.figures.main.context.fillRect(
                (i + 0.1) * this.state.figures.main.scale.width ,
                open,
                this.state.figures.main.scale.width * 0.9,
                close - open
            )
            state.figures.main.context.closePath()
            // Volume
            state.figures.volume.context.fillStyle = style
            state.figures.volume.context.fillRect(
                (i + 0.1) * this.state.figures.main.scale.width ,
                0,
                this.state.figures.volume.scale.width * 0.9,
                volume
            )
        }
        // Drawing indicators
        const indicator_data = Array.from(
            state.indicators.active.filter(indicator => indicator.active),
            indicator => [
                indicator.data.slice(
                    Math.floor(n * state.data_range.start),
                    Math.ceil(n * state.data_range.end)
                ), indicator.style
            ]
        )
        for (const [data, style] of indicator_data) {
            state.figures.main.context.beginPath()
            state.figures.main.context.strokeStyle = style.color
            state.figures.main.context.lineWidth = 1 / state.figures.main.scale.height
            let i = data.indexOf(data.find(element => element !== null))
            state.figures.main.context.moveTo((2 * i + 1.1) * state.figures.main.scale.width / 2, data[i])
            while (i < data_amount) {
                ++i
                state.figures.main.context.lineTo((2 * i + 1.1) * state.figures.main.scale.width / 2, data[i])
            }
            state.figures.main.context.stroke()
            state.figures.main.context.closePath()
        }
        // Drawing dates
        state.figures.dates.context.beginPath()
        state.figures.dates.context.strokeStyle = '#000000'
        // Drawing axis
        state.figures.dates.context.moveTo(
            0,
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.lineTo(
            state.figures.dates.get_width(),
            state.figures.dates.get_height() * state.figures.dates.padding.top
        )
        state.figures.dates.context.stroke()
        state.figures.dates.context.closePath()
        // Drawing data notches and dates
        const step = Math.ceil(data_amount * 0.1)
        for (let i = step; i < data_amount - step; i+=step) {
            state.figures.dates.context.beginPath()
            state.figures.dates.context.moveTo(
                (2 * i + 1.1) * state.figures.main.scale.width / 2,
                state.figures.dates.get_height() * state.figures.dates.padding.top
            )
            state.figures.dates.context.lineTo(
                (2 * i + 1.1) * state.figures.main.scale.width / 2,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.1)
            )
            state.figures.dates.context.stroke()
            state.figures.dates.context.closePath()
            state.figures.dates.context.font = '10px Arial'
            state.figures.dates.context.fillText(
                Object.keys(data)[i],
                (2 * i + 1.1) * state.figures.main.scale.width / 2 - 25,
                state.figures.dates.get_height() * (state.figures.dates.padding.top + 0.3)
            )
        }
        // Restoring context
        state.figures.main.context.restore()
        state.figures.volume.context.restore()
    }
    // Show translucent grid
    show_grid(figure) {
        const context = figure.context
        // Drawing horizontal
        context.lineWidth = figure.grid.horizontal.width * figure.canvas_density
        context.strokeStyle = figure.grid.horizontal.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.horizontal.amount; ++i) {
            const y = figure.get_height() * i / figure.grid.horizontal.amount
            context.moveTo(0, y)
            context.lineTo(this.state.figures.main.get_width(), y)
        }
        context.stroke()
        context.closePath()
        // Drawing vertical
        context.lineWidth = figure.grid.vertical.width * figure.canvas_density
        context.strokeStyle = figure.grid.vertical.color
        context.beginPath()
        for (let i = 1; i <= figure.grid.vertical.amount; ++i) {
            const x = figure.get_width() * i / figure.grid.vertical.amount
            context.moveTo(x, 0)
            context.lineTo(x, figure.get_height())
        }
        context.stroke()
        context.closePath()
    }
    // Mouse events
    //// Main canvas
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandlerMain(event) {
        const [x, y] = [ // Getting current in-object coordinates
            event.clientX - event.target.getBoundingClientRect().left,
            event.clientY - event.target.getBoundingClientRect().top
        ]
        if (this.drag.main.state) { // If mouse is held moves data range
            const x_offset = (x - this.drag.main.position.x) /
                (this.state.figures.hit.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving window to the left and data range to the right
                    data_range.end = data_range.end - x_offset >= 1 ? 1 : data_range.end - x_offset
                    data_range.start = data_range.end - (this.state.data_range.end - this.state.data_range.start)
                } else if (x_offset > 0) { // Moving window to the right and data range to the left
                    data_range.start = data_range.start - x_offset <= 0 ? 0 : data_range.start - x_offset
                    data_range.end = data_range.start + (this.state.data_range.end - this.state.data_range.start)
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start && data_range.end !== this.state.data_range.end) {
                    this.setState({data_range: data_range}, this.plot)
                }
            }
        }
        // Getting observed data range
        const n = Object.keys(this.state.data).length
        const data = Object.fromEntries(
            Object.entries(this.state.data).slice(
                Math.floor(n * this.state.data_range.start),
                Math.ceil(n * this.state.data_range.end)
            )
        )
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        context.beginPath()
        // Drawing horizontal line
        context.moveTo(0, y)
        context.lineTo(this.state.figures.hit.get_width(), y)
        // Segment hit check
        const segment_width = this.state.figures.hit.get_width() / Object.keys(data).length
        const i = Math.floor(x / segment_width)
        // Drawing vertical line
        context.moveTo((2 * i + 1.1) * segment_width / 2, 0)
        context.lineTo((2 * i + 1.1) * segment_width / 2, this.state.figures.hit.get_height())
        context.stroke()
        context.closePath()
        // Data tooltips
        const [date, {open, high, low, close, volume}] = Object.entries(data)[i]
        this.setState({tooltips: {
            date: date,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume,
            indicators: this.state.indicators.active.filter(indicator => indicator.active).map(
                indicator => Object.fromEntries(
                    [
                        ['displayed_name', indicator.displayed_name],
                        ['data', indicator.data.slice(
                            Math.floor(n * this.state.data_range.start),
                            Math.ceil(n * this.state.data_range.end)
                        )[i]],
                    ]
                )
            )
        }})
    }
    // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
    mouseOutHandlerMain() {
        const context = this.state.figures.hit.context
        context.clearRect(0, 0, this.state.figures.hit.get_width(), this.state.figures.hit.get_height())
        this.setState({tooltips: null})
    }
    // Date range drag change
    mouseDownHandlerMain(event) {
        this.drag.main = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    // Mouse hold off
    mouseUpHandlerMain() {
        this.drag.main.state = false
    }
    //// Dates canvas
    mouseMoveHandlerDates(event) {
        if (this.drag.dates.state) { // If mouse is held moves data range
            const x_offset = (this.drag.dates.position.x - (event.clientX - event.target.getBoundingClientRect().left)) /
                (this.state.figures.dates.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * Object.keys(this.state.data).length > 150 ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the end
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * Object.keys(this.state.data).length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    this.setState({data_range: data_range}, this.plot)
                }
            }
        }
    }
    mouseDownHandlerDates(event) {
        this.drag.dates = {
            state: true,
            position: {
                x: event.clientX - event.target.getBoundingClientRect().left,
                y: event.clientY - event.target.getBoundingClientRect().top,
            }
        }
    }
    mouseUpHandlerDates() {
        this.drag.dates.state = false
    }
    // After-render plot building
    componentDidMount() {
        if (Object.keys(this.state.data).length > 5) {
            let current = this
            $.ajax({
                url: '/quotes/plot/indicators/list/',
                type: 'GET',
                data: {},
                success: function (response) {
                    current.state.indicators.available = response
                    // Setting contexts
                    current.state.figures.main.context = current.state.figures.main.canvas.current.getContext('2d')
                    current.state.figures.volume.context = current.state.figures.volume.canvas.current.getContext('2d')
                    current.state.figures.hit.context = current.state.figures.hit.canvas.current.getContext('2d')
                    current.state.figures.dates.context = current.state.figures.dates.canvas.current.getContext('2d')
                    // Setting windows and canvases sizes
                    current.state.figures.main.set_window()
                    current.state.figures.volume.set_window()
                    current.state.figures.hit.set_window()
                    current.state.figures.dates.set_window()
                    // Setting basic observed data range
                    const data_amount = Object.keys(current.state.data).length
                    const default_data_amount = 150
                    current.state.data_range = {
                        start: 1 - (data_amount <= default_data_amount ? data_amount : default_data_amount) / data_amount,
                        end: 1
                    }
                    // Applying changes and calling drawing method
                    current.setState(current.state, current.plot)
                },
                error: function (response) {}
            })
        }
    }
    // Indicator data query
    get_indicator(event) {
        let current = this
        $.ajax({
            url: `/quotes/plot/indicators/detail/${this.state.indicators.selected.name}/`,
            type: 'GET',
            data: {
                slug: current.slug,
                range_start: Object.keys(current.state.data)[0],
                range_end: Object.keys(current.state.data)[Object.keys(current.state.data).length - 1],
                args: JSON.stringify(Object.fromEntries((new FormData(event.target.parentElement)).entries())),
            },
            success: function (response) {
                let indicators = current.state.indicators
                if (indicators.active.find(
                    indicator => indicator.displayed_name === indicators.selected.displayed_name
                )) {
                    indicators.active[indicators.active.indexOf(indicators.active.find(
                        indicator => indicator.displayed_name === indicators.selected.displayed_name
                    ))] = response
                } else {
                    indicators.active.push(response)
                }
                indicators.selected = response
                current.setState({indicators: indicators}, current.plot)
            },
            error: function (response) {}
        })
    }
    // ColorMixer component callback
    setIndicatorColor(color) {
        let indicators = this.state.indicators
        indicators.selected.style.color = color
        indicators.active[indicators.active.indexOf(indicators.active.find(
            indicator => indicator.displayed_name === indicators.selected.displayed_name
        ))].style.color = color
        this.setState({indicators: indicators}, this.plot)
    }
    render() {
        if (Object.keys(this.state.data).length > 5) {
            const indicator_window = <div className={'plot_financial_indicator_window'}
                                          ref={this.indicatorWindow} style={{display: 'none'}}>
                <div>
                    <span onClick={() => {
                        const list = $(this.indicatorWindow.current).find('ul.indicators_available_list')
                        if (list.css('display') === 'none') {
                            list.show(300)
                        } else {
                            list.hide(300)
                        }
                    }}>+</span>
                    <ul className={'indicators_available_list'}
                        style={{display: 'none'}}>{this.state.indicators.available.map(
                        indicator => <li key={indicator.name} onClick={() => {
                            let indicators = this.state.indicators
                            indicators.selected = null
                            this.setState({indicators: indicators}, () => {
                                indicators.selected = indicator
                                this.setState({indicators: indicators})
                            })
                        }}>
                            {indicator.name}
                        </li>
                    )}</ul>
                    <span>Active indicators list:</span>
                    <ul>{this.state.indicators.active.map(
                        indicator => <li key={indicator.displayed_name} onClick={() => {
                            let indicators = this.state.indicators
                            indicators.selected = null
                            this.setState({indicators: indicators}, () => {
                                indicators.selected = indicator
                                this.setState({indicators: indicators})
                            })
                        }}><ul>
                            <li>{indicator.displayed_name}</li>
                            <li onClick={() => {
                                let indicators = this.state.indicators
                                indicators.active[indicators.active.indexOf(indicators.active.find(
                                    i => i.displayed_name === indicator.displayed_name
                                ))].active = !indicator.active
                                this.setState({indicators: indicators}, this.plot)
                            }}>{indicator.active ? 'Hide' : 'Show'}</li>
                            <li onClick={() => {
                                let indicators = this.state.indicators
                                indicators.active.splice(indicators.active.indexOf(indicators.active.find(
                                    i => i.displayed_name === indicator.displayed_name
                                )), 1)
                                if (indicators.selected.displayed_name === indicator.displayed_name) {
                                    indicators.selected = null
                                }
                                this.setState({indicators: indicators}, this.plot)
                            }}>Remove</li>
                        </ul></li>
                    )}</ul>
                </div>
                <div>
                    <span>Arguments</span>
                    {this.state.indicators.selected ?
                        <form className={'indicator_form'}>{
                            Object.entries(this.state.indicators.selected.args).map(
                                ([name, value]) =>
                                    <input key={name} name={name} placeholder={name} defaultValue={value}/>
                            )}
                            <div onClick={() => {
                                let indicators = this.state.indicators
                                indicators.selected = null
                                this.setState({indicators: indicators})
                            }}>Cancel</div>
                            <div onClick={this.get_indicator}>Apply</div>
                        </form> :
                        <span>...</span>
                    }
                </div>
                <div>
                    <span>Style</span>
                    {this.state.indicators.selected ? this.state.indicators.selected.style ?
                        <ul>
                            <li>
                                <ColorMixer default={this.state.indicators.selected.style.color}
                                setColor={this.setIndicatorColor} />
                            </li>
                        </ul> : <span>...</span> : <span>...</span>
                    }
                </div>
            </div>
            const tooltips = this.state.tooltips ?
                <div className={'plot_financial_tooltips'}>
                    <span>Date: {this.state.tooltips.date}</span>
                    <span>Open: {this.state.tooltips.open}</span>
                    <span>High: {this.state.tooltips.high}</span>
                    <span>Low: {this.state.tooltips.low}</span>
                    <span>Close: {this.state.tooltips.close}</span>
                    <span>Volume: {this.state.tooltips.volume}</span>
                    {this.state.tooltips.indicators.map(
                        indicator => <span key={indicator.displayed_name}>{indicator.displayed_name}: {indicator.data}</span>
                    )}
                </div> : null
            return (
                <>
                    <div onClick={() => {
                        const indicator_window = $(this.indicatorWindow.current)
                        if (indicator_window.css('display') === 'none') {
                            indicator_window.show(300)
                        } else {
                            indicator_window.hide(300)
                        }
                    }}>Indicators</div>
                    {indicator_window}
                    {tooltips}
                    <div className={'plot_financial_grid'}>
                        <canvas
                            ref={this.state.figures.main.canvas}
                            className={'canvas_main'}
                        >
                            Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.volume.canvas}
                            className={'canvas_volume'}
                        >
                            Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.hit.canvas}
                            onMouseMove={this.mouseMoveHandlerMain}
                            onMouseOut={this.mouseOutHandlerMain}
                            onMouseDown={this.mouseDownHandlerMain}
                            onMouseUp={this.mouseUpHandlerMain}
                            className={'canvas_hit'}
                        >
                            Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.dates.canvas}
                            className={'canvas_dates'}
                            onMouseMove={this.mouseMoveHandlerDates}
                            onMouseDown={this.mouseDownHandlerDates}
                            onMouseUp={this.mouseUpHandlerDates}>
                            Canvas tag is not supported by your browser.
                        </canvas>
                    </div>
                </>
            )
        } else {
            return (<div className={'plot_financial_error_message'}>Not enough data to observe</div>)
        }
    }
}
