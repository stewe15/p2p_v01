"use client";

import { useEffect, useState } from "react";
import { App, Card, Typography, Flex, Tag, ConfigProvider, Spin, Empty, Grid } from "antd";
import { UserStat, UserStatsResponse } from "@/app/shared/statsDomain";
import { StatsApi } from "@/app/shared/statsApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function UserStatsPage() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await StatsApi.getUserStats();
        if (data.success === false) {
          throw new Error(data.message || "Ошибка загрузки статистики по пользователям");
        }
        setUsers(data.users || []);
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки статистики по пользователям");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const hasData = users.length > 0;

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
            maxWidth: 1000,
            margin: isMobile ? "16px auto" : "32px auto",
            padding: isMobile ? "0 8px" : "0 16px",
          }}
        >
          <Title level={2} style={{ marginBottom: 8 }}>
            Статистика по пользователям
          </Title>
          <Text>
            Сводка по продавцам и покупателям: количество сделок, оборот в рублях и звёздах.
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
                <Spin tip="Загрузка статистики по пользователям..." />
              </div>
            )}

            {!loading && error && (
              <Text style={{ color: "#ffffff" }}>{error}</Text>
            )}

            {!loading && !error && !hasData && (
              <Empty
                description={
                  <Text style={{ color: "#ffffff" }}>
                    Пока нет данных по пользователям
                  </Text>
                }
              />
            )}

            {!loading && !error && hasData && (
              <Flex vertical gap={isMobile ? 8 : 12} style={{ marginTop: 8 }}>
                {users.map((u) => (
                  <div
                    key={u.telegram_id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(148,163,184,0.35)",
                    }}
                  >
                    <Flex justify="space-between" align="center" gap={12} wrap>
                      <div>
                        <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Пользователь</Text>
                        <Title level={5} style={{ margin: 0 }}>
                          {u.telegram_id}
                        </Title>
                        <Flex gap={8} style={{ marginTop: 4 }} vertical={isMobile}>
                          <Tag color="blue">Сделок: {u.totalDeals}</Tag>
                          <Tag color="green">Продаж: {u.sellDeals}</Tag>
                          <Tag color="gold">Покупок: {u.buyDeals}</Tag>
                        </Flex>
                      </div>

                      <Flex vertical align="end" gap={4}>
                        <Text style={{color: 'white'}}>
                          Оборот: {u.totalRub.toLocaleString("ru-RU")} ₽ / {u.totalStars} ⭐
                        </Text >
                        <Text type="secondary" style={{ fontSize: 12, color: 'white' }}>
                          Продал: {u.sellStars} ⭐ на {u.sellRub.toLocaleString("ru-RU")} ₽
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12, color: 'white' }}>
                          Купил: {u.buyStars} ⭐ на {u.buyRub.toLocaleString("ru-RU")} ₽
                        </Text>
                      </Flex>
                    </Flex>
                  </div>
                ))}
              </Flex>
            )}
          </Card>
        </div>
      </ConfigProvider>
    </App>
  );
}
