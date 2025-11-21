"use client";

import { useEffect, useState } from "react";
import { App, Card, Typography, Flex, Tag, ConfigProvider, Spin, Empty, Grid } from "antd";
import Cookies from "js-cookie";
import { UserStat, UserStatsResponse } from "@/app/shared/statsDomain";
import { StatsApi } from "@/app/shared/statsApi";
import { BalanceApi } from "@/app/shared/balanceApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type Balance = {
  rub: number;
  stars: number;
};

type BalanceResponse = {
  success?: boolean;
  balance?: Balance;
  message?: string;
};

export default function MeStatsPage() {
  const [user, setUser] = useState<UserStat | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const tg = Cookies.get("telegram_id");

    if (!tg) {
      setError("Авторизуйтесь, чтобы увидеть личную статистику");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const [userJson, balJsonRaw] = await Promise.all([
          StatsApi.getUserStats(),
          BalanceApi.getBalance(tg),
        ]);

        const me = (userJson.users || []).find((u) => u.telegram_id === tg) || null;
        setUser(me);

        const balJson = balJsonRaw;
        if (balJson && balJson.success && balJson.balance) {
          setBalance({
            rub: balJson.balance.rub ?? 0,
            stars: balJson.balance.stars ?? 0,
          });
        }
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки личной статистики");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const hasUser = !!user;

  return (
    <App>
      <ConfigProvider
        theme={{
          token: {
            colorText: "#ffffff",
            colorTextSecondary: "#ffffff",
            colorTextHeading: "#ffffff",
          },
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: isMobile ? "16px auto" : "32px auto",
            padding: isMobile ? "0 8px" : "0 16px",
          }}
        >
          <Title level={2} style={{ marginBottom: 8 }}>
            Моя статистика
          </Title>
          <Text>
            Личный профиль трейдера: баланс, покупки и продажи по всем сделкам.
          </Text>

          <Card
            style={{
              marginTop: 24,
              background:
                "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 55%), rgba(15,23,42,0.9)",
              borderRadius: 24,
              border: "1px solid rgba(148,163,184,0.35)",
            }}
            bodyStyle={{ padding: 24 }}
          >
            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 180,
                }}
              >
                <Spin tip="Загрузка личной статистики..." />
              </div>
            )}

            {!loading && error && (
              <Text style={{ color: "#ffffff" }}>{error}</Text>
            )}

            {!loading && !error && !hasUser && (
              <Empty
                description={
                  <Text style={{ color: "#ffffff" }}>
                    Пока нет данных по вашим сделкам
                  </Text>
                }
              />
            )}

            {!loading && !error && hasUser && user && (
              <>
                <Flex
                  gap={isMobile ? 16 : 24}
                  wrap
                  style={{ marginBottom: isMobile ? 16 : 24 }}
                >
                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Пользователь</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {user.telegram_id}
                    </Title>
                  </div>

                  {balance && (
                    <div>
                      <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Баланс</Text>
                      <Title level={4} style={{ margin: 0 }}>
                        {balance.rub.toLocaleString("ru-RU")} ₽ / {balance.stars} ⭐
                      </Title>
                    </div>
                  )}

                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Сделки</Text>
                    <Flex gap={8} style={{ marginTop: 4 }} vertical={isMobile}>
                      <Tag color="blue">Всего: {user.totalDeals}</Tag>
                      <Tag color="green">Продаж: {user.sellDeals}</Tag>
                      <Tag color="gold">Покупок: {user.buyDeals}</Tag>
                    </Flex>
                  </div>
                </Flex>

                <Flex gap={isMobile ? 16 : 24} wrap>
                  <Card
                    style={{ flex: 1, minWidth: 220, background: "rgba(15,23,42,0.95)" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Оборот</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {user.totalRub.toLocaleString("ru-RU")} ₽ / {user.totalStars} ⭐
                    </Title>
                  </Card>

                  <Card
                    style={{ flex: 1, minWidth: 220, background: "rgba(15,23,42,0.95)" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Как продавец</Text>
                    <Text style={{ display: "block", color: "#ffffff", marginTop: 4 }}>
                      Продал: {user.sellStars} ⭐ на {user.sellRub.toLocaleString("ru-RU")} ₽
                    </Text>
                  </Card>

                  <Card
                    style={{ flex: 1, minWidth: 220, background: "rgba(15,23,42,0.95)" }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Как покупатель</Text>
                    <Text style={{ display: "block", color: "#ffffff", marginTop: 4 }}>
                      Купил: {user.buyStars} ⭐ на {user.buyRub.toLocaleString("ru-RU")} ₽
                    </Text>
                  </Card>
                </Flex>
              </>
            )}
          </Card>
        </div>
      </ConfigProvider>
    </App>
  );
}
