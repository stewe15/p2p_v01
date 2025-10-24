import Image from "next/image";
import styles from "./page.module.css";
import { Button, Drawer, Flex, Menu, Row } from 'antd';
import { MainPage } from "./componets/MainPage";
import { Suspense } from "react";
import Title from "antd/es/typography/Title";


export default function Home() {
  return (
      <MainPage />
  );
}
