"use client";

import { useEffect, useState } from "react";
import { App, Card, Typography, Flex, ConfigProvider, Spin, Empty, Tag, Grid } from "antd";
import { UserStat, UserStatsResponse } from "@/app/shared/statsDomain";
import { DealsApi } from "@/app/shared/dealsApi";
import { StatsApi } from "@/app/shared/statsApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type Deal = {
  uid: string;
  time: string;
  status: string;
  stars_amount: number;
  price: number;
};

type DealsResponse = {
  deals?: Deal[];
};

type SystemUserStat = UserStat;

const statusText: Record<string, string> = {
  active: "Активна",
  pending: "Ожидает оплаты",
  completed: "Завершена",
};

const statusColors: Record<string, string> = {
  active: "success",
  pending: "warning",
  completed: "processing",
};

export default function SystemPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [topUsers, setTopUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [allDeals, usersStats] = await Promise.all([
          DealsApi.getDeals(),
          StatsApi.getUserStats(),
        ]);

        allDeals.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
        setDeals(allDeals);

        const users = (usersStats.users || [])
          .slice()
          .sort((a, b) => b.totalRub - a.totalRub)
          .slice(0, 5);
        setTopUsers(users);
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки системной информации");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;

    try {
      es = new EventSource("/api/events");

      es.onmessage = (event) => {
        const data = event.data || "";
        setLogs((prev) => {
          const next = [...prev, data];
          return next.slice(-200);
        });
      };

      es.onerror = () => {
        setEventsError("Поток событий отключён");
        if (es) {
          es.close();
        }
      };
    } catch (e) {
      console.error("Events SSE error:", e);
      setEventsError("Не удалось подключиться к потоку событий");
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, []);

  const totalDeals = deals.length;
  const activeDeals = deals.filter((d) => d.status === "active").length;
  const pendingDeals = deals.filter((d) => d.status === "pending").length;
  const completedDeals = deals.filter((d) => d.status === "completed").length;

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
            Системный обзор
          </Title>
          <Text>
            Техническая сводка по сделкам и активности пользователей.
          </Text>

          <Card
            style={{
              marginTop: 24,
              marginBottom: 16,
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
                  minHeight: 120,
                }}
              >
                <Spin tip="Загрузка обзора..." />
              </div>
            )}

            {!loading && error && (
              <Text style={{ color: "#ffffff" }}>{error}</Text>
            )}

            {!loading && !error && (
              <>
                <Flex
                  gap={isMobile ? 16 : 24}
                  wrap
                  style={{ marginBottom: isMobile ? 12 : 16 }}
                >
                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Всего сделок</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {totalDeals}
                    </Title>
                  </div>
                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Активные</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {activeDeals}
                    </Title>
                  </div>
                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Ожидают оплаты</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {pendingDeals}
                    </Title>
                  </div>
                  <div>
                    <Text style={{ color: "#e5e7eb", fontSize: 12 }}>Завершены</Text>
                    <Title level={4} style={{ margin: 0 }}>
                      {completedDeals}
                    </Title>
                  </div>
                </Flex>

                <Flex gap={isMobile ? 12 : 16} wrap vertical={isMobile}>
                  <Card
                    style={{
                      flex: isMobile ? "none" : 1,
                      width: isMobile ? "100%" : "auto",
                      minWidth: isMobile ? "100%" : 260,
                      background: "rgba(15,23,42,0.95)",
                    }}
                    bodyStyle={{ padding: 16 }}
                    title={<span style={{ color: "#fff" }}>Топ пользователей</span>}
                  >
                    {topUsers.length === 0 && (
                      <Empty
                        description={
                          <Text style={{ color: "#ffffff" }}>
                            Пока нет данных по пользователям
                          </Text>
                        }
                      />
                    )}
                    {topUsers.length > 0 && (
                      <Flex vertical gap={8}>
                        {topUsers.map((u, idx) => (
                          <Flex key={u.telegram_id} justify="space-between" align="center">
                            <div>
                              <Text style={{ color: "#9ca3af", fontSize: 12 }}>#{idx + 1}</Text>
                              <Text style={{ color: "#ffffff", display: "block" }}>
                                {u.telegram_id}
                              </Text>
                            </div>
                            <Text style={{ color: "#ffffff" }}>
                              {u.totalRub.toLocaleString("ru-RU")} ₽
                            </Text>
                          </Flex>
                        ))}
                      </Flex>
                    )}
                  </Card>

                  <Card
                    style={{
                      flex: isMobile ? "none" : 2,
                      width: isMobile ? "100%" : "auto",
                      minWidth: isMobile ? "100%" : 320,
                      background: "rgba(15,23,42,0.95)",
                    }}
                    bodyStyle={{ padding: 16 }}
                    title={<span style={{ color: "#fff" }}>Последние сделки</span>}
                  >
                    {deals.length === 0 && (
                      <Empty
                        description={
                          <Text style={{ color: "#ffffff" }}>
                            Сделок пока нет
                          </Text>
                        }
                      />
                    )}
                    {deals.length > 0 && (
                      <Flex vertical gap={8}>
                        {deals.slice(0, 10).map((d) => (
                          <Flex key={d.uid} justify="space-between" align="center">
                            <div>
                              <Text style={{ color: "#9ca3af", fontSize: 12 }}>UID: {d.uid}</Text>
                              <Text style={{ color: "#ffffff", display: "block" }}>
                                {d.stars_amount} ⭐ за {d.price} ₽
                              </Text>
                            </div>
                            <Flex vertical align="end">
                              <Tag color={statusColors[d.status] || "default"}>
                                {statusText[d.status] || d.status}
                              </Tag>
                              <Text style={{ color: "#9ca3af", fontSize: 12 }}>{d.time}</Text>
                            </Flex>
                          </Flex>
                        ))}
                      </Flex>
                    )}
                  </Card>
                  <Card
                    style={{
                      flex: isMobile ? "none" : 1,
                      width: isMobile ? "100%" : "auto",
                      minWidth: isMobile ? "100%" : 320,
                      background: "rgba(15,23,42,0.95)",
                    }}
                    bodyStyle={{ padding: 16 }}
                    title={<span style={{ color: "#fff" }}>Серверная консоль</span>}
                  >
                    {eventsError && (
                      <Text style={{ color: "#f97373", display: "block", marginBottom: 8 }}>
                        {eventsError}
                      </Text>
                    )}
                    {logs.length === 0 && !eventsError && (
                      <Text style={{ color: "#9ca3af" }}>
                        Ожидаем события от сервера...
                      </Text>
                    )}
                    <div
                      style={{
                        marginTop: 8,
                        maxHeight: 260,
                        overflowY: "auto",
                        backgroundColor: "#020617",
                        borderRadius: 8,
                        padding: 8,
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontSize: 12,
                      }}
                    >
                      {logs.map((line, idx) => (
                        <div key={idx} style={{ color: "#e5e7eb", whiteSpace: "pre-wrap" }}>
                          {line}
                        </div>
                      ))}
                    </div>
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
