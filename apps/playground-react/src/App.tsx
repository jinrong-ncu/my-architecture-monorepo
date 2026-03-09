import { useMemo, useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import FormDemo from './demos/FormDemo';
import TableDemo from './demos/TableDemo';
import ComingSoonDemo from './demos/ComingSoonDemo';
import './App.css';

type DemoKey = 'table' | 'form' | 'modal' | 'upload' | 'pro-table-form';

const demos: Array<{ key: DemoKey; label: string }> = [
    { key: 'table', label: 'ProTable 演示' },
    { key: 'form', label: 'ProForm 演示' },
    { key: 'modal', label: 'ProModal 演示' },
    { key: 'upload', label: 'ProUpload 演示' },
    { key: 'pro-table-form', label: 'ProTableForm 演示' },
];

const menuItems: MenuProps['items'] = demos.map((item) => ({ key: item.key, label: item.label }));

export default function App() {
    const [activeDemo, setActiveDemo] = useState<DemoKey>('table');

    const currentTitle = useMemo(() => {
        return demos.find((item) => item.key === activeDemo)?.label || 'React Playground';
    }, [activeDemo]);

    const renderContent = () => {
        switch (activeDemo) {
            case 'table':
                return <TableDemo />;
            case 'form':
                return <FormDemo />;
            case 'modal':
                return <ComingSoonDemo title="ProModal 演示" description="React 版本 ProModal 即将接入" />;
            case 'upload':
                return <ComingSoonDemo title="ProUpload 演示" description="React 版本 ProUpload 即将接入" />;
            case 'pro-table-form':
                return <ComingSoonDemo title="ProTableForm 演示" description="React 版本 ProTableForm 即将接入" />;
            default:
                return <TableDemo />;
        }
    };

    return (
        <Layout className="playground-react-layout">
            <Layout.Sider width={240} className="playground-react-sider">
                <div className="playground-react-logo">React Playground</div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeDemo]}
                    items={menuItems}
                    onClick={(info) => setActiveDemo(info.key as DemoKey)}
                    className="playground-react-menu"
                />
            </Layout.Sider>
            <Layout className="playground-react-main">
                <Layout.Header className="playground-react-header">
                    <Typography.Title level={4} className="playground-react-title">
                        {currentTitle}
                    </Typography.Title>
                </Layout.Header>
                <Layout.Content className="playground-react-content">
                    {renderContent()}
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
