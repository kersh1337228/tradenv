import React from 'react'
import './ColorMixer.css'
import left_trig from './left_trig.png'
import right_trig from './right_trig.png'


export default class ColorMixer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            pointer: {  // Main color palette pointer
                mouseHeld: false,
                position: {
                    x: -7,
                    y: -7
                }
            },
            spectrum: {  // Hue scale
                mouseHeld: false,
                position: {
                    x: 0,
                    y: 0
                },
                hue: 'rgba(255, 0, 0, 1)',
            },
            color: {  // Color mixed
                rgba: 'rgba(255, 255, 255, 1)',
                hsb: {
                    hue: 0,
                    saturation: 0,
                    brightness: 1,
                },
                alpha: 1
            }
        }
        this.colorPalette = React.createRef()
        this.colorSpectrum = React.createRef()
        this.alphaRange = React.createRef()
        this.changeColor = this.changeColor.bind(this)
        this.changeHue = this.changeHue.bind(this)
    }

    setColor() {  // HSB to RGB conversion
        const color = this.state.color
        const c = color.hsb.brightness * color.hsb.saturation
        const x = c * (1 - Math.abs((color.hsb.hue / 60) % 2 - 1))
        const m = color.hsb.brightness - c
        let [r, g, b] = [255, 255, 255]
        if (color.hsb.hue >= 0 && color.hsb.hue < 60) {
            [r, g, b] = [c, x, 0]
        } else if (color.hsb.hue >= 60 && color.hsb.hue < 120) {
            [r, g, b] = [x, c, 0]
        } else if (color.hsb.hue >= 120 && color.hsb.hue < 180) {
            [r, g, b] = [0, c, x]
        } else if (color.hsb.hue >= 180 && color.hsb.hue < 240) {
            [r, g, b] = [0, x, c]
        } else if (color.hsb.hue >= 240 && color.hsb.hue < 300) {
            [r, g, b] = [x, 0, c]
        } else if (color.hsb.hue >= 300 && color.hsb.hue < 360) {
            [r, g, b] = [c, 0, x]
        }
        color.rgba = `rgba(${parseInt((r + m) * 255)}, ${parseInt((g + m) * 255)}, ${parseInt((b + m) * 255)}, ${color.alpha})`
        this.setState({color: color}, () => {this.props.setColor(color.rgba)})
    }

    changeColor(event) {  // Main palette pointer move event
        let [pointer, color] = [this.state.pointer, this.state.color]
        if ((event.type === 'mousemove' && pointer.mouseHeld) || event.type === 'click') {
            pointer.position = {
                x: event.pageX - 7,
                y: event.pageY - 7
            }
            const colorPalette = event.target.getBoundingClientRect()
            color.hsb = {
                hue: this.state.color.hsb.hue,
                saturation: (event.clientX - colorPalette.left) / colorPalette.width,
                brightness: 1 - (event.clientY - colorPalette.top) / colorPalette.height,
            }
            this.setState({pointer: pointer, color: color}, this.setColor)
        }
    }

    changeHue(event) {  // Hue scale level move event
        let [spectrum, color] = [this.state.spectrum, this.state.color]
        if ((event.type === 'mousemove' && spectrum.mouseHeld) || event.type === 'click') {
            spectrum.position.y = event.pageY - 9.6
            const colorSpectrum = event.target.getBoundingClientRect()
            const [overall, sector] = [
                (event.clientY - colorSpectrum.top) / colorSpectrum.height,
                (6 * (event.clientY - colorSpectrum.top) / colorSpectrum.height) % 1
            ]
            color.hsb.hue = 360 * overall  // Current hue angle
            // Changing main palette background hue
            if (overall >= 0 && overall <= 1 / 6) {
                spectrum.hue = `rgba(255, ${255 * sector}, 0, 1)`
            } else if (overall >= 1 / 6 && overall <= 2 / 6) {
                spectrum.hue = `rgba(${255 * (1 - sector)}, 255, 0, 1)`
            } else if (overall >= 2 / 6 && overall <= 3 / 6) {
                spectrum.hue = `rgba(0, 255, ${255 * sector}, 1)`
            } else if (overall >= 3 / 6 && overall <= 4 / 6) {
                spectrum.hue = `rgba(0, ${255 * (1 - sector)}, 255, 1)`
            } else if (overall >= 4 / 6 && overall <= 5 / 6) {
                spectrum.hue = `rgba(${255 * sector}, 0, 255, 1)`
            } else {
                spectrum.hue = `rgba(255, 0, ${255 * (1 - sector)}, 1)`
            }
            this.setState({spectrum: spectrum, color: color}, this.setColor)
        }
    }

    componentDidMount() {  // Initial color configuration
        let [pointer, spectrum] = [
            this.state.pointer, this.state.spectrum
        ]
        // Props default color RGB to HSB
        const rgba = this.props.default.match(
            /rgba\((?<r>[\d]+), (?<g>[\d]+), (?<b>[\d]+), (?<a>[\d\\.]+)\)/
        )
        const [r, g, b, a] = [
            parseInt(rgba.groups.r) / 255, parseInt(rgba.groups.g) / 255,
            parseInt(rgba.groups.b) / 255, parseFloat(rgba.groups.a)
        ]
        const [cmax, cmin] = [Math.max(r, g, b), Math.min(r, g, b)]
        const delta = cmax - cmin
        let hue
        if (delta === 0) {
            hue = 0
        } else if (cmax === r) {
            hue = 60 * (((g - b) / delta) % 6)
        } else if (cmax === g) {
            hue = 60 * ((b - r) / delta + 2)
        } else if (cmax === b) {
            hue = 60 * ((r - g) / delta + 4)
        }
        const [saturation, brightness] = [cmax ? delta / cmax : 0, cmax]
        // Setting pointers position
        const [colorPalette, colorSpectrum] = [
            this.colorPalette.current.getBoundingClientRect(),
            this.colorSpectrum.current.getBoundingClientRect()
        ]
        pointer.position = {
            x: colorPalette.left + document.documentElement.scrollLeft - 7 +
                colorPalette.width * saturation,
            y: colorPalette.top + document.documentElement.scrollTop - 7 +
                colorPalette.height * (1 - brightness)
        }
        spectrum.position = {
            x: colorSpectrum.left + document.documentElement.scrollLeft,
            y: colorSpectrum.top + document.documentElement.scrollTop - 9.6 +
                colorSpectrum.height / 360 * hue
        }
        // Setting main palette hue
        const [overall, sector] = [hue / 360, (6 * hue / 360) % 1]
        if (overall >= 0 && overall <= 1 / 6) {
            spectrum.hue = `rgba(255, ${255 * sector}, 0, 1)`
        } else if (overall >= 1 / 6 && overall <= 2 / 6) {
            spectrum.hue = `rgba(${255 * (1 - sector)}, 255, 0, 1)`
        } else if (overall >= 2 / 6 && overall <= 3 / 6) {
            spectrum.hue = `rgba(0, 255, ${255 * sector}, 1)`
        } else if (overall >= 3 / 6 && overall <= 4 / 6) {
            spectrum.hue = `rgba(0, ${255 * (1 - sector)}, 255, 1)`
        } else if (overall >= 4 / 6 && overall <= 5 / 6) {
            spectrum.hue = `rgba(${255 * sector}, 0, 255, 1)`
        } else {
            spectrum.hue = `rgba(255, 0, ${255 * (1 - sector)}, 1)`
        }
        // Applying changes
        this.alphaRange.current.value = a * 100
        this.setState({
            pointer: pointer, spectrum: spectrum, color: {
                rgba: `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`,
                hsb: {
                    hue: hue,
                    saturation: saturation,
                    brightness: brightness,
                },
                alpha: a
            }
        })
    }

    render() {
        return (
            <div className={'color_mixer_component'}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox={'0 0 100 100'}
                     preserveAspectRatio={'none'} className={'color_palette'} ref={this.colorPalette}
                     onMouseMove={this.changeColor} onClick={this.changeColor}
                     onMouseOut={() => {
                         let pointer = this.state.pointer
                         pointer.mouseHeld = false
                         this.setState({pointer: pointer})
                     }}
                     onMouseDown={() => {
                         let pointer = this.state.pointer
                         pointer.mouseHeld = true
                         this.setState({pointer: pointer})
                     }}
                     onMouseUp={() => {
                         let pointer = this.state.pointer
                         pointer.mouseHeld = false
                         this.setState({pointer: pointer})
                     }}
                >
                    <defs>
                        <linearGradient id={'brightness'} gradientTransform={'rotate(90)'}>
                            <stop offset={'0'} stopColor={'rgba(0, 0, 0, 0)'}></stop>
                            <stop offset={'100%'} stopColor={'rgba(0, 0, 0, 1)'}></stop>
                        </linearGradient>
                        <linearGradient id={'hue'}>
                            <stop offset={'0'} stopColor={'#ffffff'}></stop>
                            <stop offset={'100%'} stopColor={this.state.spectrum.hue}></stop>
                        </linearGradient>
                    </defs>
                    <rect x={0} y={0} width={100} height={100} fill={'url(#hue)'}></rect>
                    <rect x={0} y={0} width={100} height={100} fill={'url(#brightness)'}></rect>
                </svg>
                <div className={'color_pointer'} style={{
                    left: this.state.pointer.position.x,
                    top: this.state.pointer.position.y,
                }}></div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox={'0 0 100 100'}
                     preserveAspectRatio={'none'} className={'color_spectrum'} ref={this.colorSpectrum}
                     onMouseMove={this.changeHue} onClick={this.changeHue}
                     onMouseOut={() => {
                         let spectrum = this.state.spectrum
                         spectrum.mouseHeld = false
                         this.setState({spectrum: spectrum})
                     }}
                     onMouseDown={() => {
                         let spectrum = this.state.spectrum
                         spectrum.mouseHeld = true
                         this.setState({spectrum: spectrum})
                     }}
                     onMouseUp={() => {
                         let spectrum = this.state.spectrum
                         spectrum.mouseHeld = false
                         this.setState({spectrum: spectrum})
                     }}
                >
                    <defs>
                        <linearGradient id={'color_spectrum'} gradientTransform={'rotate(90)'}>
                            <stop offset={'0'} stopColor={'#ff0000'}></stop>
                            <stop offset={'16.6%'} stopColor={'#ffff00'}></stop>
                            <stop offset={'33.3%'} stopColor={'#00ff00'}></stop>
                            <stop offset={'50%'} stopColor={'#00ffff'}></stop>
                            <stop offset={'66.6%'} stopColor={'#0000ff'}></stop>
                            <stop offset={'83.3%'} stopColor={'#ff00ff'}></stop>
                            <stop offset={'100%'} stopColor={'#ff0000'}></stop>
                        </linearGradient>
                    </defs>
                    <rect x={0} y={0} width={100} height={100} fill={'url(#color_spectrum)'}></rect>
                </svg>
                <div className={'spectrum_pointer'} style={{
                    left: this.state.spectrum.position.x,
                    top: this.state.spectrum.position.y,
                }}>
                    <div className={'left'}>
                        <img src={left_trig} alt={'▸'} height={'10px'} />
                    </div>
                    <div className={'right'}>
                        <img src={right_trig} alt={'◂'} height={'10px'} />
                    </div>
                </div>
                <input type={'range'} ref={this.alphaRange} onChange={event => {
                    let color = this.state.color
                    color.alpha = event.target.value / 100
                    this.setState({color: color}, this.setColor)
                }} defaultValue={this.state.color.alpha * 100} className={'alpha_range'} />
                <div className={'result_color'}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox={'0 0 100 100'}
                         preserveAspectRatio={'none'}>
                        <rect x={0} y={0} width={100} height={100} fill={this.state.color.rgba}></rect>
                    </svg>
                </div>
            </div>
        )
    }
}
