import React from "react";
import {capitalize} from "../../../forms/utils";

class Drawing {
    constructor(name, data, figure, style) {
        this.name = name
        this.data = data
        this.figure = figure
        this.style = style
        this.visible = true
        this.tooltips = null
    }
    get spread() {
        return this.max_value - this.min_value
    }
    get data_amount() {
        return this.observed_data.length
    }
    async recalculate_metadata(data_range) {  // Precalculating frequently used data
        const [start, end] = [
            Math.floor(this.data.length * data_range.start),
            Math.ceil(this.data.length * data_range.end)
        ]
        this.observed_data = this.data.slice(start, end)
        this.min_value = Math.min.apply(null, this.observed_data)
        this.max_value = Math.max.apply(null, this.observed_data)
    }
    async plot() {}
    show_tooltips(i) {
        this.tooltips = (
            <span>
                {capitalize(this.name)}: {
                    Math.round((
                        this.observed_data[i] + Number.EPSILON
                    ) * 100) / 100}
            </span>
        )
        return this.tooltips
    }
}

class Line extends Drawing {
    async plot() {
        if (this.visible) {
            // Drawing
            this.figure.chart.context.beginPath()
            this.figure.chart.context.moveTo(
                1.1 * this.figure.scale.width / 2,
                this.observed_data[0]
            )
            for (let i = 1; i < this.observed_data.length; ++i) {
                this.figure.chart.context.lineTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    this.observed_data[i]
                )
            }
            // Stroking
            this.figure.chart.context.restore()
            this.figure.chart.context.lineWidth = this.style.width
            this.figure.chart.context.strokeStyle = this.style.color
            this.figure.chart.context.stroke()
            this.figure.chart.context.save()
            this.figure.chart.context.translate(
                this.figure.axes.x, this.figure.axes.y
            )
            this.figure.chart.context.scale(
                1, -this.figure.scale.height
            )
            this.figure.chart.context.closePath()
        }
    }
}

class Hist extends Drawing {
    async plot() {
        if (this.visible) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const value = this.observed_data[i]
                this.figure.chart.context.fillStyle = value > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                this.figure.chart.context.fillRect(
                    (i + 0.1) * this.figure.scale.width,
                    0,
                    this.figure.scale.width * 0.9,
                    value
                )
            }
            this.figure.chart.context.restore()
        }
    }
}

class Candle extends Drawing {
    async recalculate_metadata(data_range) {
        const [start, end] = [
            Math.floor(this.data.length * data_range.start),
            Math.ceil(this.data.length * data_range.end)
        ]
        this.observed_data = this.data.slice(start, end)
        this.min_value = Math.min.apply(
            null, Array.from(
                this.observed_data, obj => obj.low
            )
        )
        this.max_value = Math.max.apply(
            null, Array.from(
                this.observed_data, obj => obj.high
            )
        )
    }
    async plot() {
        if (this.visible) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const {open, high, low, close} = this.observed_data[i]
                const style = close - open > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                // Shadow
                this.figure.chart.context.beginPath()
                this.figure.chart.context.moveTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    low
                )
                this.figure.chart.context.lineTo(
                    (2 * i + 1.1) * this.figure.scale.width / 2,
                    high
                )
                this.figure.chart.context.strokeStyle = style
                this.figure.chart.context.stroke()
                this.figure.chart.context.closePath()
                // Body
                if (close - open) {  // Rectangle (non-empty body)
                    this.figure.chart.context.fillStyle = style
                    this.figure.chart.context.fillRect(
                        (i + 0.1) * this.figure.scale.width,
                        open,
                        this.figure.scale.width * 0.9,
                        close - open
                    )
                } else {  // Line (empty body)
                    this.figure.chart.context.moveTo(
                        (i + 0.1) * this.figure.scale.width,
                        open
                    )
                    this.figure.chart.context.lineTo(
                        (i + 1) * this.figure.scale.width,
                        close
                    )
                }
            }
            this.figure.chart.context.restore()
        }
    }
    show_tooltips(i) {
        const {open, high, low, close} = this.observed_data[i]
        this.tooltips = (
            <div>
                <span>Open: {Math.round((open + Number.EPSILON) * 100) / 100}</span>
                <span>High: {Math.round((high + Number.EPSILON) * 100) / 100}</span>
                <span>Low: {Math.round((low + Number.EPSILON) * 100) / 100}</span>
                <span>Close: {Math.round((close + Number.EPSILON) * 100) / 100}</span>
            </div>
        )
        return this.tooltips
    }
}

class VolumeHist extends Hist {
    async recalculate_metadata(data_range) {
        const [start, end] = [
            Math.floor(this.data.length * data_range.start),
            Math.ceil(this.data.length * data_range.end)
        ]
        this.observed_data = this.data.slice(start, end)
        this.min_value = Math.min.apply(
            null, Array.from(
                this.observed_data, obj => obj.volume
            )
        )
        this.max_value = Math.max.apply(
            null, Array.from(
                this.observed_data, obj => obj.volume
            )
        )
    }
    async plot() {
        if (this.visible) {
            this.figure.chart.context.save()
            for (let i = 0; i < this.observed_data.length; ++i) {
                const {open, close, volume} = this.observed_data[i]
                this.figure.chart.context.fillStyle = close - open > 0 ?
                    this.style.color.pos :
                    this.style.color.neg
                this.figure.chart.context.fillRect(
                    (i + 0.1) * this.figure.scale.width,
                    0,
                    this.figure.scale.width * 0.9,
                    volume
                )
            }
            this.figure.chart.context.restore()
        }
    }
    show_tooltips(i) {
        let {volume} = this.observed_data[i]
        if (volume >= 10 ** 6) {
            volume = `${Math.round((
                volume / 10 ** 6 + Number.EPSILON
            ) * 100) / 100}M`
        } else if (volume >= 10 ** 9) {
            volume = `${Math.round((
                volume / 10 ** 9 + Number.EPSILON
            ) * 100) / 100}B`
        } else {
            volume = Math.round((
                volume / 10 ** 9 + Number.EPSILON
            ) * 100) / 100
        }
        this.tooltips = (
            <span>Volume: {volume}</span>
        )
        return this.tooltips
    }
}

export {Line, Hist, Candle, VolumeHist}
