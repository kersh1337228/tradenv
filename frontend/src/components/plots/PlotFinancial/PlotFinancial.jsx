import React from 'react'
import ColorMixer from '../ColorMixer/ColorMixer.jsx'
import './PlotFinancial.css'
import {dtype_to_field} from '../../forms/utils'
import $ from 'jquery'


// Figure class containing main plot component data
class Figure {
    constructor(
        window_size_width, window_size_height,
        padding_left=0, padding_top=0, padding_right=0, padding_bottom=0,
        grid_vertical_amount=0, grid_vertical_color='#000000', grid_vertical_width=1,
        grid_horizontal_amount=0, grid_horizontal_color='#000000', grid_horizontal_width=1,
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
    get_padded_width() {
        return this.get_width() * (1 - this.padding.left - this.padding.right)
    }
    // Canvas actual height
    get_height() {
        return this.window_size.height * this.canvas_density
    }
    get_padded_height() {
        return this.get_height() * (1 - this.padding.top - this.padding.bottom)
    }
    set_window() {
        this.context = this.canvas.current.getContext('2d')
        this.canvas.current.style.width = `${this.window_size.width}px`
        this.canvas.current.style.height = `${this.window_size.height}px`
        this.canvas.current.width = this.get_width()
        this.canvas.current.height = this.get_height()
    }
    // Show translucent grid
    show_grid() {
        this.context.save()  // Saving context
        // Drawing horizontal
        this.context.beginPath()
        for (let i = 1; i <= this.grid.horizontal.amount; ++i) {
            const y = this.get_height() * i / this.grid.horizontal.amount
            this.context.moveTo(0, y)
            this.context.lineTo(this.get_width(), y)
        }
        this.context.lineWidth = this.grid.horizontal.width * this.canvas_density
        this.context.strokeStyle = this.grid.horizontal.color
        this.context.stroke()
        this.context.closePath()
        this.context.restore()
        // Drawing vertical
        this.context.save()
        this.context.beginPath()
        for (let i = 1; i <= this.grid.vertical.amount; ++i) {
            const x = this.get_width() * i / this.grid.vertical.amount
            this.context.moveTo(x, 0)
            this.context.lineTo(x, this.get_height())
        }
        this.context.lineWidth = this.grid.vertical.width * this.canvas_density
        this.context.strokeStyle = this.grid.vertical.color
        this.context.stroke()
        this.context.closePath()
        this.context.restore()  // Restoring context
    }
}


// PlotFinancial component allowing to draw charts using canvas tag
export default class PlotFinancial extends React.Component {
    constructor(props) {
        // Component data initialization
        super(props)
        // Mutable data (influence on render)
        this.state = {
            figures: {
                main: new Figure(  // Japanese candles
                    850, 480,
                    0, 0.1, 0, 0.1,
                    10, '#d9d9d9', 1,
                    10, '#d9d9d9', 1,
                    1
                ),
                volume: new Figure(  // Volume histogram
                    850, 192,
                    0, 0.1, 0, 0,
                    10, '#d9d9d9', 1,
                    4, '#d9d9d9', 1,
                    1
                ),
                hit: new Figure(850, 672),  // Upper layer dashed cross
                dates: new Figure(850, 48),  // Bottom dates scale
                dates_tooltip: new Figure(850, 48),  // Bottom dates scale current date tooltip
                value: new Figure(48, 480),  // Left value scale
                value_tooltip: new Figure(48, 480), // Left value scale current price tooltip
                volume_value: new Figure(48, 192),  // Left volume scale,
                volume_value_tooltip: new Figure(48, 192) // Left value scale current volume tooltip
            },
            data_range: null,
            tooltips: null,
            indicators: {
                available: [],
                active: [],
                selected: null
            },
            meta_data: {  // Precalculated data based on observed range
                data: null,
                indicators: {
                    data: null,
                    styles: null
                },
                value: {
                    min: null,
                    max: null,
                    spread: null
                },
                volume: {
                    min: null,
                    max: null,
                    spread: null
                }
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
        this.max_data = 1000  // Max data points on chart simultaneously
        this.font = '10px Arial'
        this.indicatorWindow = React.createRef() // Indicator window interface block
        // Methods binding
        this.recalculate_metadata = this.recalculate_metadata.bind(this)
        this.plot = this.plot.bind(this)
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

    recalculate_metadata(data_range) {  // Precalculating frequently used data
        const [start, end] = [
            Math.floor(this.props.data.length * data_range.start),
            Math.ceil(this.props.data.length * data_range.end)
        ]
        const [data, indicators] = [
            this.props.data.slice(start, end),
            this.state.indicators.active.filter(
                indicator => indicator.active
            ).map(
                indicator => indicator.data.slice(start, end)
            )
        ]
        const [min_value, max_value] = [
            Math.min.apply(
                null, Array.from(
                    Object.values(data), obj => obj.high
                ).concat(...indicators.map(
                    ind => ind.filter(
                        value => value !== null
                    )
                ))
            ),
            Math.max.apply(
                null, Array.from(
                    Object.values(data), obj => obj.high
                ).concat(...indicators.map(
                    ind => ind.filter(
                        value => value !== null
                    )
                ))
            )
        ]
        const volumes = Array.from(
            Object.values(data), obj => obj.volume
        )
        const [min_volume, max_volume] = [
            Math.min.apply(null, volumes),
            Math.max.apply(null, volumes)
        ]
        let state = this.state
        state.data_range = data_range
        // Rescaling
        //// Main
        state.figures.main.scale.height =
            state.figures.main.get_padded_height() / (max_value - min_value)
        state.figures.main.scale.width =
            state.figures.main.get_padded_width() / data.length
        //// Volume
        state.figures.volume.scale.height =
            state.figures.volume.get_padded_height() / (max_volume - min_volume)
        state.figures.volume.scale.width =
            state.figures.volume.get_padded_width() / data.length
        // Moving coordinates system
        //// Main
        state.figures.main.axes.y =
            max_value * state.figures.main.scale.height +
            state.figures.main.padding.top * state.figures.main.get_height()
        state.figures.main.axes.x =
            state.figures.main.padding.left * state.figures.main.get_width()
        //// Volume
        state.figures.volume.axes.y =
            max_volume * state.figures.volume.scale.height +
            state.figures.volume.padding.top * state.figures.volume.get_height()
        state.figures.volume.axes.x =
            state.figures.volume.padding.left * state.figures.volume.get_width()
        // Meta data
        state.meta_data = {
            data: data,
            indicators: {
                data: indicators,
                styles: this.state.indicators.active.filter(
                    indicator => indicator.active
                ).map(indicator => indicator.style)
            },
            value: {
                min: min_value,
                max: max_value,
                spread: max_value - min_value
            },
            volume: {
                min: min_volume,
                max: max_volume,
                spread: max_volume - min_volume
            }
        }
        this.setState(state, this.plot)
    }

    async plot() {
        // Clear canvases
        Object.values(this.state.figures).forEach(
            figure => {
                figure.context.clearRect(
                    0, 0,
                    figure.get_width(),
                    figure.get_height()
                )
                figure.show_grid()
            }
        )
        // Moving coordinates system
        //// Main
        this.state.figures.main.context.save()
        this.state.figures.main.context.translate(
            this.state.figures.main.axes.x,
            this.state.figures.main.axes.y
        )
        this.state.figures.main.context.scale(
            1,
            -this.state.figures.main.scale.height
        )
        //// Volume
        this.state.figures.volume.context.save()
        this.state.figures.volume.context.translate(
            this.state.figures.volume.axes.x,
            this.state.figures.volume.axes.y
        )
        this.state.figures.volume.context.scale(
            1,
            -this.state.figures.volume.scale.height
        )
        // Drawing plots
        const data_amount = this.state.meta_data.data.length
        for (let i = 0; i < data_amount; ++i) {
            const {date, open, high, low, close, volume} = this.state.meta_data.data[i]
            const style = close - open > 0 ? '#53e9b5' : '#da2c4d'
            // Candle
            //// Shadow
            this.state.figures.main.context.beginPath()
            this.state.figures.main.context.moveTo(
                (2 * i + 1.1) * this.state.figures.main.scale.width / 2,
                low
            )
            this.state.figures.main.context.lineTo(
                (2 * i + 1.1) * this.state.figures.main.scale.width / 2,
                high
            )
            this.state.figures.main.context.strokeStyle = style
            this.state.figures.main.context.stroke()
            //// Body
            if (close - open) {  // Rectangle (non-empty body)
                this.state.figures.main.context.fillStyle = style
                this.state.figures.main.context.fillRect(
                    (i + 0.1) * this.state.figures.main.scale.width,
                    open,
                    this.state.figures.main.scale.width * 0.9,
                    close - open
                )
            } else {  // Line (empty body)
                this.state.figures.main.context.moveTo(
                    (i + 0.1) * this.state.figures.main.scale.width,
                    open
                )
                this.state.figures.main.context.lineTo(
                    (i + 1) * this.state.figures.main.scale.width,
                    close
                )
            }
            this.state.figures.main.context.closePath()
            // Volume
            this.state.figures.volume.context.fillStyle = style
            this.state.figures.volume.context.fillRect(
                (i + 0.1) * this.state.figures.main.scale.width ,
                0,
                this.state.figures.volume.scale.width * 0.9,
                volume + 1  // Adding one not to get zero height
            )
        }  // Restoring context
        this.state.figures.main.context.restore()
        this.state.figures.volume.context.restore()
        // Drawing indicators
        for (let i = 0; i < this.state.meta_data.indicators.data.length; ++i) {
            const [data, style] = [
                this.state.meta_data.indicators.data[i],
                this.state.meta_data.indicators.styles[i]
            ]
            this.state.figures.main.context.save()
            this.state.figures.main.context.translate(
                this.state.figures.main.axes.x,
                this.state.figures.main.axes.y
            )
            this.state.figures.main.context.scale(
                1,
                -this.state.figures.main.scale.height
            )
            this.state.figures.main.context.beginPath()
            let j = data.indexOf(data.find(element => element !== null))
            this.state.figures.main.context.moveTo(
                (2 * j + 1.1) * this.state.figures.main.scale.width / 2,
                data[j]
            )
            while (j < data_amount) {
                ++j
                this.state.figures.main.context.lineTo(
                    (2 * j + 1.1) * this.state.figures.main.scale.width / 2,
                    data[j]
                )
            }
            this.state.figures.main.context.restore()
            this.state.figures.main.context.strokeStyle = style.color
            this.state.figures.main.context.lineWidth = 1
            this.state.figures.main.context.stroke()
            this.state.figures.main.context.closePath()
        }
        // Drawing dates
        let step = Math.ceil(data_amount * 0.1)
        this.state.figures.dates.context.font = this.font
        for (let i = step; i <= data_amount - step * 0.5; i += step) {
            this.state.figures.dates.context.beginPath()
            this.state.figures.dates.context.moveTo(
                (2 * i + 1.1) * this.state.figures.main.scale.width / 2 - 1,
                this.state.figures.dates.get_height() * this.state.figures.dates.padding.top
            )
            this.state.figures.dates.context.lineTo(
                (2 * i + 1.1) * this.state.figures.main.scale.width / 2 - 1,
                this.state.figures.dates.get_height() * (this.state.figures.dates.padding.top + 0.1)
            )
            this.state.figures.dates.context.stroke()
            this.state.figures.dates.context.closePath()
            this.state.figures.dates.context.fillText(
                this.state.meta_data.data[i].date,
                (2 * i + 1.1) * this.state.figures.main.scale.width / 2 - 25,
                this.state.figures.dates.get_height() * (this.state.figures.dates.padding.top + 0.3)
            )
        }
        // Drawing value scale
        step = this.state.meta_data.value.spread / (this.state.figures.main.grid.horizontal.amount - 2)
        this.state.figures.value.context.font = this.font
        for (let i = this.state.meta_data.value.min; i < this.state.meta_data.value.max + step * 0.5; i += step) {
            this.state.figures.value.context.beginPath()
            const y = this.state.figures.value.get_height() * (
                1 - (i - this.state.meta_data.value.min) / step /
                this.state.figures.main.grid.horizontal.amount *
                this.state.figures.value.scale.height - this.state.figures.main.padding.bottom
            ) - 1
            this.state.figures.value.context.moveTo(
                this.state.figures.value.get_width() * (
                    1 - this.state.figures.value.padding.right
                ), y
            )
            this.state.figures.value.context.lineTo(
                this.state.figures.value.get_width() * (
                    0.9 - this.state.figures.value.padding.right
                ), y
            )
            this.state.figures.value.context.stroke()
            this.state.figures.value.context.closePath()
            this.state.figures.value.context.fillText(
                Math.round((i + Number.EPSILON) * 100) / 100,
                this.state.figures.value.get_width() * 0.05,
                y + 4
            )
        }
        // Drawing volume scale
        const scale = this.state.meta_data.volume.spread / this.state.figures.volume.get_padded_height()
        step = this.state.figures.volume.get_height() / this.state.figures.volume.grid.horizontal.amount
        this.state.figures.volume_value.context.font = this.font
        for (let i = step; i < this.state.figures.volume.get_height(); i += step) {
            this.state.figures.volume_value.context.beginPath()
            this.state.figures.volume_value.context.moveTo(
                this.state.figures.volume_value.get_width() * (
                    1 - this.state.figures.volume_value.padding.right
                ),
                this.state.figures.volume_value.get_height() * (
                    1 - this.state.figures.volume_value.padding.bottom
                ) - i
            )
            this.state.figures.volume_value.context.lineTo(
                this.state.figures.volume_value.get_width() * (
                    0.9 - this.state.figures.volume_value.padding.right
                ),
                this.state.figures.volume_value.get_height() * (
                    1 - this.state.figures.volume_value.padding.bottom
                ) - i
            )
            this.state.figures.volume_value.context.stroke()
            this.state.figures.volume_value.context.closePath()
            this.state.figures.volume_value.context.fillText(
                `${Math.round(((i * scale + this.state.meta_data.volume.min) / 10 ** 6 + Number.EPSILON) * 100) / 100}M`,
                this.state.figures.volume_value.get_width() * 0.05,
                this.state.figures.volume_value.get_height() * (
                    1 - this.state.figures.volume_value.padding.bottom
                ) - i + 3
            )
        }
    }
    // Mouse events
    //// Main canvas
    // Draws coordinate pointer and tooltips if mouse pointer is over canvas
    mouseMoveHandlerMain(event) {
        const [x, y] = [  // Getting current in-object coordinates
            event.clientX - event.target.getBoundingClientRect().left,
            event.clientY - event.target.getBoundingClientRect().top
        ]
        if (x >= 0 && y >= 0) {
            if (this.drag.main.state) {  // If mouse is held moves data range
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
                        this.recalculate_metadata(data_range)
                    }
                }
            }
            this.state.figures.hit.context.clearRect(
                0, 0,
                this.state.figures.hit.get_width(),
                this.state.figures.hit.get_height()
            )
            this.state.figures.hit.context.save()
            this.state.figures.hit.context.beginPath()
            this.state.figures.hit.context.strokeStyle = '#696969'
            this.state.figures.hit.context.setLineDash([5, 5])
            // Drawing horizontal line
            this.state.figures.hit.context.moveTo(0, y)
            this.state.figures.hit.context.lineTo(this.state.figures.hit.get_width(), y)
            // Drawing value tooltip
            let grid_step = this.state.figures.main.get_height() /
                this.state.figures.main.grid.horizontal.amount
            this.state.figures.value_tooltip.context.clearRect(
                0, 0,
                this.state.figures.value_tooltip.get_width(),
                this.state.figures.value_tooltip.get_height()
            )
            this.state.figures.value_tooltip.context.save()
            this.state.figures.value_tooltip.context.fillStyle = '#323232'
            this.state.figures.value_tooltip.context.fillRect(
                0,
                y - grid_step / 4,
                this.state.figures.value_tooltip.get_width(),
                grid_step / 2
            )
            this.state.figures.value_tooltip.context.font = this.font
            this.state.figures.value_tooltip.context.fillStyle = '#ffffff'
            this.state.figures.value_tooltip.context.fillText(
                Math.round(
                    (  // dv/dh * (y - hmin) + vmin
                        this.state.meta_data.value.spread /
                        this.state.figures.main.get_padded_height() * (
                            this.state.figures.main.get_height() - y -
                            this.state.figures.main.get_height() *
                            this.state.figures.main.padding.bottom
                        ) + this.state.meta_data.value.min + Number.EPSILON
                    ) * 100
                ) / 100,
                this.state.figures.value_tooltip.get_width() * 0.05,
                y + 3
            )
            this.state.figures.value_tooltip.context.restore()
            // Drawing volume tooltip
            grid_step = this.state.figures.volume.get_height() /
                this.state.figures.volume.grid.horizontal.amount
            const yv = y - this.state.figures.main.get_height()
            this.state.figures.volume_value_tooltip.context.clearRect(
                0, 0,
                this.state.figures.volume_value_tooltip.get_width(),
                this.state.figures.volume_value_tooltip.get_height()
            )
            this.state.figures.volume_value_tooltip.context.save()
            this.state.figures.volume_value_tooltip.context.fillStyle = '#323232'
            this.state.figures.volume_value_tooltip.context.fillRect(
                0,
                yv - grid_step / 4,
                this.state.figures.volume_value_tooltip.get_width(),
                grid_step / 2
            )
            this.state.figures.volume_value_tooltip.context.font = this.font
            this.state.figures.volume_value_tooltip.context.fillStyle = '#ffffff'
            this.state.figures.volume_value_tooltip.context.fillText(
                `${Math.round((
                    (
                        this.state.meta_data.volume.spread /
                        this.state.figures.volume.get_padded_height() * (
                            this.state.figures.volume.get_height() - yv
                        ) + this.state.meta_data.volume.min
                    ) / 10 ** 6 + Number.EPSILON) * 100) / 100}M`,
                this.state.figures.volume_value_tooltip.get_width() * 0.05,
                yv + 3
            )
            this.state.figures.volume_value_tooltip.context.restore()
            // Segment hit check
            const segment_width =
                this.state.figures.hit.get_width() /
                this.state.meta_data.data.length
            const i = Math.floor(x / segment_width)
            // Drawing vertical line
            this.state.figures.hit.context.moveTo(
                (2 * i + 1.1) * segment_width / 2,
                0
            )
            this.state.figures.hit.context.lineTo(
                (2 * i + 1.1) * segment_width / 2,
                this.state.figures.hit.get_height()
            )
            this.state.figures.hit.context.stroke()
            this.state.figures.hit.context.closePath()
            this.state.figures.hit.context.restore()
            // Drawing date tooltip
            const {date, open, high, low, close, volume} = this.state.meta_data.data[i]
            this.state.figures.dates_tooltip.context.clearRect(
                0, 0,
                this.state.figures.dates_tooltip.get_width(),
                this.state.figures.dates_tooltip.get_height()
            )
            this.state.figures.dates_tooltip.context.save()
            this.state.figures.dates_tooltip.context.fillStyle = '#323232'
            this.state.figures.dates_tooltip.context.fillRect(
                (2 * i + 1.1) * segment_width / 2 - 30,
                0,
                60,
                this.state.figures.dates_tooltip.get_height() * 0.4
            )
            this.state.figures.dates_tooltip.context.font = this.font
            this.state.figures.dates_tooltip.context.fillStyle = '#ffffff'
            this.state.figures.dates_tooltip.context.fillText(
                date,
                (2 * i + 1.1) * segment_width / 2 - 25,
                this.state.figures.dates_tooltip.get_height() * (
                    this.state.figures.dates_tooltip.padding.top + 0.3
                )
            )
            this.state.figures.dates_tooltip.context.restore()
            // Data tooltips
            this.setState({tooltips: {
                    open: open,
                    high: high,
                    low: low,
                    close: close,
                    volume: Math.round((volume / 10 ** 6 + Number.EPSILON) * 100) / 100,
                    indicators: this.state.indicators.active.filter(indicator => indicator.active).map(
                        indicator => Object.fromEntries(
                            [
                                ['verbose_name', indicator.verbose_name],
                                ['data', indicator.data.slice(
                                    Math.floor(this.props.data.length * this.state.data_range.start),
                                    Math.ceil(this.props.data.length * this.state.data_range.end)
                                )[i]],
                            ]
                        )
                    )
                }})
        }
    }

    // Clear coordinate pointer and tooltips if mouse pointer is out of canvas
    mouseOutHandlerMain() {
        this.state.figures.hit.context.clearRect(
            0, 0,
            this.state.figures.hit.get_width(),
            this.state.figures.hit.get_height()
        )
        this.state.figures.value_tooltip.context.clearRect(
            0, 0,
            this.state.figures.value_tooltip.get_width(),
            this.state.figures.value_tooltip.get_height()
        )
        this.state.figures.volume_value_tooltip.context.clearRect(
            0, 0,
            this.state.figures.volume_value_tooltip.get_width(),
            this.state.figures.volume_value_tooltip.get_height()
        )
        this.state.figures.dates_tooltip.context.clearRect(
            0, 0,
            this.state.figures.dates_tooltip.get_width(),
            this.state.figures.dates_tooltip.get_height()
        )
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
    async mouseMoveHandlerDates(event) {
        if (this.drag.dates.state) { // If mouse is held moves data range
            const x_offset = (this.drag.dates.position.x - (event.clientX - event.target.getBoundingClientRect().left)) /
                (this.state.figures.dates.get_width() * 200)
            if (x_offset) {
                // Copying current data range to new object
                let data_range = {}
                Object.assign(data_range, this.state.data_range)
                if (x_offset < 0) { // Moving data range start to the left
                    data_range.start = data_range.start + x_offset <= 0 ?
                        0 : (data_range.end - (data_range.start + x_offset)) * Object.keys(this.props.data).length > this.max_data ?
                            data_range.start : data_range.start + x_offset
                } else if (x_offset > 0) { // Moving data range start to the end
                    data_range.start = (data_range.end - (data_range.start + x_offset)) * Object.keys(this.props.data).length < 5 ?
                        data_range.start : data_range.start + x_offset
                } // Check if changes are visible (not visible on bounds)
                if (data_range.start !== this.state.data_range.start) {
                    this.recalculate_metadata(data_range)
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
    // Indicator data query
    get_indicator(event) {
        event.preventDefault()
        let current = this
        $.ajax({
            url: `http://localhost:8000/quotes/api/plot/indicators/detail/${
                this.state.indicators.selected.name
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
                // Applying front-end parameters
                response.style = {
                    color: 'rgba(0, 0, 0, 1)'
                }
                response.active = true
                let indicators = current.state.indicators
                if (indicators.active.find(
                    indicator => indicator.verbose_name === indicators.selected.verbose_name
                )) {
                    indicators.active[indicators.active.indexOf(indicators.active.find(
                        indicator => indicator.verbose_name === indicators.selected.verbose_name
                    ))] = response
                } else {
                    indicators.active.push(response)
                }
                indicators.selected = response
                current.setState({indicators: indicators}, () => {
                    current.recalculate_metadata(current.state.data_range)
                })
            },
            error: function (response) {}
        })
    }
    // ColorMixer component callback
    setIndicatorColor(color) {
        let indicators = this.state.indicators
        indicators.active[indicators.active.indexOf(indicators.active.find(
            indicator => indicator.verbose_name === indicators.selected.verbose_name
        ))].style.color = color
        indicators.selected.color = color
        this.setState({indicators: indicators}, () => {
            this.recalculate_metadata(this.state.data_range)
        })
    }
    // After-render plot building
    componentDidMount() {
        if (this.props.data.length > 5) {
            let current = this
            $.ajax({
                url: 'http://localhost:8000/quotes/api/plot/indicators/list',
                type: 'GET',
                data: {},
                success: function (response) {
                    current.state.indicators.available = response
                    // Setting contexts
                    Object.values(current.state.figures).forEach(figure => figure.set_window())
                    // Setting basic observed data range
                    current.state.data_range = {
                        start: 1 - (
                            current.props.data.length <= current.max_data ?
                                current.props.data.length :
                                current.max_data) / current.props.data.length,
                        end: 1
                    }
                    // Applying changes and calling drawing method
                    current.setState(current.state, () => {
                        current.recalculate_metadata(current.state.data_range)
                    })
                },
                error: function (response) {}
            })
        }
    }

    render() {
        if (this.props.data.length >= 5) {
            const indicator_window = <div
                className={'plot_financial_indicator_window'}
                ref={this.indicatorWindow}
                style={{display: 'none'}}>
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
                            {indicator.verbose_name}
                        </li>
                    )}</ul>
                    <span>Active indicators list:</span>
                    <ul>{this.state.indicators.active.map(
                        indicator => <li key={indicator.verbose_name} onClick={() => {
                            let indicators = this.state.indicators
                            indicators.selected = null
                            this.setState({indicators: indicators}, () => {
                                indicators.active[indicators.active.indexOf(indicators.active.find(
                                    ind => ind.name = indicator.name
                                ))].selected = true
                                indicators.selected = indicator
                                this.setState({indicators: indicators})
                            })
                        }}><ul>
                            <li>{indicator.verbose_name}</li>
                            <li onClick={() => {
                                let indicators = this.state.indicators
                                indicators.active[indicators.active.indexOf(indicators.active.find(
                                    i => i.verbose_name === indicator.verbose_name
                                ))].active = !indicator.active
                                this.setState({indicators: indicators}, () => {
                                    this.recalculate_metadata(this.state.data_range)
                                })
                            }}>{indicator.active ? 'Hide' : 'Show'}</li>
                            <li onClick={() => {
                                let indicators = this.state.indicators
                                indicators.active.splice(indicators.active.indexOf(indicators.active.find(
                                    i => i.verbose_name === indicator.verbose_name
                                )), 1)
                                if (indicator.selected) {
                                    indicators.selected = null
                                }
                                this.setState({indicators: indicators}, () => {
                                    this.recalculate_metadata(this.state.data_range)
                                })
                            }}>Remove</li>
                        </ul></li>
                    )}</ul>
                </div>
                <div>
                    <span>Arguments</span>
                    {this.state.indicators.selected ?
                        <form className={'indicator_form'} onSubmit={this.get_indicator}>
                            {Object.entries(this.state.indicators.selected.args).map(([name, value]) =>
                                <div key={name}>
                                    <label htmlFor={name}>
                                        {name.replace('_', ' ').replace(
                                            name[0], name[0].toUpperCase()
                                        )}
                                    </label>
                                    {(() => {
                                        const dtype = this.state.indicators.available.find(
                                            ind => ind.name === this.state.indicators.selected.name
                                        ).args[name]
                                        return dtype === value ?
                                            dtype_to_field(name, dtype) :
                                            dtype_to_field(name, dtype, value)
                                    })()}
                                </div>
                            )}
                            <button onClick={() => {
                                let indicators = this.state.indicators
                                indicators.selected = null
                                this.setState({indicators: indicators})
                            }}>Cancel</button>
                            <button type={'submit'}>Apply</button>
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
                    <span>Open: {this.state.tooltips.open}</span>
                    <span>High: {this.state.tooltips.high}</span>
                    <span>Low: {this.state.tooltips.low}</span>
                    <span>Close: {this.state.tooltips.close}</span>
                    <span>Volume: {this.state.tooltips.volume}M</span>
                    {this.state.tooltips.indicators.map(
                        indicator =>
                            <span key={indicator.verbose_name}>
                                {indicator.verbose_name}: {indicator.data}
                            </span>
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
                            className={'canvas_dates'}>
                            Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.dates_tooltip.canvas}
                            className={'canvas_dates_tooltip'}
                            onMouseMove={this.mouseMoveHandlerDates}
                            onMouseDown={this.mouseDownHandlerDates}
                            onMouseUp={this.mouseUpHandlerDates}>
                            Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.value.canvas}
                            className={'canvas_value'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.value_tooltip.canvas}
                            className={'canvas_value_tooltip'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.volume_value.canvas}
                            className={'canvas_volume_value'}
                        >Canvas tag is not supported by your browser.
                        </canvas>
                        <canvas
                            ref={this.state.figures.volume_value_tooltip.canvas}
                            className={'canvas_volume_value_tooltip'}
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
