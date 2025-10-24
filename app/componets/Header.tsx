"use client"
import { Button, Divider, Drawer, Flex, Menu, message, Row, Space } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import {useModal} from '@/app/hooks/useModal';
import { FC, useEffect, useState } from 'react';
import Title from 'antd/es/typography/Title';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import Cookies from 'js-cookie';
import Text from 'antd/es/typography/Text';
import { CreateDealForm } from './DealCreate';
import { MyDeal } from './MyDeal';



interface HeaderProps{
    className?: string;
}


export const Header: FC<HeaderProps> = (props: HeaderProps) => {
    const drawler = useModal();
    const register = useModal();
    const login = useModal();
    const dealCreate = useModal();
    const [username, setUsername] = useState<string>();
    const [telegram_id, setTelegramId] = useState<string>('');
    const [isSignedIn, sign] = useState<boolean>(false);
    const myDealsDrawler = useModal();
    const openLogin = () => {
    drawler.close();
    login.open();
  };

  const openRegister = () => {
    drawler.close();
    register.open();
  };
  const logut = () => {
    Cookies.remove('username');
    Cookies.remove('telegram_id');
    sign(false);
  }
  useEffect(() => {
    const utemp = Cookies.get('username')
    const tgTemp = Cookies.get('telegram_id')
    if(utemp && tgTemp ){
        setUsername(utemp || '');
        setTelegramId(tgTemp || '');
        sign(true)
    }
    else{
        sign(false)
    }
  }, [])
    
    
    return(
        <Flex style={{ width: '100%' }}>
            <Row style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                padding: '10px 16px',
                alignItems: 'center',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}>
                <Button onClick={drawler.open} style={{ background: 'transparent', border: 'none', alignSelf: 'center'}}>
                    <UserOutlined style={{ fontSize: '28px', color:'var(--foreground)' }}/>
                </Button>
                <Title level={3} style={{color: 'var(--foreground)', padding: 0, margin: 0, marginLeft: '8px'}}>Stars Exchange</Title>
                <Drawer
                title="Аккаунт"
                placement='left'
                onClose={drawler.close}
                open={drawler.isOpen}
                style={{color:'white',  backgroundColor: '#111422'}}
                width={280}
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}
                >
                    {isSignedIn ?
                    <Flex vertical>
                        <Text style={{color: 'white'}}>Полльзователь: {username}</Text>
                        <Divider />
                        <Text style={{color: 'white'}}>Телеграм Id: {telegram_id}</Text>
                        <Divider />
                        <Button onClick={dealCreate.open} style={{ border: 'none'}}>Заключить сделку</Button>
                        <Divider />
                        <Button onClick={myDealsDrawler.open} style={{ border: 'none'}}>Мои сделки</Button>
                        <Divider />
                        <Button onClick={logut} style={{backgroundColor: 'red', border: 'none', color: 'white'}}>Выйти</Button>
                    </Flex>
                    : 
                    <Menu 
                    mode="vertical"
                    style={{ border: 'none',borderRadius: '10px', padding: '5px', color: 'white',  backgroundColor: 'transparent'}}
                    selectedKeys={[]}   
                >
                    <Menu.Item onClick={openLogin} style={{ color: 'white' }} >
                        Войти
                    </Menu.Item>
                    <Menu.Item onClick={openRegister} style={{ color: 'white' }}>
                        Зарегистрироваться
                    </Menu.Item>
                </Menu>}

                </Drawer>
                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422'}}
                open={dealCreate.isOpen} onClose={dealCreate.close} footer={null} title="Сделка"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <CreateDealForm onSubmit={function (values: { stars: number; price: number; success: boolean }): void {
                        if(values.success){
                            dealCreate.close();
                        }
                    } } />
                </Drawer>
                

                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422'}}
                open={login.isOpen} onClose={login.close} footer={null} title="Вход"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <LoginForm onSubmit={(result: { success: boolean; username?: string; telegram_id?: string }) => {
                        if(result.success){
                            login.close();
                            sign(true);
                        }
                        else{
                            message.error("Неверные данные")
                        }
                        
                    }} />
                </Drawer>

                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422'}}
                open={register.isOpen} onClose={register.close} footer={null} title="Регистрация"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <RegisterForm onSubmit={(result: { success: boolean; username?: string; telegram_id?: string }) => {
                        console.log(result.success)
                        if(result.success){
                            register.close()
                            login.open()
                        }
                    }} />
                </Drawer>
                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422'}}
                open={myDealsDrawler.isOpen} onClose={myDealsDrawler.close} footer={null} title="Moи сделки"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <MyDeal telegram_id={telegram_id} isInMyDeals={true} />
                </Drawer>
                
                
            </Row>
        </Flex>
    )
}

