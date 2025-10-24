"use client"
import { Button, Drawer, Flex, Menu, Row } from 'antd';
import { BarsOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useModal } from '@/app/hooks/useModal';
import { FC } from 'react';
import Title from 'antd/es/typography/Title';

interface FooterProps {
    className?: string;
}

export const Footer: FC<FooterProps> = () => {

    return (
        <Flex
            justify="center"
            align="center"
            style={{
                width: '100%',
                padding: '24px 0',
                flexDirection: 'column',
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
            }}
        >
           
                <Title level={5} style={{ color: 'var(--foreground)', margin: 0 }}>
                    Telegram Stars Exchange
                </Title>

                
            

            <p style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '16px', marginBottom: 0 }}>
                © 2025 Telegram Stars Exchange. Все права защищены.
            </p>

            
        </Flex>
    );
};