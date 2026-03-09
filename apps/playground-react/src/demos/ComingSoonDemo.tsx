import { Card, Empty } from 'antd';

interface ComingSoonDemoProps {
    title: string;
    description: string;
}

export default function ComingSoonDemo(props: ComingSoonDemoProps) {
    const { title, description } = props;

    return (
        <Card title={title}>
            <Empty description={description} />
        </Card>
    );
}
