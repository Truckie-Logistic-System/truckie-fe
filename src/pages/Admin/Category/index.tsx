import React, { useState, useRef } from "react";
import { App } from "antd";
import { TagsOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import type { Category, CategoryPricing } from "../../../models";
import { categoryService } from "../../../services/category";
import CategoryCombinedList from "./components/CategoryCombinedList";
import type { CategoryCombinedListRef } from "./components/CategoryCombinedList";
import EntityManagementLayout from "../../../components/features/admin/EntityManagementLayout";

const CategoryManagement: React.FC = () => {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState("");
  const categoryListRef = useRef<CategoryCombinedListRef>(null);

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
    isFetching: isCategoriesFetching,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await categoryService.getCategories();
      console.log("Categories API response:", result);
      return result;
    },
  });

  // Fetch category pricing details
  const {
    data: categoryPricingData,
    isLoading: isCategoryPricingLoading,
    refetch: refetchCategoryPricing,
    isFetching: isCategoryPricingFetching,
  } = useQuery({
    queryKey: ["categoryPricing"],
    queryFn: async () => {
      const result = await categoryService.getCategoryPricingDetails();
      console.log("Category Pricing API response:", result);
      return result;
    },
  });

  const handleRefresh = () => {
    refetchCategories();
    refetchCategoryPricing();
  };

  // Filter categories based on search text
  const filteredCategories =
    categoriesData?.data?.filter((category) => {
      if (!searchText) return true;
      const searchLower = searchText.toLowerCase();
      return (
        category.categoryName.toLowerCase().includes(searchLower) ||
        (category.description &&
          category.description.toLowerCase().includes(searchLower))
      );
    }) || [];

  // Filter category pricing based on search text
  const filteredCategoryPricing =
    categoryPricingData?.data?.filter((pricing) => {
      if (!searchText) return true;
      const searchLower = searchText.toLowerCase();
      return pricing.categoryResponse.categoryName
        .toLowerCase()
        .includes(searchLower);
    }) || [];

  if (categoriesError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64">
        <p className="text-red-500 text-xl mb-4">
          Đã xảy ra lỗi khi tải dữ liệu
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => refetchCategories()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const isLoading = isCategoriesLoading || isCategoryPricingLoading;
  const isFetching = isCategoriesFetching || isCategoryPricingFetching;

  return (
    <EntityManagementLayout
      title="Quản lý loại hàng"
      icon={<TagsOutlined />}
      description="Quản lý thông tin các loại hàng và giá loại hàng trong hệ thống"
      addButtonText="Thêm loại hàng mới"
      addButtonIcon={<PlusOutlined />}
      onAddClick={() => {
        if (categoryListRef.current) {
          categoryListRef.current.showAddModal();
        }
      }}
      searchText={searchText}
      onSearchChange={setSearchText}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      isFetching={isFetching}
      totalCount={categoriesData?.data?.length || 0}
      activeCount={categoriesData?.data?.length || 0}
      bannedCount={0}
      tableTitle="Danh sách loại hàng và giá loại hàng"
      tableComponent={
        <CategoryCombinedList
          ref={categoryListRef}
          categories={filteredCategories}
          categoryPricings={filteredCategoryPricing}
          loading={isLoading}
          onRefreshCategories={refetchCategories}
          onRefreshPricing={refetchCategoryPricing}
        />
      }
      modalComponent={null}
    />
  );
};

export default CategoryManagement;
