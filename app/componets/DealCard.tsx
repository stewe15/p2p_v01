"use client"
import { FC, useEffect, useState } from 'react';
import { Flex, Tag, Button, Typography, Modal, Divider, Input } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Deal } from '@/app/interfaces/interfaces';
import { CurrencySign } from '@/app/interfaces/interfaces';
import { TelegramStar } from '@/app/interfaces/interfaces';

import Text from 'antd/es/typography/Text'; 
import { useModal } from '../hooks/useModal';
import Cookies from 'js-cookie';
import { MyDeal } from './MyDeal';

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

interface ForBuyIO{
  dealUID:string;
  buyer?:string;
}

interface ResponseIO{
  message: string;
  success:boolean;
}

export const DealRow: FC<Deal> = ({ uid, time, status, stars_amount, price, telegram_id }) => {
  const popUp = useModal();
  const [tgFlag, setTgFlag] = useState<boolean>(false);
  const [setTgId, setTelegramID] = useState<string>('');
  const statistics = useModal();
  const rowStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
    color: 'var(--foreground)',
    width: '100%',
    padding: '16px 24px',
    marginBottom: '10px',
  } as React.CSSProperties;
  useEffect(() => {
    const usName: string | undefined  = Cookies.get('telegram_id')
    if(usName){
      setTgFlag(true)
    }
    else{
      setTgFlag(false)
    }
  },[])

  
  

 const handeleBuy = async () => {
  try {
    const usName: string | undefined = Cookies.get('telegram_id');

    const client: ForBuyIO = {
      dealUID: uid,
      buyer: tgFlag ? usName : setTgId,
    };

    console.log('Отправляем данные сделки:', client);

    const response = await fetch('/api/updateDeals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(client),
    });

    if (!response.ok) {
      console.error('Ошибка при обновлении сделки:', response.statusText);
      return;
    }

    const data: ResponseIO = await response.json();

    if (data.success) {
      console.log('Сделка обновлена успешно');
      popUp.close();
    } else {
      console.warn('Ошибка при покупке:', data.message);
    }
  } catch (error) {
    console.error('Ошибка при выполнении сделки:', error);
  }
};


  return (
    <div style={rowStyle}>
      <Flex justify="space-between" align="center" style={{ width: '100%' }}>
        <Flex vertical>
          <Text style={{ color: 'var(--muted)', fontSize: '12px' }}>
            ID: {uid.substring(0, 8)}...
          </Text>
          <Text style={{ color: 'var(--foreground)', fontSize: '20px', fontWeight: 'bold' }}>
            {stars_amount} Звёзд
          </Text>
        </Flex>

        <Tag color={statusColors[status]}>{statusText[status]}</Tag>

        <Flex vertical align="end" gap={8} style={{paddingBottom: '20px'}}>
          <Text style={{ color: 'var(--muted)', fontSize: '12px' }}>
            {time}
          </Text>
          <Button
            type="primary"
            style={{alignSelf: 'flex-start'}}
            icon={<ArrowRightOutlined />}
            onClick={popUp.open}
          >
            Детали
          </Button>
        </Flex>
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
        }}
        >
          <Flex vertical style={{ color: '#fff' }}>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff' }}>ID сделки: {uid}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff', cursor: 'crosshair'}} onClick={statistics.open} >Продовец: {telegram_id}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff' }}>Создана: {time}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff' }}>Количество звёзд: {stars_amount}{TelegramStar}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff' }}>Цена: {price}{CurrencySign}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          <Text style={{ color: '#fff' }}>Цена за штуку: {price / stars_amount}{CurrencySign}</Text>
          <Divider style={{ borderColor: 'var(--border)' }} />
          {(status !== 'pending' && status !== 'completed') && (
  <>
    {!tgFlag && ( 
      <Flex vertical>
        <Input 
          onChange={(e) => setTelegramID(e.target.value)} 
          placeholder="Введите Telegram ID" 
          className="input-white"
          style={{ color: '#fff', background: 'transparent', borderColor: 'var(--border)' }}
        />
        <Divider style={{ borderColor: 'var(--border)' }} />
      </Flex>
    )}
    <Button 
      style={{ backgroundColor: 'red', color: 'white', border: 'none' }} 
      onClick={handeleBuy}
    >
      Купить
    </Button>
  </>
)}

        </Flex>
        </Modal>
        <Modal
        title={<span style={{ color: '#fff' }}>Статистика</span>}
        centered
        width={560}
        open={statistics.isOpen}
        footer={null}
        onCancel={statistics.close}
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
          <Divider />
          <Text style={{color:'white'}}>Сделки продавца: {telegram_id}</Text>
          <Divider />
          <MyDeal telegram_id={telegram_id} isInMyDeals={false} />
        </Modal>

      </Flex>
    </div>
  );
};