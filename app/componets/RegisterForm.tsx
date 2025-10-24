"use client"
import { FC, useState } from "react";
import { Form, Input, Button, message } from "antd";
import Title from "antd/es/typography/Title";
import { RegisterAndLoginResponse } from "../interfaces/interfaces";


interface RegisterFormProps {
  onSubmit: (values: {success:boolean; telegram_id: string; username: string; password: string }) => void;
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const handleFinish = async (values: any) => {
  console.log("Register values:", values);

  try {
    const response = await fetch('/api/register', {
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
      console.log('Регистрация успешна:', result);

      

      onSubmit({
        success: result.success,
        telegram_id: result.telegram_id || '',
        username: result.username || '',
        password: '',
      });

      message.success('Регистрация успешна!');
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
          Зарегистрироваться
        </Button>
      </Form.Item>
    </Form>
  );
};
