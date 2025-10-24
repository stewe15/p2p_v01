"use client"
import { FC } from "react";
import { Form, Input, Button, message } from "antd";
import Title from "antd/es/typography/Title";
import Cookies from 'js-cookie';
import {RegisterAndLoginResponse} from '../interfaces/interfaces'
import { User } from "../interfaces/interfaces";

interface LoginFormProps {
  onSubmit: (values: {success: boolean; telegram_id: string; username: string; password: string }) => void;
}


export const LoginForm: FC<LoginFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
  try {
    console.log("Login values:", values);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      message.error('Ошибка при отправке данных');
      return;
    }

    const result: RegisterAndLoginResponse = await response.json();

    if (result.success) {
      Cookies.set('username', result.username, { expires: 7 });
      Cookies.set('telegram_id', result.telegram_id, { expires: 7 });

      onSubmit({
        success: result.success,
        telegram_id: "",
        username: "",
        password: ""
      });

      message.success('Вход выполнен успешно');
    } else {
      message.error(result.message || 'Ошибка входа');
    }

    console.log('Результат входа:', result);
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    message.error('Ошибка при авторизации');
  }
};


  return (
    <Form
      form={form}
      name="login"
      layout="vertical"
      onFinish={handleFinish}
      style={{ maxWidth: 480, margin: "0 auto", padding: "20px", color:'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 12 }}
    >
        <Title level={5} style={{color: 'var(--foreground)'}}>Telegram ID</Title>
      <Form.Item
        name="telegram_id"
        rules={[{ required: true, message: "Введите ваш Telegram ID" }]}
      >
        <Input placeholder="123456789" />
      </Form.Item>
        <Title level={5} style={{color: 'var(--foreground)'}}>Username</Title>
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Введите username" }]}
      >
        <Input placeholder="Ваш никнейм" />
      </Form.Item>

        <Title level={5} style={{color: 'var(--foreground)'}}>Password</Title>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Введите пароль" }]}
      >
        <Input.Password placeholder="Пароль" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Войти
        </Button>
      </Form.Item>
    </Form>
  );
};
