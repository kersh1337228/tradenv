import React from 'react'


export default class Plot extends React.Component {
    constructor(props) {
        // React initialization
        super(props)
        this.state = {
            // data: props.data,
            data: [
                [0, 0],
                [100, 100],
                [200, 300]
            ],
            width: 600,
            height: 200,
            dpi_height: 2,
            dpi_width: 2,
            dimension: '2d',
        }
        this.canvas = React.createRef()
        // Methods binding
        this.chart = this.chart.bind(this)
        this.drawLine = this.drawLine.bind(this)
        this.grid = this.grid.bind(this)
    }

    chart() {
        let canvas = this.canvas.current
        $(canvas).css('width', `${this.state.width}px`)
        $(canvas).css('height', `${this.state.height}px`)
        canvas.width = this.state.width * this.state.dpi_width
        canvas.height = this.state.height * this.state.dpi_height
        this.grid()
        // this.drawLine(100, 100, 200, 300, '#50C002', 3)
        const linspace = (a, b, number=(b - a) / 0.01) => {
            let range = []
            for (let i = a; i <= b; i += (b - a) / number) {
                range.push(i)
            }
            return range
        }
        const x = linspace(-10, 10)
        let y = []
        x.forEach(x => y.push(Math.sin(x)))
        this.plot(x, y, '#50C002', 3)
    }

    drawLine(x1, y1, x2, y2, color, width) {
        let canvas = this.canvas.current
        const context = canvas.getContext(this.state.dimension)
        context.beginPath()
        context.lineWidth = width
        context.strokeStyle = color
        context.moveTo(x1, x2)
        context.lineTo(x2, this.state.height * this.state.dpi_height - y2)
        context.stroke()
        context.closePath()
    }

    plot(x, y, color, width) {
        const zip = (...args) => [...args[0]].map((_, i) => args.map(arg => arg[i]))
        let canvas = this.canvas.current
        const context = canvas.getContext(this.state.dimension)
        context.beginPath()
        context.lineWidth = width
        context.strokeStyle = color
        context.moveTo(x[0] * 10, this.state.height * this.state.dpi_height / 2 - y[0] * 10)
        for (const [xs, ys] of zip(x, y)) {
            context.lineTo(xs * 100, this.state.height * this.state.dpi_height / 2 - ys * 100)
        }
        context.stroke()
        context.closePath()
    }

    grid(
        horizontalAmount=parseInt(this.state.height / 30),
        verticalAmount=parseInt(this.state.width / 30),
        color='#bbb',
        width=0.5,
        horizontalLevels=true,
        verticalLevels=true,
        horizontalLevelsFont='normal 20px Times New Roman',
        verticalLevelsFont='normal 20px Times New Roman',
        horizontalLevelsColor='#121111',
        verticalLevelsColor='#121111'
    ) {
        let canvas = this.canvas.current
        const context = canvas.getContext(this.state.dimension)
        context.beginPath()
        context.lineWidth = width
        context.strokeStyle = color
        // Drawing horizontal
        if (horizontalLevels) {
            context.font = horizontalLevelsFont
            context.fillStyle = horizontalLevelsColor
            for (let i = 1; i <= horizontalAmount; ++i) {
                const y = this.state.height * this.state.dpi_height * i / horizontalAmount
                context.fillText(parseInt(this.state.height * this.state.dpi_height - y), 5, y - 5)
                context.moveTo(0, y)
                context.lineTo(this.state.width * this.state.dpi_width, y)
            }
        } else {
            for (let i = 1; i <= horizontalAmount; ++i) {
                const y = this.state.height * this.state.dpi_height * i / horizontalAmount
                context.moveTo(0, y)
                context.lineTo(this.state.width * this.state.dpi_width, y)
            }
        }
        context.stroke()
        // Drawing vertical
        if (verticalLevels) {
            context.font = verticalLevelsFont
            context.fillStyle = verticalLevelsColor
            for (let i = 1; i <= verticalAmount; ++i) {
                const x = this.state.width * this.state.dpi_width * i / verticalAmount
                context.fillText(parseInt(x + 5), x + 5, this.state.height * this.state.dpi_height - 5)
                context.moveTo(x, 0)
                context.lineTo(x, this.state.height * this.state.dpi_height)
            }
        } else {
            for (let i = 1; i <= verticalAmount; ++i) {
                const x = this.state.width * this.state.dpi_width * i / verticalAmount
                context.moveTo(x, 0)
                context.lineTo(x, this.state.height * this.state.dpi_height)
            }
        }
        context.stroke()
        context.closePath()
    }

    componentDidMount() {
        this.chart()
    }

    render() {
        return (
            <canvas ref={this.canvas} style={{border: '1px solid black'}}></canvas>
        )
    }
}
