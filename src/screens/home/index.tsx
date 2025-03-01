import React, {useEffect, useRef, useState} from 'react';

import {ColorSwatch, Group, CheckIcon, rem} from '@mantine/core';
import Draggable from 'react-draggable';
import axios from 'axios';

import {Button} from '@/components/ui/button';
import SWATCHES from '@/config/color-swatch';
import GeneratedResult from '@/models/GeneratedResult';
import Response from "@/models/Response.ts";

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({x: 10, y: 200});
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.style.background = 'black';
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }

        }
        window.MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
        });
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            setIsLoading(true);
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars
                }
            });

            const resp = await response.data;
            resp.data.forEach((data: Response) => {
                if (data.assign) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result
                    });
                }
            });
            const ctx = canvas.getContext('2d');
            const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
            let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    if (imageData.data[i + 3] > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            setLatexPosition({x: centerX, y: centerY});
            resp.data.forEach((data: Response) => {
                setResult({
                    expression: data.expr,
                    answer: data.result
                });
                setIsLoading(false);
            });
        }
    };

    return (
        <>
            <div className='grid grid-cols-3 gap-2'>
                <Button
                    onClick={() => setReset(true)}
                    className='z-20 bg-black text-white'
                    variant='default'
                    color='black'
                >
                    Reset
                </Button>
                <Group className='z-20'>
                    {SWATCHES.map((swatch) => (
                        <ColorSwatch key={swatch} color={swatch} onClick={() => setColor(swatch)}>
                            {swatch === color && (
                                <CheckIcon style={{width: rem(12), height: rem(12)}}/>
                            )}
                        </ColorSwatch>
                    ))}
                </Group>
                <Button
                    onClick={runRoute}
                    className='z-20 bg-black text-white'
                    variant='default'
                    color='white'
                >
                    {isLoading ? 'Loading' : 'Run'}
                </Button>
            </div>
            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_, data) => setLatexPosition({x: data.x, y: data.y})}
                >
                    <div className="absolute p-2 text-white rounded shadow-md">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
        </>
    );
}
