import { Navigate, createBrowserRouter } from 'react-router-dom';
import BasicLayout from '../layout';
import ProFormPage from '../pages/pro-form';
import ProTablePage from '../pages/pro-table';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <BasicLayout />,
        children: [
            { index: true, element: <Navigate to="/pro-table" replace /> },
            { path: 'pro-table', element: <ProTablePage /> },
            { path: 'pro-form', element: <ProFormPage /> },
        ],
    },
]);
