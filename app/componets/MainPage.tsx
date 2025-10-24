"use client";
import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { Card, Flex, Button } from "antd";
import Title from "antd/es/typography/Title";
import { DealRow } from "./DealCard";
import { Deal, DealStatus } from "../interfaces/interfaces";
import { useSSE } from "../hooks/useSSE"; 

interface MainPageProps {
  className?: string;
}

export const MainPage: FC<MainPageProps> = () => {
  const [filterStatus, setFilterStatus] = useState<DealStatus | "all">("all");
  const [deals, setDeals] = useState<Deal[]>([]);

  const fetchDeals = useCallback(async () => {
    try {
      const response = await fetch("/api/getDeals", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.error("Не удалось получить сделки");
        setDeals([]);
        return;
      }

      const data = await response.json();
      setDeals(data.deals);
    } catch (error) {
      console.error("Ошибка при получении сделок:", error);
      setDeals([]);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // 👇 используем устойчивый SSE-хук
  useSSE("/api/events", (data) => {
    if (data.type === "new_deal") {
      console.log("Новая сделка:", data.deal);
      fetchDeals();
    }
  });

  const normalizeStatus = (status: string): DealStatus => {
    const s = (status || "").toString().trim().toLowerCase();
    if (["active", "in_progress", "open"].includes(s)) return "active";
    if (["pending", "awaiting", "awaiting_payment"].includes(s))
      return "pending";
    return "completed";
  };

  const filteredDeals = useMemo(() => {
    if (filterStatus === "all") return deals;
    return deals.filter(
      (d) => normalizeStatus(d.status as string) === filterStatus
    );
  }, [deals, filterStatus]);

  return (
    <Flex vertical style={{ width: "100%", height: "100%" }}>
      <Card className="glass" style={{ marginBottom: "16px", width: "100%" }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: "16px" }}>
          <Title level={3} style={{ margin: 0, color: "var(--foreground)" }}>
            Сделки:
          </Title>
          <Button.Group
            style={{
              background: "var(--surface)",
              padding: 4,
            }}
          >
            <Button
              onClick={() => setFilterStatus("all")}
              type={filterStatus === "all" ? "primary" : "default"}
              ghost
              style={{ color: "#fff", borderColor: "var(--border)" }}
            >
              Все
            </Button>
            <Button
              onClick={() => setFilterStatus("active")}
              type={filterStatus === "active" ? "primary" : "default"}
              ghost
              style={{ color: "#fff", borderColor: "var(--border)" }}
            >
              Активные
            </Button>
            <Button
              onClick={() => setFilterStatus("pending")}
              type={filterStatus === "pending" ? "primary" : "default"}
              ghost
              style={{ color: "#fff", borderColor: "var(--border)" }}
            >
              Ожидают оплаты
            </Button>
            <Button
              onClick={() => setFilterStatus("completed")}
              type={filterStatus === "completed" ? "primary" : "default"}
              ghost
              style={{ color: "#fff", borderColor: "var(--border)" }}
            >
              Завершённые
            </Button>
          </Button.Group>
        </Flex>

        <Flex vertical style={{ width: "100%" }}>
          {filteredDeals.map((deal) => (
            <DealRow
              key={deal.uid}
              uid={deal.uid}
              time={deal.time}
              status={deal.status}
              stars_amount={deal.stars_amount}
              telegram_id={deal.telegram_id}
              price={deal.price}
              buyer={deal.buyer || ""}
            />
          ))}
        </Flex>
      </Card>
    </Flex>
  );
};
