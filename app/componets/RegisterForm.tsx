"use client"
import { FC, useState } from "react";
import { App, Form, Input, Button } from "antd";
import Title from "antd/es/typography/Title";
import Cookies from 'js-cookie';
import { RegisterAndLoginResponse } from "../interfaces/interfaces";
import { AuthApi } from "@/app/shared/authApi";


interface RegisterFormProps {
  onSubmit: (values: {success:boolean; telegram_id: string; username: string; password: string }) => void;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const handleFinish = async (values: any) => {
  console.log("Register values:", values);

  try {
    const result = await AuthApi.register(values);

    if (!result) {
      message.error('Ошибка при отправке данных');
      return;
    }

    if (result.success) {
      console.log('Регистрация успешна:', result);

      Cookies.set('username', result.username || '', { expires: 7 });
      Cookies.set('telegram_id', result.telegram_id || '', { expires: 7 });

      onSubmit({
        success: result.success,
        telegram_id: result.telegram_id || '',
        username: result.username || '',
        password: '',
      });

      message.success('Регистрация успешна! Вход выполнен.');
    } else {
      message.error(result.message || 'Ошибка регистрации');
    }
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    message.error('Ошибка при подключении к серверу');
  }
};


  return (
    <Form
      form={form}
      name="register"
      layout="vertical"
      onFinish={handleFinish}
      style={{ maxWidth: 480, margin: "0 auto", padding: "20px", color:'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 12 }}
    >
        <Title level={5} style={{color: 'var(--foreground)'}}>Telegram ID</Title>
      <Form.Item
        name="telegram_id"
        rules={[
          { required: true, message: "Введите ваш Telegram ID" },
          { pattern: /^@.+$/, message: "Telegram ID должен начинаться с @" }
        ]}
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
        rules={[
          { required: true, message: "Введите пароль" },
          { min: 8, message: "Пароль должен содержать минимум 8 символов" }
        ]}
      >
        <Input.Password placeholder="Пароль" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Зарегистрироваться
        </Button>
      </Form.Item>
    </Form>
  );
};
