"use client"
import { FC, useEffect, useState } from 'react';
import { App, Flex, Tag, Button, Typography, Modal, Divider, Input, Row, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

import { Deal } from '@/app/interfaces/interfaces';
import { CurrencySign, TelegramStar } from '@/app/interfaces/interfaces';
import { DEAL_STATUS_COLORS, DEAL_STATUS_TEXT } from '@/app/shared/dealsDomain';
import { DealsApi, DealIdPayload } from '@/app/shared/dealsApi';

import Text from 'antd/es/typography/Text'; 
import { useModal } from '../hooks/useModal';

interface MyDealIO{
    className?:string;
    telegram_id:string;
    isInMyDeals: boolean;
}

interface Users{
    telegram_id:string;
}

interface ForDealIO{
  dealId:string;
}

interface Datas{
    myDeals: Deal[];
}

interface DealId{
    dealId:string;
}

interface NeededDeal{
    neededDeal:Deal;
}

export const MyDeal: FC<MyDealIO> = ({telegram_id, isInMyDeals}) =>{
    const { message } = App.useApp();
    const [myDeals, setMydeals] = useState<Deal[]>([]);
    const [dealsDetails, setDetails] = useState<Deal>();
    const [qrCodeByer, setQrCodeByer] = useState(''); 
    const [qrCodeSeller, setQrCodeSeller] = useState(''); 
    const qrPopUp = useModal();
    const [dealIdLock, setDealID] = useState<ForDealIO>(
      {dealId: ''}
    );
    const popUp = useModal();
    useEffect(() => {
  const us: Users = { telegram_id: telegram_id };

  const getData = async () => {
    try {
      const data = await DealsApi.getMyDeals(us.telegram_id);
      if (!data) {
        message.error('Ошибка при загрузке сделок пользователя');
        return;
      }
      setMydeals(data.myDeals || []);
    } catch (error) {
      console.error('Ошибка при получении сделок:', error);
      message.error('Ошибка при получении данных');
    }
  };

  getData();
  const intervalId = setInterval(getData, 5000);

  return () => clearInterval(intervalId);
}, [telegram_id]);


const generateQRCodeByer = async () => {
  try {
    const payload: DealIdPayload = { dealId: dealIdLock.dealId };
    const blob = await DealsApi.generateBuyerQr(payload);
    if (!blob) {
      throw new Error('Ошибка при генерации QR-кода покупателя');
    }
    const url = URL.createObjectURL(blob);
    setQrCodeSeller(url);
  } catch (error) {
    console.error('Ошибка при генерации QR-кода покупателя:', error);
  }
};


const generateQRCodeSeller = async () => {
  try {
    const payload: DealIdPayload = { dealId: dealIdLock.dealId };
    const blob = await DealsApi.generateSellerQr(payload);
    if (!blob) {
      throw new Error('Ошибка при генерации QR-кода продавца');
    }
    const url = URL.createObjectURL(blob);
    setQrCodeByer(url);
  } catch (error) {
    console.error('Ошибка при генерации QR-кода продавца:', error);
  }
};


const getDealById = async (dealIdinficator: string) => {
  try {
    const dealIdPayload: DealIdPayload = { dealId: dealIdinficator };
    setDealID({ dealId: dealIdinficator });

    const data = await DealsApi.getDealById(dealIdPayload);
    if (!data) {
      console.error('Не удалось получить данные сделки');
      return;
    }
    setDetails(data.neededDeal);
  } catch (error) {
    console.error('Ошибка при получении сделки по ID:', error);
  }
};

    const sells = myDeals.filter((d) => d.telegram_id === telegram_id);
    const buys = myDeals.filter((d) => d.buyer === telegram_id);

    const isBuyer = !!(dealsDetails && telegram_id === dealsDetails.buyer);
    const isSeller = !!(dealsDetails && telegram_id === dealsDetails.telegram_id);

    return(
        <Flex vertical gap={16}>
            <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Мои продажи</Text>
            {sells.length === 0 ? (
                <Text style={{ color: 'rgba(75,85,99,0.9)' }}>Нет сделок, где вы продавец.</Text>
            ) : (
                sells.map((deal) => (
                    <div
                        key={`${deal.uid}-sell`}
                        style={{
                            padding: 12,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.95)',
                            border: '1px solid rgba(148,163,184,0.35)',
                        }}
                    >
                        <Flex justify="space-between" align="center">
                            <div>
                                <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>UID сделки</Text>
                                <Text
                                    style={{ color: 'white', cursor: 'pointer', display: 'block' }}
                                    onClick={() => {
                                        getDealById(deal.uid);
                                        popUp.open();
                                    }}
                                >
                                    <u>{deal.uid}</u>
                                </Text>
                            </div>
                            <Tag color={DEAL_STATUS_COLORS[deal.status]}>{DEAL_STATUS_TEXT[deal.status]}</Tag>
                        </Flex>
                        <Divider style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
                        <Flex justify="space-between">
                            <Text style={{ color: '#fff' }}>
                                {deal.stars_amount}{TelegramStar}
                            </Text>
                            <Text style={{ color: '#fff' }}>
                                {deal.price}{CurrencySign}
                            </Text>
                        </Flex>
                    </div>
                ))
            )}

            <Divider style={{ borderColor: 'var(--border)', margin: '8px 0' }} />

            <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>Мои покупки</Text>
            {buys.length === 0 ? (
                <Text style={{ color: 'rgba(75,85,99,0.9)' }}>Нет сделок, где вы покупатель.</Text>
            ) : (
                buys.map((deal) => (
                    <div
                        key={`${deal.uid}-buy`}
                        style={{
                            padding: 12,
                            borderRadius: 12,
                            background: 'rgba(15,23,42,0.95)',
                            border: '1px solid rgba(148,163,184,0.35)',
                        }}
                    >
                        <Flex justify="space-between" align="center">
                            <div>
                                <Text style={{ color: 'rgba(148,163,184,0.9)', fontSize: 12 }}>UID сделки</Text>
                                <Text
                                    style={{ color: 'white', cursor: 'pointer', display: 'block' }}
                                    onClick={() => {
                                        getDealById(deal.uid);
                                        popUp.open();
                                    }}
                                >
                                    <u>{deal.uid}</u>
                                </Text>
                            </div>
                            <Tag color={DEAL_STATUS_COLORS[deal.status]}>{DEAL_STATUS_TEXT[deal.status]}</Tag>
                        </Flex>
                        <Divider style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
                        <Flex justify="space-between">
                            <Text style={{ color: '#fff' }}>
                                {deal.stars_amount}{TelegramStar}
                            </Text>
                            <Text style={{ color: '#fff' }}>
                                {deal.price}{CurrencySign}
                            </Text>
                        </Flex>
                    </div>
                ))
            )}

            <Modal
                title={<span style={{ color: '#fff' }}>Детали сделки</span>}
                centered
                width={560}
                open={popUp.isOpen}
                footer={null}
                onCancel={popUp.close}
                styles={{
                    content: {
                        background: '#111422',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                        color: '#fff',
                    },
                    header: {
                        background: 'transparent',
                        color: '#fff',
                    },
                    body: {
                        paddingTop: 8,
                        color: '#fff',
                    },
                    mask: {
                        backgroundColor: 'rgba(10,11,16,0.6)',
                    },
                }}
            >
                <Flex vertical>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>Продавец: {dealsDetails?.telegram_id}</Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>
                        Тип сделки: {telegram_id === dealsDetails?.buyer
                            ? 'Покупка'
                            : telegram_id === dealsDetails?.telegram_id
                            ? 'Продажа'
                            : '—'}
                    </Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>Создана: {dealsDetails?.time}</Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>Количество звёзд: {dealsDetails?.stars_amount}{TelegramStar}</Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>Цена: {dealsDetails?.price}{CurrencySign}</Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                    <Text style={{ color: '#fff' }}>
                        Цена за штуку: {(dealsDetails?.price && dealsDetails?.stars_amount)
                            ? dealsDetails?.price / dealsDetails?.stars_amount
                            : 0}{CurrencySign}
                    </Text>
                    <Divider style={{ borderColor: 'var(--border)' }} />
                </Flex>

                <Flex vertical>
                    {isInMyDeals && dealsDetails?.status === 'pending' && isSeller ? (
                        <Button
                            style={{ backgroundColor: 'white', border: 'none', color: 'black' }}
                            onClick={() => {
                                if (dealsDetails?.uid) {
                                    window.open(`https://t.me/seller_stars_kur_bot?start=${dealsDetails.uid}`, '_blank');
                                }
                            }}
                        >
                            Отправить звёзды
                        </Button>
                    ) : null}
                </Flex>
            </Modal>

            <Modal
                title={<span style={{ color: '#fff' }}>Оплата</span>}
                centered
                width={250}
                open={qrPopUp.isOpen}
                footer={null}
                onCancel={qrPopUp.close}
                styles={{
                    content: {
                        background: '#111422',
                        border: '1px solid var(--border)',
                        borderRadius: 16,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                        color: '#fff',
                    },
                    header: {
                        background: 'transparent',
                        color: '#fff',
                    },
                    body: {
                        paddingTop: 8,
                        color: '#fff',
                    },
                    mask: {
                        backgroundColor: 'rgba(10,11,16,0.6)',
                    },
                }}
            >
                <Flex vertical>
                    {qrCodeByer || qrCodeSeller ? (
                        <img
                            src={qrCodeByer || qrCodeSeller}
                            alt="QR Code"
                            style={{ marginTop: '20px', width: '150px', height: '150px', alignSelf: 'center' }}
                        />
                    ) : null}
                    <Text style={{ color: 'white', alignSelf: 'center' }}>QR действителен</Text>
                </Flex>
            </Modal>
        </Flex>
    )
}
