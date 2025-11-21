"use client";

import { useEffect, useState, useMemo } from "react";
import { App, Card, Typography, Flex, Tag, ConfigProvider, Spin, Empty, Input, Select, Grid } from "antd";
import { DealsApi } from "@/app/shared/dealsApi";
import { DEAL_STATUS_COLORS, DEAL_STATUS_TEXT, DealStatus } from "@/app/shared/dealsDomain";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

type Deal = {
  uid: string;
  time: string;
  status: DealStatus;
  stars_amount: number;
  price: number;
  telegram_id: string;
  buyer?: string;
};

export default function DealsFeedPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const data = await DealsApi.getDeals();
        setDeals(data || []);
      } catch (e: any) {
        setError(e?.message || "Ошибка загрузки сделок");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!filterText.trim()) return true;
      const q = filterText.trim().toLowerCase();
      const seller = (d.telegram_id || "").toLowerCase();
      const buyer = (d.buyer || "").toLowerCase();
      return seller.includes(q) || buyer.includes(q) || d.uid.toLowerCase().includes(q);
    });
  }, [deals, filterText, statusFilter]);

  const hasData = filteredDeals.length > 0;

  return (
    <App>
      <ConfigProvider
        theme={{
          token: {
            colorText: "#ffffff",
            colorTextSecondary: "#ffffff",
            colorTextHeading: "#ffffff",
          },
          components: {
            Input: {
              colorText: "#000000",
              colorBgContainer: "#ffffff",
            },
            Select: {
              colorText: "#000000",
              colorBgContainer: "#ffffff",
            },
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
            Лента сделок
          </Title>
          <Text>
            Подробный список всех сделок с фильтрами по пользователю и статусу.
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
                <Spin tip="Загрузка сделок..." />
              </div>
            )}

            {!loading && error && (
              <Text style={{ color: "#ffffff" }}>{error}</Text>
            )}

            {!loading && !error && (
              <>
                <Flex
                  gap={isMobile ? 8 : 12}
                  style={{ marginBottom: isMobile ? 12 : 16 }}
                  wrap
                  vertical={isMobile}
                >
                  <Input
                    placeholder="Фильтр по пользователю или UID"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    style={{
                      maxWidth: isMobile ? "100%" : 260,
                      width: isMobile ? "100%" : undefined,
                      backgroundColor: "#ffffff",
                      color: "#000000",
                    }}
                  />
                  <Select
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                    style={{
                      width: isMobile ? "100%" : 200,
                      backgroundColor: "transparent",
                      color: "#000000",
                    }}
                  >
                    <Option value="all" style={{ color: "#000000"}}>Все статусы</Option>
                    <Option value="active" style={{ color: "#000000"}}>Активна</Option>
                    <Option value="pending" style={{ color: "#000000"}}>Ожидает оплаты</Option>
                    <Option value="completed" style={{ color: "#000000"}}>Завершена</Option>
                  </Select>
                </Flex>

                {!hasData && (
                  <Empty
                    description={
                      <Text style={{ color: "#ffffff" }}>
                        Сделок по выбранным фильтрам нет
                      </Text>
                    }
                  />
                )}

                {hasData && (
                  <Flex vertical gap={10}>
                    {filteredDeals.map((d) => (
                      <div
                        key={d.uid}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: "rgba(15,23,42,0.95)",
                          border: "1px solid rgba(148,163,184,0.35)",
                        }}
                      >
                        <Flex justify="space-between" align="center">
                          <div>
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                              UID: {d.uid}
                            </Text>
                            <Text style={{ color: "#ffffff", display: "block" }}>
                              {d.stars_amount} ⭐ за {d.price} ₽
                            </Text>
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                              Продавец: {d.telegram_id || "—"}
                            </Text>
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>
                              Покупатель: {d.buyer || "—"}
                            </Text>
                          </div>

                          <Flex vertical align="end" gap={4}>
                            <Tag color={DEAL_STATUS_COLORS[d.status] || "default"}>
                              {DEAL_STATUS_TEXT[d.status] || d.status}
                            </Tag>
                            <Text style={{ color: "#9ca3af", fontSize: 12 }}>{d.time}</Text>
                          </Flex>
                        </Flex>
                      </div>
                    ))}
                  </Flex>
                )}
              </>
            )}
          </Card>
        </div>
      </ConfigProvider>
    </App>
  );
}
