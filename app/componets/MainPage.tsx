"use client";

import React, { FC, useEffect, useMemo, useState, useCallback } from "react";
import { Card, Flex, Button, Grid } from "antd";
import Title from "antd/es/typography/Title";
import { DealRow } from "./DealCard";
import { Deal, DealStatus } from "../interfaces/interfaces";
import { normalizeDealStatus } from "@/app/shared/dealsDomain";
import { DealsApi } from "@/app/shared/dealsApi";
import { useSSE } from "../hooks/useSSE"; 

const { useBreakpoint } = Grid;

interface MainPageProps {
  className?: string;
}

export const MainPage: FC<MainPageProps> = () => {
  const [filterStatus, setFilterStatus] = useState<DealStatus | "all">("all");
  const [deals, setDeals] = useState<Deal[]>([]);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const fetchDeals = useCallback(async () => {
    try {
      const data = await DealsApi.getDeals();
      setDeals(data);
    } catch (error) {
      console.error("Ошибка при получении сделок:", error);
      setDeals([]);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);


  useSSE("/api/events", (data) => {
    if (data.type === "new_deal") {
      console.log("Новая сделка:", data.deal);
      fetchDeals();
    }
  });

  const filteredDeals = useMemo(() => {
    if (filterStatus === "all") return deals;
    return deals.filter(
      (d) => normalizeDealStatus(d.status as string) === filterStatus
    );
  }, [deals, filterStatus]);

  return (
    <Flex vertical style={{ width: "100%", height: "100%" }}>
      <Card className="glass" style={{ marginBottom: "16px", width: "100%" }}>
        <Flex
          justify={isMobile ? "flex-start" : "space-between"}
          align={isMobile ? "flex-start" : "center"}
          vertical={isMobile}
          style={{ marginBottom: isMobile ? 12 : 16, gap: isMobile ? 8 : 0 }}
        >
          <Title
            level={isMobile ? 4 : 3}
            style={{ margin: 0, color: "var(--foreground)" }}
          >
            Сделки
          </Title>
          <Button.Group
            style={{
              background: "var(--surface)",
              padding: 4,
              display: "flex",
              flexWrap: isMobile ? "wrap" : "nowrap",
              width: isMobile ? "100%" : "auto",
              gap: isMobile ? 4 : 0,
            }}
          >
            <Button
              onClick={() => setFilterStatus("all")}
              type={filterStatus === "all" ? "primary" : "default"}
              ghost
              style={{
                color: "#fff",
                borderColor: "var(--border)",
                flex: isMobile ? 1 : undefined,
              }}
            >
              Все
            </Button>
            <Button
              onClick={() => setFilterStatus("active")}
              type={filterStatus === "active" ? "primary" : "default"}
              ghost
              style={{
                color: "#fff",
                borderColor: "var(--border)",
                flex: isMobile ? 1 : undefined,
              }}
            >
              Активные
            </Button>
            <Button
              onClick={() => setFilterStatus("pending")}
              type={filterStatus === "pending" ? "primary" : "default"}
              ghost
              style={{
                color: "#fff",
                borderColor: "var(--border)",
                flex: isMobile ? 1 : undefined,
              }}
            >
              Ожидают оплаты
            </Button>
            <Button
              onClick={() => setFilterStatus("completed")}
              type={filterStatus === "completed" ? "primary" : "default"}
              ghost
              style={{
                color: "#fff",
                borderColor: "var(--border)",
                flex: isMobile ? 1 : undefined,
              }}
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
