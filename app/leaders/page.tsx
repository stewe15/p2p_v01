"use client";

import { useEffect, useState } from "react";
import { App, Card, Typography, Flex, Tag, ConfigProvider, Spin, Empty, Grid } from "antd";
import { UserStat, UserStatsResponse } from "@/app/shared/statsDomain";
import { StatsApi } from "@/app/shared/statsApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function LeadersPage() {
  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await StatsApi.getUserStats();
        const list = data.users || [];
        list.sort((a, b) => b.totalRub - a.totalRub);
        setUsers(list);
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки рейтинга");
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
            maxWidth: 900,
            margin: isMobile ? "16px auto" : "32px auto",
            padding: isMobile ? "0 8px" : "0 16px",
          }}
        >
          <Title level={2} style={{ marginBottom: 8 }}>
            Рейтинг продавцов
          </Title>
          <Text>
            Топ пользователей по обороту в рублях и количеству проданных звёзд.
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
                <Spin tip="Загрузка рейтинга..." />
              </div>
            )}

            {!loading && error && (
              <Text style={{ color: "#ffffff" }}>{error}</Text>
            )}

            {!loading && !error && !hasData && (
              <Empty
                description={
                  <Text style={{ color: "#ffffff" }}>
                    Пока нет данных для рейтинга
                  </Text>
                }
              />
            )}

            {!loading && !error && hasData && (
              <Flex vertical gap={12} style={{ marginTop: 8 }}>
                {users.map((u, index) => (
                  <div
                    key={u.telegram_id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(148,163,184,0.35)",
                    }}
                  >
                    <Flex
                      justify={isMobile ? "flex-start" : "space-between"}
                      align={isMobile ? "flex-start" : "center"}
                      gap={12}
                      vertical={isMobile}
                    >
                      <div>
                        <Text style={{ color: "#9ca3af", fontSize: 12 }}>Место</Text>
                        <Title level={5} style={{ margin: 0 }}>
                          #{index + 1}
                        </Title>
                      </div>

                      <div style={{ flex: 1 }}>
                        <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Пользователь</Text>
                        <Title level={5} style={{ margin: 0 }}>
                          {u.telegram_id}
                        </Title>
                        <Flex
                          gap={8}
                          style={{ marginTop: 4 }}
                          vertical={isMobile}
                        >
                          <Tag color="blue">Сделок: {u.totalDeals}</Tag>
                          <Tag color="green">Продал: {u.sellStars} ⭐</Tag>
                        </Flex>
                      </div>

                      <Flex
                        vertical
                        align={isMobile ? "flex-start" : "end"}
                        gap={4}
                      >
                        <Text style={{ color: "white" }}>
                          Оборот: {u.totalRub.toLocaleString("ru-RU")} ₽
                        </Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, color: "white" }}
                        >
                          Продано звёзд: {u.sellStars}
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
