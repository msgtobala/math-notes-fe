import React, { useEffect, useRef, useState } from 'react';

import { ColorSwatch, Group } from '@mantine/core';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import COLOR_SWATCH from '@/config/color-swath';
import GeneratedResult from '@/models/GeneratedResult';

const Home: React.FC = (): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState('rgb(255, 255, 255)');
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [dictOfVars, setDictOfVars] = useState({});

  useEffect(() => {
    const element = canvasRef.current;

    if (element) {
      const ctx = element.getContext('2d');
      element.style.background = 'black';
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        element.width = window.innerWidth;
        element.height = window.innerHeight - element.offsetTop;
      }
    }
  }, []);

  const sendData = async () => {
    const element = canvasRef.current;

    if (element) {
      const response = await axios({
        method: 'POST',
        url: `${import.meta.env.VITE_APP_URL}/calculate`,
        data: {
          image: element.toDataURL('image/png'),
          dict_of_vars: dictOfVars,
        },
      });
      console.log(response);
    }
  };

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
    }
  }, [reset]);

  const resetCanvas = () => {
    const element = canvasRef.current;

    if (element) {
      const ctx = element.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, element.width, element.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const element = canvasRef.current;

    if (element) {
      const ctx = element.getContext('2d');
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
    const element = canvasRef.current;

    if (element) {
      const ctx = element.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = selectedColor;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <main>
      <div className="grid grid-cols-3 gap-2">
        <Button
          className="z-20 bg-black text-white"
          variant="default"
          color="black"
          onClick={() => setReset(true)}
        >
          Reset
        </Button>
        <Group className="z-20">
          {COLOR_SWATCH.map((swatchColor) => (
            <ColorSwatch
              key={swatchColor}
              color={swatchColor}
              onClick={() => setSelectedColor(swatchColor)}
            />
          ))}
        </Group>
        <Button
          className="z-20 bg-white text-black"
          variant="default"
          color="black"
          onClick={sendData}
        >
          Calculate
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute left-0 top-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
      />
    </main>
  );
};

export default Home;
