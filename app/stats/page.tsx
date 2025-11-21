"use client";

import { useEffect, useState } from "react";
import { App, Card, Typography, Spin, Empty, Flex, Tag, ConfigProvider, Grid } from "antd";
import { DealStat, DealsStatsResponse } from "@/app/shared/statsDomain";
import { StatsApi } from "@/app/shared/statsApi";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function StatsPage() {
  const [stats, setStats] = useState<DealStat[]>([]);
  const [overall, setOverall] = useState<DealsStatsResponse["overall"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await StatsApi.getDealsStats();
        if (data.success === false) {
          throw new Error(data.message || "Ошибка загрузки статистики");
        }
        setStats(data.stats || []);
        setOverall(data.overall || null);
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки статистики");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const hasData = stats.length > 0;
  const maxRub = hasData
    ? Math.max(...stats.map((s) => s.totalRub || 0), 1)
    : 1;

  const totalDeals =
    overall?.totalDeals ?? stats.reduce((acc, s) => acc + (s.dealsCount || 0), 0);
  const totalRub =
    overall?.totalRub ?? stats.reduce((acc, s) => acc + (s.totalRub || 0), 0);
  const totalStars =
    overall?.totalStars ?? stats.reduce((acc, s) => acc + (s.totalStars || 0), 0);

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
            Статистика сделок
          </Title>
          <Text>
            График активности по дням, объём в рублях и количество звёзд.
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
              <Spin tip="Загрузка статистики..." />
            </div>
          )}

          {!loading && error && (
            <Text style={{ color: "#ffffff" }}>{error}</Text>
          )}

          {!loading && !error && !hasData && (
            <Empty
              description={
                <Text style={{ color: "#ffffff" }}>
                  Пока нет сделок для статистики
                </Text>
              }
            />
          )}

          {!loading && !error && hasData && (
            <>
              <Flex
                gap={isMobile ? 16 : 24}
                wrap
                style={{ marginBottom: isMobile ? 16 : 24 }}
              >
                <div>
                  <Text>Всего сделок</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {totalDeals}
                  </Title>
                </div>

                <div>
                  <Text>Общий объём</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {totalRub.toLocaleString("ru-RU")} ₽
                  </Title>
                </div>

                <div>
                  <Text>Всего звёзд</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {totalStars.toLocaleString("ru-RU")} ⭐
                  </Title>
                </div>

                <div>
                  <Text>Дней активности</Text>
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.length}
                  </Title>
                </div>
              </Flex>

              <div style={{ marginBottom: 16 }}>
                <Text>График по дням (объём в ₽)</Text>
              </div>

              {isMobile ? (
                <div
                  style={{
                    borderRadius: 16,
                    padding: 12,
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
                    border: "1px solid rgba(30,64,175,0.6)",
                    maxWidth: 360,
                    margin: "0 auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      gap: 6,
                      height: 200,
                    }}
                  >
                    {stats.map((item) => {
                      const ratio = item.totalRub / maxRub;
                      const barHeight = 40 + ratio * 140; // от 40 до 180px
                      const shortDate = item.date === "unknown"
                        ? "?"
                        : item.date.slice(5); // MM-DD

                      return (
                        <div
                          key={item.date}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            minWidth: 20,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#e5e7eb",
                              marginBottom: 4,
                            }}
                          >
                            {shortDate}
                          </Text>
                          <div
                            style={{
                              height: 180,
                              width: 16,
                              borderRadius: 999,
                              backgroundColor: "rgba(15,23,42,0.9)",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "flex-end",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: `${barHeight}px`,
                                borderRadius: 999,
                                background:
                                  "linear-gradient(180deg, #38bdf8, #0ea5e9)",
                                boxShadow:
                                  "0 0 10px rgba(56,189,248,0.6), 0 8px 16px rgba(37,99,235,0.45)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: 260,
                    borderRadius: 20,
                    padding: "12px 12px 4px",
                    background:
                      "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))",
                    border: "1px solid rgba(30,64,175,0.6)",
                    boxShadow: "0 18px 45px rgba(15,23,42,0.85)",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    overflowX: "auto",
                  }}
                >
                  {stats.map((item) => {
                    const height = 40 + (item.totalRub / maxRub) * 160;
                    const shortDate = item.date === "unknown"
                      ? "?"
                      : item.date.slice(5); // MM-DD

                    return (
                      <div
                        key={item.date}
                        style={{
                          flex: "0 0 48px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 6,
                        }}
                      >
                        <div
                          title={`День: ${item.date}\nСделок: ${item.dealsCount}\nОбъём: ${item.totalRub.toLocaleString(
                            "ru-RU"
                          )} ₽\nЗвёзды: ${item.totalStars}`}
                          style={{
                            width: 28,
                            height,
                            borderRadius: 999,
                            background:
                              "linear-gradient(180deg, #38bdf8, #0ea5e9)",
                            boxShadow:
                              "0 0 12px rgba(56,189,248,0.7), 0 12px 24px rgba(37,99,235,0.55)",
                          }}
                        />
                        <Text
                          style={{ fontSize: 10, lineHeight: 1, color: "#ffffff" }}
                        >
                          {shortDate}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          </Card>
        </div>
      </ConfigProvider>
    </App>
  );
}
