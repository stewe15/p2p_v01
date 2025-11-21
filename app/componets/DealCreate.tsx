"use client";
import { FC, useEffect, useState } from "react";
import { Form, Input, Button, message, Flex } from "antd";
import Title from "antd/es/typography/Title";
import Text from 'antd/es/typography/Text'; 
import Cookies from 'js-cookie';
import { DealsApi } from "@/app/shared/dealsApi";

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
  

  const handleFinish = (values: any) => {
  if (values.stars <= 0 || values.price <= 0) {
    message.error("Введите корректные значения");
    return;
  }
  if (!key) {
    message.error('Ключ сделки ещё не получен, попробуйте чуть позже');
    onSubmit({
      success: false,
      uid: '',
      tgId: '',
      stars: 0,
      price: 0,
    });
    return;
  }

  const rawTgId = tgId || '';
  const safeTgId = rawTgId.startsWith('@') ? rawTgId.slice(1) : rawTgId;

  if (!safeTgId) {
    message.error('Не удалось получить ваш Telegram ID с сайта');
    onSubmit({
      success: false,
      uid: key,
      tgId: '',
      stars: values.stars,
      price: values.price,
    });
    return;
  }

  const payload = `c_${key}_${safeTgId}_${values.stars}_${values.price}`;

  try {
    const tgUrl = `https://t.me/seller_stars_kur_bot?start=${payload}`;
    const win = window.open(tgUrl, '_blank');

    if (!win) {
      message.error('Не удалось открыть Telegram. Разрешите всплывающие окна и попробуйте снова');
      onSubmit({
        success: false,
        uid: key,
        tgId: tgId,
        stars: values.stars,
        price: values.price,
      });
      return;
    }

    message.success('Откройте Telegram и завершите создание сделки в боте продавца');
    onSubmit({
      success: true,
      uid: key,
      tgId: tgId,
      stars: values.stars,
      price: values.price,
    });
  } catch (error) {
    console.error('Ошибка при открытии бота продавца:', error);
    message.error('Ошибка при открытии бота продавца');
    onSubmit({
      success: false,
      uid: key,
      tgId: tgId,
      stars: values.stars,
      price: values.price,
    });
  }
};

useEffect(() => {
  const getKey = async () => {
    try {
      const keyFromApi = await DealsApi.getRandomKey();
      if (!keyFromApi) {
        message.error('Ошибка при получении ключа');
        return;
      }
      setKey(keyFromApi);
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
