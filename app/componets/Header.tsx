"use client"
import { App, Button, Divider, Drawer, Flex, Menu, Row, Space, Tabs, Grid } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import {useModal} from '@/app/hooks/useModal';
import { FC, ReactNode, useEffect, useState } from 'react';
import Title from 'antd/es/typography/Title';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import Cookies from 'js-cookie';
import Text from 'antd/es/typography/Text';
import { CreateDealForm } from './DealCreate';
import { MyDeal } from './MyDeal';
import { useRouter, usePathname } from 'next/navigation';
import { BalanceApi } from '@/app/shared/balanceApi';

const { useBreakpoint } = Grid;

interface HeaderProps{
    className?: string;
}


export const Header: FC<HeaderProps> = (props: HeaderProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const drawler = useModal();
    const register = useModal();
    const login = useModal();
    const dealCreate = useModal();
    const [dealFormVersion, setDealFormVersion] = useState(0);
    const [username, setUsername] = useState<string>();
    const [telegram_id, setTelegramId] = useState<string>('');
    const [balance, setBalance] = useState<{ rub: number; stars: number } | null>(null);
    const [isSignedIn, sign] = useState<boolean>(false);
    const { message } = App.useApp();
    const myDealsDrawler = useModal();
    const openLogin = () => {
    drawler.close();
    login.open();
  };

  const openRegister = () => {
    drawler.close();
    register.open();
  };
  const openDealCreate = () => {
    setDealFormVersion((v) => v + 1);
    dealCreate.open();
  };
  const logut = () => {
    Cookies.remove('username');
    Cookies.remove('telegram_id');
    setBalance(null);
    sign(false);
  }
  const loadBalance = async (tg: string) => {
    if (!tg) {
      setBalance(null);
      return;
    }

    try {
      const data = await BalanceApi.getBalance(tg);
      if (data && data.success && data.balance) {
        setBalance({
          rub: data.balance.rub ?? 0,
          stars: data.balance.stars ?? 0,
        });
      }
    } catch (e) {
      console.error('GetBalance error:', e);
    }
  };
  const syncUserFromCookies = () => {
    const utemp = Cookies.get('username');
    const tgTemp = Cookies.get('telegram_id');
    if (utemp && tgTemp) {
        setUsername(utemp || '');
        setTelegramId(tgTemp || '');
        sign(true);
        loadBalance(tgTemp || '');
    }
    else {
        sign(false);
        setBalance(null);
    }
  };

  useEffect(() => {
    syncUserFromCookies();
  }, [])

  const tabPathMap: Record<string, string> = {
    dashboard: '/dashboard',
    stats: '/stats',
    userStats: '/user-stats',
    meStats: '/me-stats',
    leaders: '/leaders',
    dealsFeed: '/deals-feed',
    system: '/system',
  };

  const getCurrentTabKey = () => {
    const path = (pathname || '').split('?')[0];
    if (path.startsWith('/stats') && path !== '/user-stats') return 'stats';
    if (path.startsWith('/user-stats')) return 'userStats';
    if (path.startsWith('/me-stats')) return 'meStats';
    if (path.startsWith('/leaders')) return 'leaders';
    if (path.startsWith('/deals-feed')) return 'dealsFeed';
    if (path.startsWith('/system')) return 'system';
    if (path.startsWith('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const currentTabKey = getCurrentTabKey();
  const isAdmin = telegram_id === '@admin';

  const getTabLabel = (key: string, text: string): ReactNode => (
    <span style={{ color: currentTabKey === key ? '#3b82f6' : '#ffffff' }}>{text}</span>
  );

  const tabItems: { key: string; label: ReactNode }[] = [
    { key: 'dashboard', label: getTabLabel('dashboard', 'Биржа') },
    { key: 'stats', label: getTabLabel('stats', 'По дням') },
    { key: 'userStats', label: getTabLabel('userStats', 'Пользователи') },
    { key: 'meStats', label: getTabLabel('meStats', 'Моя статистика') },
    { key: 'leaders', label: getTabLabel('leaders', 'Рейтинг') },
    { key: 'dealsFeed', label: getTabLabel('dealsFeed', 'Сделки') },
  ];

  if (isAdmin) {
    tabItems.push({ key: 'system', label: getTabLabel('system', 'Система') });
  }

    return(
        <Flex style={{ width: '100%' }}>
            <Row style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                width: '100%',
                padding: isMobile ? '8px 12px' : '10px 16px',
                alignItems: isMobile ? 'flex-start' : 'center',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                flexWrap: 'wrap',
                rowGap: isMobile ? 4 : 0,
            }}>
                <Button onClick={drawler.open} style={{ background: 'transparent', border: 'none', alignSelf: 'center'}}>
                    <UserOutlined style={{ fontSize: isMobile ? '24px' : '28px', color:'var(--foreground)' }}/>
                </Button>
                <Title
                    level={isMobile ? 4 : 3}
                    style={{
                        color: 'var(--foreground)',
                        padding: 0,
                        margin: 0,
                        marginLeft: isMobile ? '4px' : '8px',
                    }}
                >
                    Stars Exchange
                </Title>
                {!isMobile && (
                    <Flex
                        style={{
                            marginLeft: 'auto',
                            marginTop: 0,
                            width: 'auto',
                            overflowX: 'hidden',
                            overflowY: 'hidden',
                        }}
                        align="center"
                        justify="flex-end"
                    >
                        <Tabs
                            activeKey={currentTabKey}
                            onChange={(key) => {
                                const path = tabPathMap[key] || '/dashboard';
                                router.push(path);
                            }}
                            items={tabItems}
                            size="small"
                            tabBarGutter={16}
                            style={{
                                width: 'auto',
                                minWidth: 'max-content',
                            }}
                        />
                    </Flex>
                )}
                <Drawer
                title="Аккаунт"
                placement='left'
                onClose={drawler.close}
                open={drawler.isOpen}
                style={{color:'white',  backgroundColor: '#111422', overflowY: isMobile ? 'auto' : 'visible'}}
                width={280}
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}
                >
                    {isSignedIn ? (
                    <Flex vertical gap={16}>
                        <div
                            style={{
                                padding: 16,
                                borderRadius: 12,
                                background: 'rgba(15,23,42,0.95)',
                                border: '1px solid rgba(148,163,184,0.4)',
                            }}
                        >
                            <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Профиль
                            </Text>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 600, display: 'block', marginTop: 8 }}>
                                {username}
                            </Text>
                            <Text style={{ color: 'rgba(148,163,184,0.9)', marginTop: 12, marginLeft: 8 }}>
                                Telegram Id
                            </Text>
                            <Text style={{ color: 'white' }}>{telegram_id}</Text>
                            {balance && (
                                <>
                                    <Divider style={{ borderColor: 'rgba(148,163,184,0.35)', margin: '12px 0' }} />
                                    <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        Баланс
                                    </Text>
                                    <Flex justify="space-between" style={{ marginTop: 8 }}>
                                        <div>
                                            <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 11 }}>Рубли</Text>
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 18,
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {balance.rub} ₽
                                            </Text>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 11 }}>Звёзды</Text>
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 18,
                                                    fontWeight: 600,
                                                    display: 'block',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {balance.stars} ⭐
                                            </Text>
                                        </div>
                                    </Flex>
                                    <Flex vertical gap={8} style={{ marginTop: 12 }}>
                                        <Button
                                            type="primary"
                                            block
                                            onClick={() => {
                                                const rawTg = telegram_id || '';
                                                const safeTg = rawTg.startsWith('@') ? rawTg.slice(1) : rawTg;
                                                const payload = safeTg ? `topup_${safeTg}` : '';
                                                const url = payload
                                                    ? `https://t.me/buyer_stars_kur_bot?start=${payload}`
                                                    : 'https://t.me/buyer_stars_kur_bot';
                                                window.open(url, '_blank');
                                            }}
                                            style={{
                                                borderRadius: 999,
                                                border: 'none',
                                                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                                boxShadow: '0 12px 30px rgba(22,163,74,0.45)',
                                            }}
                                        >
                                            Пополнить
                                        </Button>
                                    </Flex>
                                </>
                            )}
                        </div>
                        <Button
                            type="primary"
                            block
                            onClick={openDealCreate}
                            style={{
                                border: 'none',
                                borderRadius: 999,
                                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                boxShadow: '0 12px 30px rgba(22,163,74,0.45)',
                            }}
                        >
                            Заключить сделку 
                        </Button>
                        <Button
                            block
                            onClick={myDealsDrawler.open}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Мои сделки
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/dashboard');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Главная
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/stats');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Статистика
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/user-stats');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Статистика по пользователям
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/me-stats');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Моя статистика
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/leaders');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Рейтинг
                        </Button>
                        <Button
                            block
                            onClick={() => {
                                drawler.close();
                                router.push('/deals-feed');
                            }}
                            style={{
                                borderRadius: 999,
                                borderColor: 'rgba(148,163,184,0.6)',
                                background: 'transparent',
                                color: 'white',
                            }}
                        >
                            Сделки
                        </Button>
                        {isAdmin && (
                            <Button
                                block
                                onClick={() => {
                                    drawler.close();
                                    router.push('/system');
                                }}
                                style={{
                                    borderRadius: 999,
                                    borderColor: 'rgba(148,163,184,0.6)',
                                    background: 'transparent',
                                    color: 'white',
                                }}
                            >
                                Системный обзор
                            </Button>
                        )}
                        <Button
                            danger
                            block
                            onClick={logut}
                            style={{
                                borderRadius: 999,
                                border: 'none',
                                backgroundColor: '#ef4444',
                                color: 'white',
                            }}
                        >
                            Выйти
                        </Button>
                    </Flex>
                    ) : 
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
                style={{color:'white',  backgroundColor: '#111422', overflowY: isMobile ? 'auto' : 'visible'}}
                open={dealCreate.isOpen} onClose={dealCreate.close} footer={null} title="Сделка"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <CreateDealForm key={dealFormVersion} onSubmit={function (values: { uid: string; tgId: string; stars: number; price: number; success: boolean }): void {
                        if(values.success){
                            dealCreate.close();
                        }
                    } } />
                </Drawer>
                

                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422', overflowY: isMobile ? 'auto' : 'visible'}}
                open={login.isOpen} onClose={login.close} footer={null} title="Вход"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <LoginForm onSubmit={(result: { success: boolean; username?: string; telegram_id?: string }) => {
                        if(result.success){
                            login.close();
                            syncUserFromCookies();
                        }
                        else{
                            message.error("Неверные данные")
                        }
                        
                    }} />
                </Drawer>

                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422', overflowY: isMobile ? 'auto' : 'visible'}}
                open={register.isOpen} onClose={register.close} footer={null} title="Регистрация"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <RegisterForm onSubmit={(result: { success: boolean; username?: string; telegram_id?: string }) => {
                        console.log(result.success)
                        if(result.success){
                            register.close()
                            syncUserFromCookies();
                        }
                    }} />
                </Drawer>
                <Drawer
                placement='left'
                style={{color:'white',  backgroundColor: '#111422', overflowY: isMobile ? 'auto' : 'visible'}}
                open={myDealsDrawler.isOpen} onClose={myDealsDrawler.close} footer={null} title="Moи сделки"
                closeIcon={<ArrowLeftOutlined style={{ fontSize: '20px', color:'white' }} />}>
                    <MyDeal telegram_id={telegram_id} isInMyDeals={true} />
                </Drawer>
                
                
            </Row>
        </Flex>
    )
}

