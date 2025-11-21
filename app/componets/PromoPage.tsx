"use client";
import { Col, Row, Flex, Button, Typography, Grid } from 'antd';
import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface PromoPageIO {
    className?: string;
}

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

export const PromoPage: FC<PromoPageIO> = ({ className }) => {
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const handleAuthSubmit = (values: { success: boolean; telegram_id: string; username: string; password: string }) => {
        console.log('Auth result:', values);
        if (!values.success) {
            return;
        }

        if (isLogin) {
            router.push('/dashboard');
        } else {
            setIsLogin(true);
        }
    };

    return (
        <Flex
            className={className}
            vertical
            justify="center"
            align="center"
            style={{
                minHeight: '100vh',
                padding: isMobile ? '24px 12px' : '40px 16px',
                background: 'radial-gradient(circle at top left, #111827, #020617)',
                color: 'var(--foreground)',
            }}
        >
            <Row gutter={[48, 32]} style={{ width: '100%', maxWidth: 1100 }}>
                <Col xs={24} md={12}>
                    <div style={{ maxWidth: 520, textAlign: isMobile ? 'center' : 'left' }}>
                        <Title
                            level={isMobile ? 2 : 1}
                            style={{ color: 'var(--foreground)', marginBottom: isMobile ? 12 : 16 }}
                        >
                            P2P платформа для безопасного обмена
                        </Title>
                        <Paragraph
                            style={{
                                fontSize: isMobile ? 14 : 16,
                                color: 'rgba(249,250,251,0.75)',
                                marginBottom: isMobile ? 16 : 24,
                            }}
                        >
                            Современный сервис для моментального P2P-обмена. Минимальные комиссии, прозрачные условия и
                            защита каждой сделки.
                        </Paragraph>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: '0 0 24px 0',
                                color: 'rgba(209,213,219,0.9)',
                                textAlign: isMobile ? 'left' : 'left',
                            }}
                        >
                            <li style={{ marginBottom: 8 }}>• Мгновенные переводы между пользователями</li>
                            <li style={{ marginBottom: 8 }}>• Смарт-контракты и защита от мошенничества</li>
                            <li style={{ marginBottom: 8 }}>• Удобная аналитика и история операций</li>
                        </ul>
                        <Flex
                            gap={12}
                            wrap="wrap"
                            align="center"
                            justify={isMobile ? 'center' : 'flex-start'}
                            style={{ marginTop: isMobile ? 8 : 0 }}
                        >
                            <Button
                                type={isLogin ? 'default' : 'primary'}
                                size="large"
                                onClick={() => setIsLogin(false)}
                            >
                                Зарегистрироваться
                            </Button>
                            <Button
                                type={isLogin ? 'primary' : 'default'}
                                ghost
                                size="large"
                                onClick={() => setIsLogin(true)}
                            >
                                Войти
                            </Button>
                            <Text type="secondary" style={{ marginLeft: 8, color: '#ffffff' }}>
                                Безопасно, быстро и удобно
                            </Text>
                        </Flex>
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div
                        style={{
                            padding: isMobile ? 20 : 24,
                            borderRadius: 16,
                            background: 'rgba(15,23,42,0.9)',
                            border: '1px solid rgba(148,163,184,0.35)',
                            boxShadow: '0 24px 60px rgba(15,23,42,0.85)',
                            backdropFilter: 'blur(18px)',
                            WebkitBackdropFilter: 'blur(18px)',
                            marginTop: isMobile ? 16 : 0,
                        }}
                    >
                        <Title
                            level={isMobile ? 4 : 3}
                            style={{ color: 'var(--foreground)', marginBottom: isMobile ? 6 : 8 }}
                        >
                            {isLogin ? 'Вход в аккаунт' : 'Создать аккаунт'}
                        </Title>
                        <Text
                            type="secondary"
                            style={{
                                display: 'block',
                                marginBottom: isMobile ? 16 : 24,
                                color: '#ffffff',
                                fontSize: isMobile ? 13 : 14,
                            }}
                        >
                            {isLogin
                                ? 'Введите данные для авторизации и начните пользоваться платформой.'
                                : 'Зарегистрируйтесь за пару секунд и получите доступ ко всем возможностям.'}
                        </Text>
                        {isLogin ? (
                            <LoginForm onSubmit={handleAuthSubmit} />
                        ) : (
                            <RegisterForm onSubmit={handleAuthSubmit} />
                        )}
                    </div>
                </Col>
            </Row>
        </Flex>
    );
};