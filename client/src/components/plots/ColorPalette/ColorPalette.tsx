import React from 'react'
import './ColorPalette.css'
import {colorT} from '../../../types/general'
import {colorToString} from "../../../utils/functions";

interface ColorPaletteProps {
    default: colorT,
    setColor: Function
}

interface ColorPaletteState {
    pointer: {  // Color palette pointer
        mouseHeld: boolean,
        position: {
            x: number,
            y: number
        }
    },
    spectrum: {  // Hue scale
        mouseHeld: boolean,
        position: {
            x: number,
            y: number
        },
        hue: colorT,
    },
    color: {
        rgba: {
            r: number,
            g: number,
            b: number,
            a: number
        },
        hsb: {
            hue: number,
            saturation: number,
            brightness: number,
        }
    },
    showPalette: boolean
}

export default class ColorPalette extends React.Component<
    ColorPaletteProps,
    ColorPaletteState
> {
    private readonly palette: React.RefObject<any>
    private readonly spectrum: React.RefObject<any>
    private readonly alphaRange: React.RefObject<HTMLInputElement>
    constructor(props: ColorPaletteProps) {
        super(props)
        this.state = {
            pointer: {  // Color palette pointer
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
            color: {
                rgba: {
                    r: 255, g: 255, b: 255, a: 1
                },
                hsb: {
                    hue: 0,
                    saturation: 0,
                    brightness: 1,
                }
            },
            showPalette: true
        }
        this.palette = React.createRef()
        this.spectrum = React.createRef()
        this.alphaRange = React.createRef()
        this.changeColor = this.changeColor.bind(this)
        this.changeHue = this.changeHue.bind(this)
    }
    parseColor(color: colorT) {  // Takes color-like string and returns rgba color object
        const [hex, rgb, rgba] = [
            color.match(
                /#(?<r>[\da-f]{2})(?<g>[\da-f]{2})(?<b>[\da-f]{2})/
            ),
            color.match(
                /rgb\((?<r>[\d]+), (?<g>[\d]+), (?<b>[\d]+)\)/
            ),
            color.match(
                /rgba\((?<r>[\d]+), (?<g>[\d]+), (?<b>[\d]+), (?<a>[\d\\.]+)\)/
            )
        ]
        let output = {
            r: 255, g: 255, b: 255, a: 1
        }
        if (hex?.groups) {
            const hexSubs = {
                0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
                a: 10, b: 11, c: 12, d: 13, e: 14, f: 15
            }
            // output = {
            //     r: hexSubs[hex.groups.r[0]] * 16 + hexSubs[hex.groups.r[1]],
            //     g: hexSubs[hex.groups.g[0]] * 16 + hexSubs[hex.groups.g[1]],
            //     b: hexSubs[hex.groups.b[0]] * 16 + hexSubs[hex.groups.b[1]],
            //     a: 1
            // }
        } else if (rgb?.groups) {
            output = {
                r: parseInt(rgb.groups.r), g: parseInt(rgb.groups.g),
                b: parseInt(rgb.groups.b), a: 1
            }
        } else if (rgba?.groups) {
            output = {
                r: parseInt(rgba.groups.r), g: parseInt(rgba.groups.g),
                b: parseInt(rgba.groups.b), a: parseFloat(rgba.groups.a)
            }
        }
        return output
    }
    public setColor(): void {  // HSB to RGB conversion
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
        color.rgba = {
            r: Math.floor((r + m) * 255),
            g: Math.floor((g + m) * 255),
            b: Math.floor((b + m) * 255),
            a: color.rgba.a
        }
        this.setState(
            {color: color},
            () => {this.props.setColor(
                colorToString(color.rgba)
            )}
        )
    }
    public static getHue(overall: number, sector: number): colorT {
        if (overall >= 0 && overall <= 1 / 6) {
            return `rgba(255, ${255 * sector}, 0, 1)`
        } else if (overall >= 1 / 6 && overall <= 2 / 6) {
            return `rgba(${255 * (1 - sector)}, 255, 0, 1)`
        } else if (overall >= 2 / 6 && overall <= 3 / 6) {
            return `rgba(0, 255, ${255 * sector}, 1)`
        } else if (overall >= 3 / 6 && overall <= 4 / 6) {
            return `rgba(0, ${255 * (1 - sector)}, 255, 1)`
        } else if (overall >= 4 / 6 && overall <= 5 / 6) {
            return `rgba(${255 * sector}, 0, 255, 1)`
        } else {
            return `rgba(255, 0, ${255 * (1 - sector)}, 1)`
        }
    }
    public changeColor(event: React.MouseEvent): void {  // Main palette pointer move event
        let [pointer, color] = [this.state.pointer, this.state.color]
        if ((event.type === 'mousemove' && pointer.mouseHeld) || event.type === 'click') {
            pointer.position = {
                x: event.pageX - 7,
                y: event.pageY - 7
            }
            const palette = (event.target as SVGSVGElement).getBoundingClientRect()
            color.hsb = {
                hue: this.state.color.hsb.hue,
                saturation: (event.clientX - palette.left) / palette.width,
                brightness: 1 - (event.clientY - palette.top) / palette.height,
            }
            this.setState({pointer: pointer, color: color}, this.setColor)
        }
    }
    public changeHue(event: React.MouseEvent): void {  // Hue scale level move event
        let [spectrum, color] = [this.state.spectrum, this.state.color]
        if ((event.type === 'mousemove' && spectrum.mouseHeld) || event.type === 'click') {
            spectrum.position.y = event.pageY - 9.6
            const spectrumElement = (event.target as SVGSVGElement).getBoundingClientRect()
            const [overall, sector] = [
                (event.clientY - spectrumElement.top) / spectrumElement.height,
                (6 * (event.clientY - spectrumElement.top) / spectrumElement.height) % 1
            ]
            color.hsb.hue = 360 * overall  // Current hue angle
            // Changing main palette background hue
            spectrum.hue = ColorPalette.getHue(overall, sector)
            this.setState({spectrum: spectrum, color: color}, this.setColor)
        }
    }
    public componentDidMount(): void {  // Initial color configuration
        let [pointer, spectrum] = [
            this.state.pointer, this.state.spectrum
        ]
        // Props default color RGB to HSB
        let {r, g, b, a} = this.parseColor(this.props.default)
        const [rp, gp, bp] = [r / 255, g / 255, b / 255]
        const [cmax, cmin] = [Math.max(rp, gp, bp), Math.min(rp, gp, bp)]
        const delta = cmax - cmin
        let hue = 0
        if (delta === 0) {
            hue = 0
        } else if (cmax === rp) {
            hue = 60 * (((gp - bp) / delta) % 6)
        } else if (cmax === gp) {
            hue = 60 * ((bp - rp) / delta + 2)
        } else if (cmax === bp) {
            hue = 60 * ((rp - gp) / delta + 4)
        }
        const [saturation, brightness] = [cmax ? delta / cmax : 0, cmax]
        // Setting main palette hue
        const [overall, sector] = [hue / 360, (6 * hue / 360) % 1]
        spectrum.hue = ColorPalette.getHue(overall, sector)
        // Setting pointers position
        if (this.palette?.current && this.spectrum?.current && this.alphaRange.current) {
            const [palette, spectrum] = [
                this.palette.current.getBoundingClientRect(),
                this.spectrum.current.getBoundingClientRect()
            ]
            pointer.position = {
                x: palette.left + document.documentElement.scrollLeft - 7 +
                    palette.width * saturation,
                y: palette.top + document.documentElement.scrollTop - 7 +
                    palette.height * (1 - brightness)
            }
            spectrum.position = {
                x: spectrum.left + document.documentElement.scrollLeft,
                y: spectrum.top + document.documentElement.scrollTop - 9.6 +
                    spectrum.height / 360 * hue
            }
            // Applying changes
            this.alphaRange.current.value = String(a * 100)
            this.setState({
                pointer: pointer, spectrum: spectrum, color: {
                    rgba: {r, g, b, a},
                    hsb: {
                        hue: hue,
                        saturation: saturation,
                        brightness: brightness,
                    }
                }, showPalette: false
            })
        }
    }
    public render(): React.ReactElement {
        if (this.state.showPalette) {
            return (
                <div className={'color_mixer_component'}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={'0 0 100 100'}
                        preserveAspectRatio={'none'}
                        className={'color_palette'}
                        ref={this.palette}
                        onMouseMove={this.changeColor}
                        onClick={this.changeColor}
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
                        top: this.state.pointer.position.y
                    }}></div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={'0 0 100 100'}
                        preserveAspectRatio={'none'}
                        className={'color_spectrum'}
                        ref={this.spectrum}
                        onMouseMove={this.changeHue}
                        onClick={this.changeHue}
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
                        <rect
                            x={0} y={0} width={100} height={100}
                            fill={'url(#color_spectrum)'}
                        ></rect>
                    </svg>
                    <div className={'spectrum_pointer'} style={{
                        left: this.state.spectrum.position.x,
                        top: this.state.spectrum.position.y,
                    }}>
                        <div className={'left'}>
                            <img src={'./left_trig.png'} alt={'▸'} height={'10px'} />
                        </div>
                        <div className={'right'}>
                            <img src={'./right_trig.png'} alt={'◂'} height={'10px'} />
                        </div>
                    </div>
                    <input type={'range'} ref={this.alphaRange} onChange={(event: React.ChangeEvent) => {
                        let color = this.state.color
                        color.rgba.a = (event.target as HTMLInputElement).valueAsNumber / 100
                        this.setState({color: color}, this.setColor)
                    }} defaultValue={this.state.color.rgba.a * 100} className={'alpha_range'} />
                    <div className={'result_color'} onClick={() => {
                        this.setState({showPalette: false})
                    }}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox={'0 0 100 100'}
                            preserveAspectRatio={'none'}
                        >
                            <rect
                                x={0} y={0} width={100} height={100}
                                fill={colorToString(this.state.color.rgba)}
                            ></rect>
                        </svg>
                    </div>
                </div>
            )
        } else {
            return (
                <div className={'color_miniature'} onClick={() => {
                    this.setState({showPalette: true})
                }} style={{width: 20, height: 20, border: 'solid black 1px'}}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={'0 0 100 100'}
                        preserveAspectRatio={'none'}
                    >
                        <rect
                            x={0} y={0} width={100} height={100}
                            fill={colorToString(this.state.color.rgba)}
                        ></rect>
                    </svg>
                </div>
            )
        }
    }
}
