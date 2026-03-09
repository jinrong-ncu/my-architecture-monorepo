import { Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const menuItems: MenuProps['items'] = [
    { key: '/pro-table', label: '高级表格测试' },
    { key: '/pro-form', label: '高级表单测试' },
];

const routeTitleMap: Record<string, string> = {
    '/pro-table': '高级表格测试',
    '/pro-form': '高级表单测试',
};

export default function BasicLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const selectedKey = menuItems?.some((item) => item?.key === location.pathname)
        ? location.pathname
        : '/pro-table';

    return (
        <Layout className="playground-react-layout">
            <Layout.Sider width={240} className="playground-react-sider">
                <div className="playground-react-logo">React Playground</div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    className="playground-react-menu"
                    onClick={(info) => navigate(info.key)}
                />
            </Layout.Sider>
            <Layout className="playground-react-main">
                <Layout.Header className="playground-react-header">
                    <Typography.Title level={4} className="playground-react-title">
                        {routeTitleMap[selectedKey] || '组件演示'}
                    </Typography.Title>
                    <Space className="playground-react-user">Hi, Admin</Space>
                </Layout.Header>
                <Layout.Content className="playground-react-content">
                    <Outlet />
                </Layout.Content>
            </Layout>
        </Layout>
    );
}
