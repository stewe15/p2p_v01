"use client"
import { FC, useEffect, useState } from 'react';
import { Flex, Tag, Button, Typography, Modal, Divider, Input, Row, message, Col } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Deal } from '@/app/interfaces/interfaces';
import { CurrencySign } from '@/app/interfaces/interfaces';
import { TelegramStar } from '@/app/interfaces/interfaces';

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

const statusColors = {
  active: 'success',
  pending: 'warning',
  completed: 'processing',
};

const statusText = {
  active: 'Активна',
  pending: 'Ожидает оплаты',
  completed: 'Завершена',
};


export const MyDeal: FC<MyDealIO> = ({telegram_id, isInMyDeals}) =>{
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
      const response = await fetch('/api/myDeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(us),
      });

      if (!response.ok) {
        message.error('Ошибка при загрузке сделок пользователя');
        return;
      }

      const data: Datas = await response.json();
      setMydeals(data.myDeals);
    } catch (error) {
      console.error('Ошибка при получении сделок:', error);
      message.error('Ошибка при получении данных');
    }
  };

  getData();
}, [telegram_id]);


const generateQRCodeByer = async () => {
  try {
    const response = await fetch('/api/generateBuyer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealIdLock)
    });
    console.log(dealIdLock);
    if (!response.ok) {
      throw new Error('Ошибка при генерации QR-кода покупателя');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setQrCodeSeller(url);
  } catch (error) {
    console.error('Ошибка при генерации QR-кода покупателя:', error);
  }
};


const generateQRCodeSeller = async () => {
  try {
    const response = await fetch('/api/generateSeller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealIdLock)
    });

    if (!response.ok) {
      throw new Error('Ошибка при генерации QR-кода продавца');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    setQrCodeByer(url);
  } catch (error) {
    console.error('Ошибка при генерации QR-кода продавца:', error);
  }
};


const getDealById = async (dealIdinficator: string) => {
  try {
    const dealId: DealId = { dealId: dealIdinficator };
    setDealID(dealId);

    const response = await fetch('/api/getDealById', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealId),
    });

    if (!response.ok) {
      console.error('Не удалось получить данные сделки');
      return;
    }

    const data: NeededDeal = await response.json();
    setDetails(data.neededDeal);
  } catch (error) {
    console.error('Ошибка при получении сделки по ID:', error);
  }
};

    return(
        <Flex vertical justify="space-between">
            {myDeals.map((deal) => (
                <Row style={{paddingBottom: '20px'}}>
                    <Col lg={10}>
                    <Text style={{color:'white', cursor: 'crosshair', }} onClick={() => {
                        getDealById(deal.uid)
                        popUp.open();
                    }}><u>UID: {deal.uid}</u></Text>
                    </Col>
                    <Col lg={8}>
                    <Tag color={statusColors[deal.status]}>{statusText[deal.status]}</Tag>
                    </Col>
                </Row>
            ))}
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
            color: '#fff'
          },
          header: {
            background: 'transparent',
            color: '#fff'
          },
          body: {
            paddingTop: 8,
            color: '#fff'
          },
          mask: {
            backgroundColor: 'rgba(10,11,16,0.6)',
          }
        }}>
            <Flex vertical>
                <Divider style={{ borderColor: 'var(--border)' }} />
                <Text style={{ color: '#fff' }}>Продавец: {dealsDetails?.telegram_id}</Text>
                <Divider style={{ borderColor: 'var(--border)' }} />
                <Text style={{ color: '#fff' }}>Создана: {dealsDetails?.time}</Text>
                <Divider style={{ borderColor: 'var(--border)' }} />
                <Text style={{ color: '#fff' }}>Количество звёзд: {dealsDetails?.stars_amount}{TelegramStar}</Text>
                <Divider style={{ borderColor: 'var(--border)' }} />
                <Text style={{ color: '#fff' }}>Цена: {dealsDetails?.price}{CurrencySign}</Text>
                <Divider style={{ borderColor: 'var(--border)' }} />
                <Text style={{ color: '#fff' }}>Цена за штуку: {(dealsDetails?.price && dealsDetails?.stars_amount) ? dealsDetails?.price / dealsDetails?.stars_amount : 0 }{CurrencySign}</Text>
                <Divider style={{ borderColor: 'var(--border)' }} />
            </Flex>
            <Flex vertical>
                {isInMyDeals && dealsDetails?.status === 'pending' ? <Button style={{backgroundColor: 'white', border:'none', color:'black'}} onClick={() => {
                    if(telegram_id == dealsDetails?.buyer){
                        generateQRCodeByer();
                    }
                    if(telegram_id == dealsDetails?.telegram_id){
                        generateQRCodeSeller();
                    }
                    qrPopUp.open();
                }}>Оплатить</Button> : null}
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
            color: '#fff'
          },
          header: {
            background: 'transparent',
            color: '#fff'
          },
          body: {
            paddingTop: 8,
            color: '#fff'
          },
          mask: {
            backgroundColor: 'rgba(10,11,16,0.6)',
          }
        }}>
            <Flex vertical>
                {qrCodeByer || qrCodeSeller ? ( 
        <img src={qrCodeByer || qrCodeSeller} alt="QR Code" style={{ marginTop: '20px', width: '150px', height: '150px', alignSelf: 'center' }} />
    ) : null}
            <Text style={{color:'white', alignSelf:'center'}}>QR действителен</Text>
            </Flex>


        </Modal>
        </Flex>
        

    )
}