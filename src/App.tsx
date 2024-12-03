import React from 'react';

import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Home from '@/screens/home';
import '@/index.css';

const paths = [
  {
    path: '/',
    element: <Home />,
  },
];

const BrowserRouter = createBrowserRouter(paths);

const App: React.FC = () => {
  return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter} />
    </MantineProvider>
  );
};

export default App;
