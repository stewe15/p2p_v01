"use client";
import { FC, useEffect, useState } from "react";
import { Form, Input, Button, message, Flex, Divider } from "antd";
import Title from "antd/es/typography/Title";
import Text from 'antd/es/typography/Text'; 
import Cookies from 'js-cookie';
import { Deal } from "../interfaces/interfaces";

interface CreateDealFormProps {
  onSubmit: (values: {uid: string; tgId: string; stars: number; price: number; success:boolean }) => void;
}
interface KeyIO {
    key:string;
}
interface RespInter{
    success:boolean
}

export const CreateDealForm: FC<CreateDealFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [key, setKey] = useState<string>('');
  const [tgId, setTgId] = useState<string>('');
  const currentDate: Date = new Date();
  const year: number = currentDate.getFullYear();
  const month: number = currentDate.getMonth() + 1; 
  const day: number = currentDate.getDate();
  const hours: number = currentDate.getHours();
  const minutes: number = currentDate.getMinutes();
  const seconds: number = currentDate.getSeconds();

  const handleFinish = (values: any) => {
  if (values.stars <= 0 || values.price <= 0) {
    message.error("Введите корректные значения");
    return;
  }

  const sendValues = async () => {
    const deals: Deal = {
      ...values,
      uid: key,
      stars_amount: values.stars,
      status: 'active',
      telegram_id: tgId,
      time: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
      buyer: '',
      price: values.price,
    };

    try {
      const response = await fetch('/api/handleDeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deals),
      });

      if (!response.ok) {
        message.error('Ошибка при отправке данных');
        return;
      }

      const data: RespInter = await response.json();

      if (data.success) {
        console.log('Сделка успешно создана:', data);
        onSubmit({
          success: data.success,
          uid: '',
          tgId: '',
          stars: 0,
          price: 0,
        });
      }
    } catch (error) {
      console.error('Ошибка при создании сделки:', error);
      message.error('Ошибка при создании сделки');
    }
  };

  sendValues();
  onSubmit(values);
};

useEffect(() => {
  const getKey = async () => {
    try {
      const response = await fetch('/api/getRandomKey', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        message.error('Ошибка при получении ключа');
        return;
      }

      const data: KeyIO = await response.json();
      setKey(data.key);
    } catch (error) {
      console.error('Ошибка при получении ключа:', error);
      message.error('Ошибка при получении ключа');
    }
  };

  const temId = Cookies.get('telegram_id');
  setTgId(temId || '');
  getKey();
}, []);


  return (
    <Form
      form={form}
      name="create-deal"
      layout="vertical"
      onFinish={handleFinish}
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "20px",
        background: 'var(--surface)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 12,
      }}
    >
        <Flex vertical>
            <Form.Item
            name="UID">
        <Text style={{color: 'white'}}>UID: {key}</Text>
        </Form.Item>
        <Form.Item
        name='tgId'>
        <Text style={{color: 'white'}}>Telegram_id: {tgId}</Text>
        </Form.Item>
        </Flex>
        
      <Title level={5} style={{ color: 'var(--foreground)' }}>
        Количество звёзд
      </Title>
      <Form.Item
        name="stars"
        rules={[{ required: true, message: "Введите количество звёзд" }]}
      >
        <Input type="number" min={1} placeholder="Например, 5" />
      </Form.Item>

      <Title level={5} style={{ color: 'var(--foreground)' }}>
        Цена лота
      </Title>
      <Form.Item
        name="price"
        rules={[{ required: true, message: "Введите цену лота" }]}
      >
        <Input type="number" min={1} placeholder="Например, 1000" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Добавить сделку
        </Button>
      </Form.Item>
    </Form>
  );
};
