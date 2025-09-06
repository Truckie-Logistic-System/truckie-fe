import React from "react";
import { MainLayout } from "../../../components/layout";
import { OrdersHeader, OrdersContent } from "../components";

// Mock data - replace with actual API call
const mockOrders = [
  {
    id: "ORD-001",
    status: "delivered",
    pickup: "123 Nguyễn Huệ, Q1, TP.HCM",
    delivery: "456 Lê Lợi, Q3, TP.HCM",
    date: "2024-03-15",
    price: "250,000 VNĐ",
  },
  {
    id: "ORD-002",
    status: "in_transit",
    pickup: "789 Trần Hưng Đạo, Q5, TP.HCM",
    delivery: "101 Võ Văn Tần, Q3, TP.HCM",
    date: "2024-03-16",
    price: "180,000 VNĐ",
  },
  {
    id: "ORD-003",
    status: "pending",
    pickup: "202 Pasteur, Q3, TP.HCM",
    delivery: "303 Cách Mạng Tháng 8, Q10, TP.HCM",
    date: "2024-03-17",
    price: "320,000 VNĐ",
  },
];

const OrdersList: React.FC = () => {
  const orders = mockOrders;

  return (
    <MainLayout>
      <OrdersHeader />
      <OrdersContent orders={orders} />
    </MainLayout>
  );
};

export default OrdersList;
