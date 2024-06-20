'use client';

import {
    useEffect,
    useRef
} from 'react';
import {
    randomColor
} from 'utils/functions';

export default function CircleDiagram(
    {
        data,
        width,
        height
    }: {
        data: [string, number][];
        width: number;
        height: number;
    }
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const x0 = 0.5 * width,
                y0 = 0.5 * height;
            const r = Math.min(x0, y0);
            const sum = data.reduce((sum, point) =>
                sum + point[1], 0.0
            );

            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            const fontFamily = window.getComputedStyle(
                document.body
            ).fontFamily;
            let angle = 0;
            const len = ~~!!(data.length - 1);
            for (const [name, value] of data) {
                const wedge = value / sum;
                // Wedge
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.arc(x0, y0, r, angle, angle += wedge * 2 * Math.PI);
                ctx.closePath();
                ctx.fillStyle = randomColor();
                ctx.fill();
                // Text
                ctx.fillStyle = 'white';
                const size = Math.round(0.4 * r * wedge);
                ctx.font = `bold ${size}px ${fontFamily}`;
                const half = angle - wedge * Math.PI;
                //// Name
                let x = x0 + len * 0.5 * r * Math.cos(half),
                    y = y0 + len * 0.5 * r * Math.sin(half);
                ctx.strokeText(name, x, y);
                ctx.fillText(name, x, y);
                //// Value
                const text = `${(wedge * 100).toFixed(2)}%`;
                ctx.strokeText(text, x, y + size);
                ctx.fillText(text, x, y + size);
            }
        }
    }, [
        width, height,
        JSON.stringify(data)
    ]);

    return <canvas
        width={width}
        height={height}
        style={{
            width,
            height
        }}
        ref={canvasRef}
    ></canvas>;
}