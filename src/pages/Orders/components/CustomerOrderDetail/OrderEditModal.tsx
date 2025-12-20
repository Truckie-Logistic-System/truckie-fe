import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Steps,
  Button,
  message,
  Spin,
  Divider,
  Space,
  Typography,
  Row,
  Col,
  Input,
  Select,
  Card,
  Alert,
  Radio,
  InputNumber,
  Checkbox,
  Table,
  Tooltip,
  Tag,
  Progress,
} from 'antd';
import {
  EditOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  DollarOutlined,
  CalendarOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CustomerOrderDetail } from '../../../../models/Order';
import type {
  ComprehensiveOrderUpdateRequest,
  UpdateOrderInfoRequest,
  UpdateOrderDetailInfoRequest,
} from '../../../../services/order/types';
import type { Address } from '../../../../models/Address';
import type { Category } from '../../../../models/Category';
import type { OrderSize } from '../../../../models/OrderSize';
import orderService from '../../../../services/order/orderService';
import addressService from '../../../../services/address/addressService';
import { categoryService } from '../../../../services/category/categoryService';
import orderSizeService from '../../../../services/order-size/orderSizeService';
import { formatCurrency } from '../../../../utils/formatters';
import { getWeightUnits } from '../../../../config/weightUnits';
import { getCategoryDisplayName } from '../../../../models/CategoryName';
import { convertWeightToTons, calculateTotalWeight, type WeightUnit } from '../../../../utils/weightUtils';
import DateSelectGroup from '../../../../components/common/DateSelectGroup';
import AddressModal from '../../../../components/common/AddressModal';
import { useInsuranceRates } from '../../../../hooks';
import StipulationModal from '../StipulationModal';
import ReceiverSuggestions from '../CreateOrderSteps/ReceiverSuggestions';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface OrderEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  orderData: CustomerOrderDetail;
}

interface PackageDetail {
  id?: string;
  quantity: number;
  weight: number;
  unit: string;
  orderSizeId: string;
  description: string;
  declaredValue: number;
  toDelete: boolean;
  weightError?: string; // Inline error message for weight validation
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  orderData,
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [packageDetails, setPackageDetails] = useState<PackageDetail[]>([]);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  // Store orderInfo from step 1 to use for submission
  const [orderInfoData, setOrderInfoData] = useState<any>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressType, setAddressType] = useState<boolean>(true);
  const [stipulationModalVisible, setStipulationModalVisible] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<number[]>([]);
  const [showGrouped, setShowGrouped] = useState(true);
  
  const weightUnits = getWeightUnits();
  const { rates, normalRatePercent, fragileRatePercent } = useInsuranceRates();

  // Load initial data when modal opens
  useEffect(() => {
    if (visible && orderData) {
      loadMasterData();
    }
  }, [visible, orderData]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [addressRes, categoryRes, orderSizeRes] = await Promise.all([
        addressService.getMyAddresses(),
        categoryService.getCategories(),
        orderSizeService.getAllOrderSizes(),
      ]);
      
      setAddresses(addressRes || []);
      
      const categoriesArray = Array.isArray(categoryRes) 
        ? categoryRes 
        : (categoryRes as any)?.data || [];
      setCategories(categoriesArray);
      
      setOrderSizes(orderSizeRes || []);
      
      console.log('✅ Loaded master data:', {
        addresses: addressRes?.length,
        categories: categoriesArray?.length,
        orderSizes: orderSizeRes?.length
      });

      // Prefill form data AFTER master data is loaded, pass loaded data directly
      // Use setTimeout to ensure form is fully mounted before setting values
      setTimeout(() => {
        prefillFormData(addressRes || [], categoriesArray);
      }, 200);
    } catch (error) {
      console.error('Error loading master data:', error);
      message.error('Không thể tải dữ liệu cần thiết');
    } finally {
      setLoading(false);
    }
  };

  const prefillFormData = (loadedAddresses: Address[], loadedCategories: Category[]) => {
    console.log('🔍 OrderEditModal - Prefilling data:', orderData);
    console.log('🔍 Loaded addresses:', loadedAddresses?.length);
    console.log('🔍 Loaded categories:', loadedCategories?.length);
    
    if (!orderData) {
      console.warn('⚠️ OrderEditModal - No orderData provided');
      return;
    }
    
    if (!loadedAddresses || loadedAddresses.length === 0) {
      console.warn('⚠️ No addresses loaded yet');
      return;
    }

    // Use IDs directly from backend response (no need to match strings)
    const pickupAddressId = (orderData as any).pickupAddressId || '';
    const deliveryAddressId = (orderData as any).deliveryAddressId || '';
    
    console.log('📍 Pickup address ID from backend:', pickupAddressId);
    console.log('📍 Delivery address ID from backend:', deliveryAddressId);

    // Get estimateStartTime from first orderDetail (backend stores it at detail level)
    const firstOrderDetail = orderData.orderDetails?.[0];
    const estimateStartTime = firstOrderDetail?.estimatedStartTime || firstOrderDetail?.createdAt || orderData.createdAt;
    
    // Use category ID directly from backend response
    const categoryId = (orderData as any).categoryId || '';
    console.log('📂 Category ID from backend:', categoryId);
    
    const formValues = {
      receiverName: orderData.receiverName || '',
      receiverPhone: orderData.receiverPhone || '',
      receiverIdentity: orderData.receiverIdentity || '',
      pickupAddressId: pickupAddressId,
      deliveryAddressId: deliveryAddressId,
      categoryId: categoryId,
      notes: orderData.notes || '',
      packageDescription: orderData.packageDescription || '',
      estimateStartTime: estimateStartTime ? dayjs(estimateStartTime) : null,
    };

    console.log('📝 Setting form values:', formValues);
    console.log('📝 Pickup Address ID:', pickupAddressId);
    console.log('📝 Delivery Address ID:', deliveryAddressId);
    console.log('📝 Category ID:', categoryId);
    form.setFieldsValue(formValues);
    
    // Verify values were set
    setTimeout(() => {
      const currentValues = form.getFieldsValue();
      console.log('✅ Form values AFTER setFieldsValue:', currentValues);
      console.log('✅ Pickup Address ID in form:', currentValues.pickupAddressId);
      console.log('✅ Delivery Address ID in form:', currentValues.deliveryAddressId);
      console.log('✅ Category ID in form:', currentValues.categoryId);
    }, 100);

    // Pre-fill package details
    if (orderData.orderDetails && orderData.orderDetails.length > 0) {
      const details: PackageDetail[] = orderData.orderDetails.map((detail: any) => ({
        id: detail.id,
        quantity: 1,
        weight: detail.weightBaseUnit || detail.weight || 0,
        unit: detail.unit || 'Kí',
        orderSizeId: detail.orderSize?.id || '',
        description: detail.description || '',
        declaredValue: detail.declaredValue || 0,  // ✅ Use each package's own declared value
        toDelete: false,
      }));
      
      setPackageDetails(details);
      console.log('📦 Package details set:', details);
    }

    setHasInsurance(orderData.hasInsurance || false);
    form.setFieldValue('hasInsurance', orderData.hasInsurance || false);
    console.log('🛡️ Insurance status:', orderData.hasInsurance);
  };

  const addPackageDetail = () => {
    setPackageDetails([...packageDetails, {
      // ✅ CRITICAL: No id field - new package will be created by backend
      quantity: 1,
      weight: 0,
      unit: 'Kí',
      orderSizeId: '',
      description: '',
      declaredValue: hasInsurance ? 0 : 0, // Initialize based on insurance status
      toDelete: false,
      weightError: undefined, // Initialize without error
    }]);
    console.log('📦 Added new empty package - NO ID');
  };

  // Helper: Get group key for package
  const getPackageGroupKey = (pkg: PackageDetail) => {
    return `${pkg.weight}-${pkg.unit}-${pkg.orderSizeId}-${pkg.description}`;
  };

  // Helper: Group similar packages
  const groupPackages = () => {
    const groups: { [key: string]: { packages: number[], quantity: number, data: PackageDetail } } = {};
    
    packageDetails.forEach((pkg, index) => {
      if (pkg.toDelete) return; // Skip deleted packages
      
      const key = getPackageGroupKey(pkg);
      if (!groups[key]) {
        groups[key] = { packages: [], quantity: 0, data: pkg };
      }
      groups[key].packages.push(index);
      groups[key].quantity++;
    });
    
    return Object.values(groups);
  };

  const removePackageDetail = (index: number) => {
    // Prevent deleting the last remaining package
    const activePackages = packageDetails.filter(p => !p.toDelete);
    if (activePackages.length <= 1) {
      message.error('Không thể xóa kiện hàng duy nhất. Đơn hàng phải có ít nhất 1 kiện hàng.');
      return;
    }
    
    const pkg = packageDetails[index];
    if (pkg.id) {
      const updated = [...packageDetails];
      updated[index] = { ...pkg, toDelete: true };
      setPackageDetails(updated);
    } else {
      setPackageDetails(packageDetails.filter((_, i) => i !== index));
    }
  };

  const bulkDeletePackages = () => {
    if (selectedPackages.length === 0) {
      message.warning('Vui lòng chọn ít nhất một kiện hàng để xóa');
      return;
    }

    const activePackages = packageDetails.filter(p => !p.toDelete);
    if (selectedPackages.length >= activePackages.length) {
      message.error('Không thể xóa tất cả kiện hàng. Đơn hàng phải có ít nhất 1 kiện hàng.');
      return;
    }

    const updated = [...packageDetails];
    selectedPackages.forEach(index => {
      const pkg = updated[index];
      if (pkg.id) {
        updated[index] = { ...pkg, toDelete: true };
      }
    });

    const filtered = updated.filter((pkg, index) => 
      !selectedPackages.includes(index) || pkg.id
    );

    setPackageDetails(filtered);
    setSelectedPackages([]);
    message.success(`Đã xóa ${selectedPackages.length} kiện hàng`);
  };

  const toggleSelectPackage = (index: number) => {
    setSelectedPackages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllPackages = () => {
    const activeIndices = packageDetails
      .map((pkg, index) => !pkg.toDelete ? index : -1)
      .filter(i => i !== -1);
    setSelectedPackages(activeIndices);
  };

  const deselectAllPackages = () => {
    setSelectedPackages([]);
  };

  const updatePackageDetail = (index: number, field: keyof PackageDetail, value: any) => {
    // Use functional update to ensure we always work with latest state
    setPackageDetails(prevDetails => {
      const updated = [...prevDetails];
      const pkg = updated[index];
      
      // Handle quantity change - create/delete order details
      if (field === 'quantity') {
        // In grouped view, need to count total packages with same group key
        const groupKey = getPackageGroupKey(pkg);
        const groupPackages = updated.filter((p, i) => 
          !p.toDelete && getPackageGroupKey(p) === groupKey
        );
        const oldQuantity = groupPackages.length; // ✅ Count actual group size
        const newQuantity = value || 1;
        
        console.log(`📦 Quantity change - Group has ${groupPackages.length} packages, changing to ${newQuantity}`);
        
        if (newQuantity > oldQuantity) {
          // Increase quantity - duplicate this package WITH CURRENT VALUES
          const diff = newQuantity - oldQuantity;
          const newPackages = [];
          for (let i = 0; i < diff; i++) {
            // ✅ CRITICAL: Explicitly exclude id to prevent any cloning
            const { id, ...pkgWithoutId } = pkg;
            newPackages.push({
              ...pkgWithoutId, // Clone WITHOUT id
              quantity: 1,
              toDelete: false,
            });
            console.log(`📦 Created new package clone ${i + 1}/${diff} - NO ID (will be created by backend)`);
          }
          // Update original to quantity 1
          updated[index] = { ...pkg, quantity: 1 };
          console.log(`📦 Original package ${index} - ID preserved:`, pkg.id);
          // Insert duplicates after current package
          updated.splice(index + 1, 0, ...newPackages);
        } else if (newQuantity < oldQuantity) {
          // Decrease quantity - find and mark similar packages for deletion
          const groupKey = `${pkg.weight}-${pkg.unit}-${pkg.orderSizeId}-${pkg.description}`;
          let deleted = 0;
          const diff = oldQuantity - newQuantity;
          
          console.log(`📦 Need to delete ${diff} packages from group`);
          
          for (let i = updated.length - 1; i >= 0 && deleted < diff; i--) {
            const p = updated[i];
            const pKey = `${p.weight}-${p.unit}-${p.orderSizeId}-${p.description}`;
            if (pKey === groupKey && i !== index && !p.toDelete) {
              if (p.id) {
                updated[i] = { ...p, toDelete: true };
                console.log(`📦 Marked package ${i} for deletion (has ID)`);
              } else {
                updated.splice(i, 1);
                console.log(`📦 Removed package ${i} from array (no ID)`);
              }
              deleted++;
            }
          }
          
          // ✅ Keep original package quantity as 1 (each package is always quantity 1)
          updated[index] = { ...pkg, quantity: 1 };
          console.log(`📦 Deleted ${deleted} packages, ${newQuantity} packages remaining in group`);
        }
        
        console.log(`📦 Quantity changed from ${oldQuantity} to ${newQuantity}`);
        return updated;
      }
      
      // Regular field update
      // If in grouped view, update ALL packages in the same group
      if (showGrouped && field !== 'id') {
        // Get the group key BEFORE updating
        const oldGroupKey = getPackageGroupKey(pkg);
        
        // Update the field for the target package first
        updated[index] = { ...updated[index], [field]: value };
        
        // Find and update all other packages with the same old group key
        // IMPORTANT: Only update the specific field, preserve each package's unique ID
        for (let i = 0; i < updated.length; i++) {
          if (i !== index && !updated[i].toDelete) {
            const pKey = getPackageGroupKey(updated[i]);
            if (pKey === oldGroupKey) {
              // ✅ Only update the specific field, NOT spread entire object
              updated[i] = { 
                ...updated[i], 
                [field]: value  // Only this field changes, id stays intact
              };
              console.log(`📦 Updated grouped package ${i} - ${field}:`, value, 'ID preserved:', updated[i].id);
            }
          }
        }
      } else {
        // Individual view - only update the single package
        updated[index] = { ...updated[index], [field]: value };
      }
      
      // Real-time validation for weight - set inline error instead of popup
      if (field === 'weight' || field === 'unit') {
        // Validate current package
        const weightInTons = convertWeightToTons(updated[index].weight, updated[index].unit as WeightUnit);
        
        if (updated[index].weight > 0) {
          if (weightInTons < 0.01) {
            updated[index].weightError = `Tối thiểu 0.01 tấn (10 kg). Hiện tại: ${weightInTons.toFixed(3)} tấn`;
          } else if (weightInTons > 10) {
            updated[index].weightError = `Tối đa 10 tấn. Hiện tại: ${weightInTons.toFixed(3)} tấn`;
          } else {
            updated[index].weightError = undefined; // Clear error if valid
          }
        } else {
          updated[index].weightError = undefined;
        }
        
        // If in grouped view, validate ALL packages in the same group
        if (showGrouped) {
          const groupKey = getPackageGroupKey(updated[index]);
          for (let i = 0; i < updated.length; i++) {
            if (i !== index && !updated[i].toDelete && getPackageGroupKey(updated[i]) === groupKey) {
              const pkgWeightInTons = convertWeightToTons(updated[i].weight, updated[i].unit as WeightUnit);
              
              if (updated[i].weight > 0) {
                if (pkgWeightInTons < 0.01) {
                  updated[i].weightError = `Tối thiểu 0.01 tấn (10 kg). Hiện tại: ${pkgWeightInTons.toFixed(3)} tấn`;
                } else if (pkgWeightInTons > 10) {
                  updated[i].weightError = `Tối đa 10 tấn. Hiện tại: ${pkgWeightInTons.toFixed(3)} tấn`;
                } else {
                  updated[i].weightError = undefined;
                }
              } else {
                updated[i].weightError = undefined;
              }
            }
          }
        }
      }
      
      console.log(`📦 Updated package ${index} - ${field}:`, value);
      console.log(`📦 New package state:`, updated[index]);
      return updated;
    });
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields([
          'receiverName',
          'receiverPhone',
          'receiverIdentity',
          'pickupAddressId',
          'deliveryAddressId',
          'notes',
          'packageDescription',
          'estimateStartTime',
        ]);
        
        // Capture and store form values from step 1
        const values = form.getFieldsValue();
        setOrderInfoData({
          notes: values.notes || 'Không có ghi chú',
          receiverName: values.receiverName,
          receiverPhone: values.receiverPhone,
          receiverIdentity: values.receiverIdentity,
          packageDescription: values.packageDescription || 'Không có mô tả',
          estimateStartTime: values.estimateStartTime 
            ? dayjs(values.estimateStartTime).format('YYYY-MM-DDTHH:mm:ss')
            : (orderData?.createdAt ? dayjs(orderData.createdAt).format('YYYY-MM-DDTHH:mm:ss') : ''),
          deliveryAddressId: values.deliveryAddressId || (orderData as any).deliveryAddressId,
          pickupAddressId: values.pickupAddressId || (orderData as any).pickupAddressId,
        });
        console.log('💾 Saved orderInfo from step 1:', {
          deliveryAddressId: values.deliveryAddressId || (orderData as any).deliveryAddressId,
          pickupAddressId: values.pickupAddressId || (orderData as any).pickupAddressId,
        });
      } else if (currentStep === 1) {
        await form.validateFields(['categoryId', 'hasInsurance']);
        
        const activePackages = packageDetails.filter(p => !p.toDelete);
        if (activePackages.length === 0) {
          message.error('Vui lòng thêm ít nhất một kiện hàng');
          return;
        }

        for (const pkg of activePackages) {
          if (!pkg.weight || pkg.weight <= 0) {
            message.error('Vui lòng nhập trọng lượng cho tất cả kiện hàng');
            return;
          }
          
          // Check inline weight error first (more accurate)
          if (pkg.weightError) {
            message.error(`Lỗi trọng lượng: ${pkg.weightError}`);
            return;
          }
          
          // Double-check weight validation
          const weightInTons = convertWeightToTons(pkg.weight, pkg.unit as WeightUnit);
          if (weightInTons < 0.01) {
            message.error(`Trọng lượng kiện hàng phải tối thiểu 0.01 tấn (10 kg). Kiện "${pkg.description || 'Không có mô tả'}" chỉ có ${weightInTons.toFixed(3)} tấn (${pkg.weight} ${pkg.unit})`);
            return;
          }
          if (weightInTons > 10) {
            message.error(`Trọng lượng kiện hàng không được vượt quá 10 tấn. Kiện "${pkg.description || 'Không có mô tả'}" có ${weightInTons.toFixed(3)} tấn (${pkg.weight} ${pkg.unit})`);
            return;
          }
          
          if (!pkg.orderSizeId) {
            message.error('Vui lòng chọn kích thước cho tất cả kiện hàng');
            return;
          }
          if (!pkg.description) {
            message.error('Vui lòng nhập mô tả cho tất cả kiện hàng');
            return;
          }
          if (hasInsurance && (!pkg.declaredValue || pkg.declaredValue <= 0)) {
            message.error('Vui lòng nhập giá trị khai báo cho tất cả kiện hàng khi có bảo hiểm');
            return;
          }
        }

        // Validate total weight
        const totalWeight = calculateTotalWeight(activePackages.map(pkg => ({
          weight: pkg.weight,
          unit: pkg.unit,
          quantity: pkg.quantity,
        })));

        if (totalWeight < 0.01) {
          message.error('Tổng khối lượng phải từ 0.01 tấn trở lên');
          return;
        }
        if (totalWeight > 50) {
          message.error('Tổng khối lượng không được vượt quá 50 tấn');
          return;
        }
        
        // Capture and save categoryId from step 2
        const values = form.getFieldsValue();
        setOrderInfoData((prev: any) => ({
          ...prev,
          categoryId: values.categoryId,
        }));
        console.log('💾 Saved categoryId from step 2:', values.categoryId);
      }
      
      setCurrentStep(currentStep + 1);
      
      // When moving to step 2 (Package details), ensure categoryId is set
      if (currentStep === 0 && orderData?.categoryName && categories.length > 0) {
        setTimeout(() => {
          const matchedCategory = categories.find(
            (cat: Category) => cat.categoryName === orderData.categoryName
          );
          if (matchedCategory) {
            form.setFieldValue('categoryId', matchedCategory.id);
            console.log('📂 Category set when entering step 2:', matchedCategory.categoryName, matchedCategory.id);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setStipulationModalVisible(true);
  };

  const handleStipulationAccepted = async () => {
    try {
      setLoading(true);
      setStipulationModalVisible(false);
      
      // Use stored orderInfo (captured from step 1 and step 2)
      const orderInfo: UpdateOrderInfoRequest = {
        ...orderInfoData,
        hasInsurance: hasInsurance,
      };
      
      console.log('📤 Submit - OrderInfo (from stored state):', orderInfo);
      console.log('📤 Submit - PackageDetails state (ALL):', packageDetails);
      console.log('📤 Submit - PackageDetails count:', packageDetails.length);
      console.log('📤 Submit - Active packages (not deleted):', packageDetails.filter(p => !p.toDelete));

      // Validate no duplicate IDs
      const existingIds = packageDetails.filter(p => p.id && !p.toDelete).map(p => p.id);
      const uniqueIds = new Set(existingIds);
      if (existingIds.length !== uniqueIds.size) {
        console.error('❌ CRITICAL: Duplicate orderDetailIds detected!', existingIds);
        const duplicates = existingIds.filter((id, index) => existingIds.indexOf(id) !== index);
        console.error('❌ Duplicate IDs:', duplicates);
        message.error('Lỗi: Phát hiện dữ liệu trùng lặp. Vui lòng refresh trang và thử lại.');
        setLoading(false);
        return;
      }
      console.log('✅ No duplicate IDs detected');
      
      // Additional validation: Ensure new packages have NO ID
      const newPackagesWithId = packageDetails.filter(p => !p.toDelete && p.id === undefined);
      const existingPackagesWithId = packageDetails.filter(p => !p.toDelete && p.id !== undefined);
      console.log(`📊 Packages breakdown: ${existingPackagesWithId.length} existing (with ID), ${newPackagesWithId.length} new (no ID)`);
      
      // Log each package for debugging
      packageDetails.forEach((pkg, idx) => {
        if (!pkg.toDelete) {
          console.log(`📦 Package ${idx}: ID=${pkg.id || 'NEW'}, weight=${pkg.weight}, unit=${pkg.unit}, desc=${pkg.description}`);
        }
      });

      const orderDetails: UpdateOrderDetailInfoRequest[] = packageDetails.map(pkg => {
        console.log('📤 Mapping package detail:', {
          id: pkg.id,
          weight: pkg.weight,
          unit: pkg.unit,
          description: pkg.description,
          toDelete: pkg.toDelete
        });
        
        // Convert weight to tons for backend (backend stores in weightTons field)
        const weightInTons = convertWeightToTons(pkg.weight, pkg.unit as WeightUnit);
        
        return {
          orderDetailId: pkg.id,
          quantity: pkg.quantity || 1,  // Send quantity
          weight: weightInTons,  // Send weight in tons
          unit: pkg.unit,
          description: pkg.description,
          orderSizeId: pkg.orderSizeId,
          declaredValue: pkg.declaredValue,
          toDelete: pkg.toDelete || false,
        };
      });

      const updateRequest: ComprehensiveOrderUpdateRequest = {
        orderId: orderData.id,
        orderInfo,
        orderDetails,
      };
      
      console.log('📤 Submit - Full Request:', JSON.stringify(updateRequest, null, 2));
      console.log('📤 Submit - Order Details:', orderDetails);

      await orderService.updateOrderComprehensive(updateRequest);
      message.success('Cập nhật đơn hàng thành công!');
      
      // Refresh data BEFORE closing modal to ensure UI updates
      await onSuccess();
      
      // Close modal after data is refreshed
      handleClose();
    } catch (error: any) {
      console.error('Error updating order:', error);
      message.error(error?.response?.data?.message || 'Không thể cập nhật đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setPackageDetails([]);
    setHasInsurance(false);
    setSelectedPackages([]);
    setShowGrouped(true);
    setOrderInfoData(null);
    form.resetFields();
    onCancel();
  };

  const handleAddressAdded = async () => {
    await loadMasterData();
    setAddressModalVisible(false);
    setEditingAddress(null);
  };

  const handleReceiverSuggestionSelect = async (orderId: string) => {
    try {
      const selectedOrder = await orderService.getOrderById(orderId);
      if (selectedOrder) {
        // Only fill fields that exist in Order type
        form.setFieldsValue({
          receiverName: selectedOrder.receiverName,
          receiverPhone: selectedOrder.receiverPhone,
        });
        message.success('Đã điền thông tin người nhận từ đơn hàng gần đây');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      message.error('Không thể tải thông tin người nhận');
    }
  };

  const renderBasicInfoStep = () => {
    const pickupAddresses = addresses.filter(a => a.addressType === true);
    const deliveryAddresses = addresses.filter(a => a.addressType === false);

    return (
      <div className="space-y-4">
        {/* Khách hàng thân quen - nằm trên cùng */}
        <ReceiverSuggestions onSelect={handleReceiverSuggestionSelect} />
        
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <div className="bg-gray-50 p-4 rounded-lg h-full">
              <Title level={5} className="mb-4">Thông tin người nhận</Title>

              <Form.Item
                name="receiverName"
                label="Tên người nhận"
                rules={[{ required: true, message: 'Vui lòng nhập tên người nhận!' }]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="Nhập tên người nhận" />
              </Form.Item>

              <Form.Item
                name="receiverPhone"
                label="Số điện thoại người nhận"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số!' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="0123456789" />
              </Form.Item>

              <Form.Item
                name="receiverIdentity"
                label="CMND/CCCD người nhận"
                rules={[
                  { required: true, message: 'Vui lòng nhập CMND/CCCD!' },
                  { pattern: /^[0-9]{9,12}$/, message: 'CMND/CCCD phải có 9-12 chữ số!' }
                ]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="Nhập CMND/CCCD" />
              </Form.Item>

              <Form.Item
                name="packageDescription"
                label="Mô tả đơn hàng"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả đơn hàng!' }]}
              >
                <TextArea rows={4} placeholder="Mô tả chi tiết về đơn hàng" />
              </Form.Item>

              <Form.Item
                name="estimateStartTime"
                label="Thời gian lấy hàng dự kiến"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian nhận hàng!' }]}
                tooltip="Thời gian lấy hàng phải cách thời điểm hiện tại ít nhất 2 ngày để đảm bảo đủ thời gian chuẩn bị"
              >
                <DateSelectGroup minDate={dayjs().add(2, 'day')} mode="delivery" showTime={false} />
              </Form.Item>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="bg-gray-50 p-4 rounded-lg h-full">
              <Title level={5} className="mb-4">Thông tin địa chỉ</Title>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Text strong>Địa chỉ lấy hàng</Text>
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setAddressType(true);
                      setAddressModalVisible(true);
                    }}
                  >
                    Thêm địa chỉ mới
                  </Button>
                </div>

                <Form.Item
                  name="pickupAddressId"
                  rules={[{ required: true, message: 'Vui lòng chọn địa chỉ lấy hàng!' }]}
                >
                  <Select placeholder="Chọn địa chỉ lấy hàng">
                    {pickupAddresses.map((addr) => (
                      <Option key={addr.id} value={addr.id}>
                        {addr.street}, {addr.ward}, {addr.province}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Text strong>Địa chỉ giao hàng</Text>
                  <Button
                    type="link"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setAddressType(false);
                      setAddressModalVisible(true);
                    }}
                  >
                    Thêm địa chỉ mới
                  </Button>
                </div>

                <Form.Item
                  name="deliveryAddressId"
                  rules={[{ required: true, message: 'Vui lòng chọn địa chỉ giao hàng!' }]}
                >
                  <Select placeholder="Chọn địa chỉ giao hàng">
                    {deliveryAddresses.map((addr) => (
                      <Option key={addr.id} value={addr.id}>
                        {addr.street}, {addr.ward}, {addr.province}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <Form.Item
                name="notes"
                label="Ghi chú"
              >
                <TextArea rows={4} placeholder="Nhập ghi chú cho đơn hàng..." />
              </Form.Item>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const renderPackageInfoStep = () => {
    const activePackages = packageDetails.filter(p => !p.toDelete);
    const totalWeight = calculateTotalWeight(activePackages.map(pkg => ({
      weight: pkg.weight,
      unit: pkg.unit,
      quantity: pkg.quantity,
    })));

    const isUnderMin = totalWeight < 0.01;
    const isOverMax = totalWeight > 50;
    const isValid = totalWeight >= 0.01 && totalWeight <= 50;

    // Calculate insurance fee
    const totalDeclaredValue = activePackages.reduce((sum, pkg) => sum + (pkg.declaredValue * pkg.quantity), 0);
    const insuranceRate = rates.normalRate;
    const estimatedInsuranceFee = hasInsurance ? Math.round(totalDeclaredValue * insuranceRate) : 0;

    return (
      <div className="space-y-4">
        <Alert
          message="Quy định về phân loại hàng hóa"
          description="Mỗi đơn hàng chỉ được đăng ký cho một loại hàng hóa duy nhất. Vui lòng lựa chọn loại hàng phù hợp với toàn bộ kiện hàng trong đơn hàng của bạn."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="categoryId"
          label="Loại hàng hóa"
          rules={[{ required: true, message: 'Vui lòng chọn loại hàng hóa!' }]}
        >
          <Radio.Group>
            <Row gutter={[16, 8]}>
              {categories.map((category) => (
                <Col key={category.id} span={24}>
                  <Radio value={category.id}>
                    <Text>{getCategoryDisplayName(category.categoryName)}</Text>
                  </Radio>
                </Col>
              ))}
            </Row>
          </Radio.Group>
        </Form.Item>

        <Divider />

        <div className="flex justify-between items-center mb-4">
          <Title level={5}>
            Danh sách kiện hàng
            <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
              (Tổng: {activePackages.length} kiện)
            </span>
          </Title>
          <div className="flex gap-2">
            <Button
              type="default"
              size="small"
              onClick={() => setShowGrouped(!showGrouped)}
            >
              {showGrouped ? '📋 Hiện tất cả' : '📦 Nhóm giống nhau'}
            </Button>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addPackageDetail}
            >
              Thêm kiện hàng
            </Button>
          </div>
        </div>

        {selectedPackages.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
            <span>
              Đã chọn <strong>{selectedPackages.length}</strong> kiện hàng
            </span>
            <div className="flex gap-2">
              <Button size="small" onClick={deselectAllPackages}>
                Bỏ chọn tất cả
              </Button>
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={bulkDeletePackages}
              >
                Xóa đã chọn
              </Button>
            </div>
          </div>
        )}

        {!showGrouped && activePackages.length > 1 && (
          <div className="mb-4">
            <Button size="small" type="link" onClick={selectAllPackages}>
              ☑️ Chọn tất cả
            </Button>
          </div>
        )}

        {showGrouped ? (
          groupPackages().map((group, groupIndex) => {
            const firstIndex = group.packages[0];
            const pkg = group.data;
            return (
              <Card
                key={`group-${groupIndex}`}
                title={
                  <span>
                    Kiện hàng {groupIndex + 1} 
                    {group.quantity > 1 && <span className="text-blue-600"> (×{group.quantity})</span>}
                  </span>
                }
                size="small"
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const updated = [...packageDetails];
                      group.packages.forEach(idx => {
                        if (updated[idx].id) {
                          updated[idx] = { ...updated[idx], toDelete: true };
                        }
                      });
                      setPackageDetails(updated.filter((p, idx) => 
                        !group.packages.includes(idx) || p.id
                      ));
                    }}
                  >
                    Xóa {group.quantity > 1 ? 'nhóm' : ''}
                  </Button>
                }
                className="mb-4"
              >
                <Row gutter={24}>
                  <Col span={16}>
                    <Row gutter={12}>
                      <Col span={6}>
                        <div className="mb-2">
                          <Text strong>Số lượng</Text>
                        </div>
                        <InputNumber
                          min={1}
                          value={group.quantity}
                          onChange={(value) => updatePackageDetail(firstIndex, 'quantity', value || 1)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col span={18}>
                        <div className="mb-2">
                          <Text strong>Khoảng kích thước (Dài x Cao x Rộng)</Text>
                        </div>
                        <Select
                          value={pkg.orderSizeId}
                          onChange={(value) => updatePackageDetail(firstIndex, 'orderSizeId', value)}
                          style={{ width: '100%' }}
                          placeholder="Chọn kích thước phù hợp"
                        >
                          {orderSizes.map((size) => (
                            <Option key={size.id} value={size.id}>
                              <div className="flex justify-between items-center">
                                <span>
                                  {size.minLength} x {size.minHeight} x {size.minWidth} - {size.maxLength} x {size.maxHeight} x {size.maxWidth} (m)
                                </span>
                                {size.description && (
                                  <span className="text-gray-500 text-sm ml-2">
                                    ({size.description})
                                  </span>
                                )}
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>

                    <Row gutter={12} className="mt-4">
                      <Col span={10}>
                        <div className="mb-2">
                          <Text strong>Trọng lượng (10 - 10,000 kg)</Text>
                        </div>
                        <InputNumber
                          min={0.01}
                          max={10000}
                          step={0.1}
                          precision={2}
                          value={pkg.weight}
                          onChange={(value) => updatePackageDetail(firstIndex, 'weight', value || 0)}
                          style={{ width: '100%' }}
                          placeholder="Nhập trọng lượng (kg)"
                          status={pkg.weightError ? 'error' : ''}
                        />
                        {pkg.weightError && (
                          <div className="text-red-500 text-xs mt-1">
                            {pkg.weightError}
                          </div>
                        )}
                      </Col>
                      <Col span={6}>
                        <div className="mb-2">
                          <Text strong>Đơn vị</Text>
                        </div>
                        <Select
                          value={pkg.unit}
                          onChange={(value) => updatePackageDetail(firstIndex, 'unit', value)}
                          style={{ width: '100%' }}
                        >
                          {weightUnits.map((unit) => (
                            <Option key={unit.value} value={unit.value}>
                              {unit.label}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                  </Col>

                  <Col span={8}>
                    <div className="mb-2">
                      <Text strong>Mô tả chi tiết</Text>
                    </div>
                    <TextArea
                      rows={5}
                      value={pkg.description}
                      onChange={(e) => updatePackageDetail(firstIndex, 'description', e.target.value)}
                      placeholder="Nhập mô tả chi tiết về kiện hàng (vd: hàng dễ vỡ, hàng điện tử, quần áo...)"
                    />

                    {hasInsurance && (
                      <div className="mt-4">
                        <div className="mb-2">
                          <Text strong>Giá trị khai báo (VNĐ)</Text>
                          <Tooltip title="Giá trị khai báo phải có chứng từ hợp lệ">
                            <InfoCircleOutlined className="ml-2" style={{ color: '#999' }} />
                          </Tooltip>
                        </div>
                        <InputNumber
                          min={0}
                          value={pkg.declaredValue}
                          onChange={(value) => updatePackageDetail(firstIndex, 'declaredValue', value || 0)}
                          formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                          parser={(value: string | undefined) => {
                            if (!value) return 0;
                            const parsed = parseFloat(value.replace(/[,\s]/g, ''));
                            return isNaN(parsed) ? 0 : parsed;
                          }}
                          placeholder="Giá trị khai báo"
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            );
          })
        ) : (
          activePackages.map((pkg, index) => {
            const actualIndex = packageDetails.findIndex(p => p === pkg);
            const isSelected = selectedPackages.includes(actualIndex);
            return (
              <Card
                key={actualIndex}
                title={
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectPackage(actualIndex)}
                      className="cursor-pointer"
                    />
                    <span>Kiện hàng {index + 1}</span>
                  </div>
                }
                size="small"
                extra={
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removePackageDetail(actualIndex)}
                  >
                    Xóa
                  </Button>
                }
                className="mb-4"
                style={{ opacity: isSelected ? 0.8 : 1 }}
              >
                <Row gutter={24}>
                <Col span={16}>
                  <Row gutter={12}>
                    <Col span={6}>
                      <div className="mb-2">
                        <Text strong>Số lượng</Text>
                      </div>
                      <InputNumber
                        min={1}
                        value={pkg.quantity}
                        onChange={(value) => updatePackageDetail(actualIndex, 'quantity', value || 1)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={18}>
                      <div className="mb-2">
                        <Text strong>Khoảng kích thước (Dài x Cao x Rộng)</Text>
                      </div>
                      <Select
                        value={pkg.orderSizeId}
                        onChange={(value) => updatePackageDetail(actualIndex, 'orderSizeId', value)}
                        style={{ width: '100%' }}
                        placeholder="Chọn kích thước phù hợp"
                      >
                        {orderSizes.map((size) => (
                          <Option key={size.id} value={size.id}>
                            <div className="flex justify-between items-center">
                              <span>
                                {size.minLength} x {size.minHeight} x {size.minWidth} - {size.maxLength} x {size.maxHeight} x {size.maxWidth} (m)
                              </span>
                              {size.description && (
                                <span className="text-gray-500 text-sm ml-2">
                                  ({size.description})
                                </span>
                              )}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>

                  <Row gutter={12} className="mt-4">
                    <Col span={10}>
                      <div className="mb-2">
                        <Text strong>Trọng lượng (10 - 10,000 kg)</Text>
                      </div>
                      <InputNumber
                        min={0.01}
                        max={10000}
                        step={0.1}
                        precision={2}
                        value={pkg.weight}
                        onChange={(value) => updatePackageDetail(actualIndex, 'weight', value || 0)}
                        style={{ width: '100%' }}
                        placeholder="Nhập trọng lượng (kg)"
                        status={pkg.weightError ? 'error' : ''}
                      />
                      {pkg.weightError && (
                        <div className="text-red-500 text-xs mt-1">
                          {pkg.weightError}
                        </div>
                      )}
                    </Col>
                    <Col span={6}>
                      <div className="mb-2">
                        <Text strong>Đơn vị</Text>
                      </div>
                      <Select
                        value={pkg.unit}
                        onChange={(value) => updatePackageDetail(actualIndex, 'unit', value)}
                        style={{ width: '100%' }}
                      >
                        {weightUnits.map((unit) => (
                          <Option key={unit.value} value={unit.value}>
                            {unit.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                  </Row>
                </Col>

                <Col span={8}>
                  <div className="mb-2">
                    <Text strong>Mô tả chi tiết</Text>
                  </div>
                  <TextArea
                    rows={5}
                    value={pkg.description}
                    onChange={(e) => updatePackageDetail(actualIndex, 'description', e.target.value)}
                    placeholder="Nhập mô tả chi tiết về kiện hàng (vd: hàng dễ vỡ, hàng điện tử, quần áo...)"
                  />

                  {hasInsurance && (
                    <div className="mt-4">
                      <div className="mb-2">
                        <Text strong>Giá trị khai báo (VNĐ)</Text>
                        <Tooltip title="Giá trị khai báo phải có chứng từ hợp lệ">
                          <InfoCircleOutlined className="ml-2" style={{ color: '#999' }} />
                        </Tooltip>
                      </div>
                      <InputNumber
                        min={0}
                        value={pkg.declaredValue}
                        onChange={(value) => updatePackageDetail(actualIndex, 'declaredValue', value || 0)}
                        formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                        parser={(value: string | undefined) => {
                          if (!value) return 0;
                          const parsed = parseFloat(value.replace(/[,\s]/g, ''));
                          return isNaN(parsed) ? 0 : parsed;
                        }}
                        placeholder="Giá trị khai báo"
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          );
        })
        )}

        {/* Total Weight Validation */}
        <Card 
          size="small" 
          style={{ 
            marginTop: 16,
            marginBottom: 16,
            border: isValid ? '1px solid #d9d9d9' : '1px solid #ff4d4f',
            backgroundColor: isValid ? '#fafafa' : '#fff2f0'
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  📊 Tổng khối lượng: <span style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
                    {totalWeight.toFixed(2)} / 50.00 tấn
                  </span>
                </span>
              </Col>
              <Col>
                {!isValid && (
                  <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                    {isUnderMin ? '⚠️ Tối thiểu 0.01 tấn' : '⚠️ Tối đa 50 tấn'}
                  </span>
                )}
              </Col>
            </Row>
          </div>
          
          <Progress 
            percent={Math.min((totalWeight / 50) * 100, 100)} 
            status={isOverMax ? 'exception' : isValid ? 'success' : 'active'}
            strokeWidth={8}
            showInfo={false}
            style={{ marginBottom: 12 }}
          />

          <Alert
            message="Lưu ý quan trọng"
            description={
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div>• Mỗi kiện hàng: 0.01 - 10 tấn</div>
                <div>• Tổng đơn hàng: 0.01 - 50 tấn</div>
                <div>• Nếu khối lượng &gt; 10 tấn, hệ thống sẽ tự động phân bổ nhiều xe</div>
                <div>• Khối lượng tối đa mỗi xe: 10 tấn (giới hạn vận tải)</div>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ fontSize: '12px' }}
          />
        </Card>

        {/* Lưu ý quan trọng */}
        <Alert
          message="Lưu ý quan trọng"
          description={
            <div>
              <Text type="secondary">
                • Mỗi kiện hàng: 0.01 - 10 tấn<br/>
                • Tổng đơn hàng: 0.01 - 50 tấn<br/>
                • Nếu tổng khối lượng &gt; 10 tấn, hệ thống sẽ tự động phân bổ nhiều xe<br/>
                • Khối lượng tối đa mỗi xe: 10 tấn (giới hạn pháp lý)
              </Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Divider />

        {/* Insurance Selection */}
        <Card
          title={
            <Space>
              <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <span>Bảo hiểm hàng hóa</span>
              <Tooltip title="Bảo hiểm là TÙY CHỌN. Giúp bảo vệ quyền lợi khi xảy ra sự cố hư hỏng/mất mát do lỗi của Bên Vận Chuyển.">
                <InfoCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
        >
          <Alert
            message="Chính sách bồi thường khi xảy ra sự cố"
            description={
              <div>
                <Paragraph style={{ marginBottom: 8 }}>
                  <Text strong>Lưu ý:</Text> Trách nhiệm bồi thường <Text strong>CHỈ</Text> phát sinh khi tổn thất do lỗi chủ quan của Bên Vận Chuyển.
                </Paragraph>
                <Table
                  dataSource={[
                    { key: '1', insurance: '✅ CÓ', documents: '✅ CÓ', compensation: 'Tỷ lệ hư hại × Giá trị khai báo', note: 'TỐI ƯU NHẤT' },
                    { key: '2', insurance: '✅ CÓ', documents: '❌ KHÔNG', compensation: 'Tối đa 10 × Cước phí', note: 'BH bị vô hiệu hóa' },
                    { key: '3', insurance: '❌ KHÔNG', documents: '✅ CÓ', compensation: 'Tối đa 10 × Cước phí', note: 'Giới hạn pháp lý' },
                    { key: '4', insurance: '❌ KHÔNG', documents: '❌ KHÔNG', compensation: 'Tối đa 10 × Cước phí', note: 'RỦI RO CAO NHẤT' },
                  ]}
                  columns={[
                    { title: 'Bảo hiểm', dataIndex: 'insurance', key: 'insurance', width: 100 },
                    { title: 'Chứng từ', dataIndex: 'documents', key: 'documents', width: 100 },
                    { title: 'Mức bồi thường', dataIndex: 'compensation', key: 'compensation' },
                    { title: 'Ghi chú', dataIndex: 'note', key: 'note' },
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                  style={{ marginBottom: 12 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  * Chứng từ: Hóa đơn VAT, hợp đồng mua bán, phiếu xuất kho... chứng minh giá trị hàng hóa
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="hasInsurance"
            label={<Text strong>Quý khách có muốn mua bảo hiểm hàng hóa không?</Text>}
            initialValue={false}
          >
            <Radio.Group style={{ display: 'none' }}>
              <Radio value={true} />
              <Radio value={false} />
            </Radio.Group>
            
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card
                  size="small"
                  style={{
                    border: hasInsurance === true ? '3px solid #1890ff' : '2px solid #d9d9d9',
                    backgroundColor: hasInsurance === true ? '#f0f7ff' : '#f5f5f5',
                    borderRadius: 8,
                    cursor: 'pointer',
                    minHeight: 140,
                  }}
                  hoverable
                  onClick={() => {
                    setHasInsurance(true);
                    form.setFieldValue('hasInsurance', true);
                  }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                      <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                        MUA BẢO HIỂM
                      </Text>
                    </Space>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>Phí bảo hiểm (đã VAT 10%): </Text>
                      <Text strong style={{ color: '#1890ff', fontSize: 13 }}>
                        {normalRatePercent.toFixed(3)}% × Giá trị khai báo
                      </Text>
                    </div>
                    {totalDeclaredValue > 0 && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 13 }}>Phí ước tính: </Text>
                        <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                          {estimatedInsuranceFee.toLocaleString('vi-VN')} VNĐ
                        </Text>
                      </div>
                    )}
                    <Text style={{ color: '#52c41a', fontSize: 12 }}>
                      ✓ Bồi thường = Tỷ lệ hư hại × Giá trị khai báo
                    </Text>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  size="small"
                  style={{
                    border: hasInsurance === false ? '3px solid #faad14' : '2px solid #d9d9d9',
                    backgroundColor: hasInsurance === false ? '#fffbe6' : '#f5f5f5',
                    borderRadius: 8,
                    cursor: 'pointer',
                    minHeight: 140,
                  }}
                  hoverable
                  onClick={() => {
                    setHasInsurance(false);
                    form.setFieldValue('hasInsurance', false);
                  }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Space>
                      <CloseCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                      <Text strong style={{ color: '#faad14', fontSize: 16 }}>
                        KHÔNG MUA BẢO HIỂM
                      </Text>
                    </Space>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>Phí bảo hiểm: </Text>
                      <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                        0 VNĐ
                      </Text>
                    </div>
                    <Text style={{ color: '#ff4d4f', fontSize: 12 }}>
                      ⚠ Bồi thường tối đa: 10 × Cước phí vận chuyển
                    </Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Form.Item>
        </Card>
      </div>
    );
  };

  const renderOverviewStep = () => {
    const values = form.getFieldsValue();
    
    console.log('🔍 Overview Step - Form Values:', values);
    console.log('🔍 Overview Step - OrderData:', orderData);
    console.log('🔍 Overview Step - Addresses:', addresses);
    console.log('🔍 Overview Step - Categories:', categories);
    
    // Use orderData as fallback if form values are empty
    const receiverName = values.receiverName || orderData?.receiverName || '';
    const receiverPhone = values.receiverPhone || orderData?.receiverPhone || '';
    const receiverIdentity = values.receiverIdentity || orderData?.receiverIdentity || '';
    const packageDescription = values.packageDescription || orderData?.packageDescription || '';
    const notes = values.notes || orderData?.notes || '';
    const estimateStartTime = values.estimateStartTime || (orderData?.createdAt ? dayjs(orderData.createdAt) : null);
    
    // Get addresses - orderData contains formatted strings, not objects
    let pickupAddressText: string = "Không xác định";
    let deliveryAddressText: string = "Không xác định";
    
    // If orderData has address strings (already formatted), use them directly
    if (orderData?.pickupAddress && typeof orderData.pickupAddress === 'string') {
      pickupAddressText = orderData.pickupAddress;
    } else if (values.pickupAddressId) {
      const addr = addresses.find(a => a.id === values.pickupAddressId);
      if (addr) {
        pickupAddressText = `${addr.street}, ${addr.ward}, ${addr.province}`;
      }
    }
    
    if (orderData?.deliveryAddress && typeof orderData.deliveryAddress === 'string') {
      deliveryAddressText = orderData.deliveryAddress;
    } else if (values.deliveryAddressId) {
      const addr = addresses.find(a => a.id === values.deliveryAddressId);
      if (addr) {
        deliveryAddressText = `${addr.street}, ${addr.ward}, ${addr.province}`;
      }
    }
    
    console.log('🔍 Overview Step - Address Texts:', {
      pickupAddressText,
      deliveryAddressText,
      orderDataPickup: orderData?.pickupAddress,
      orderDataDelivery: orderData?.deliveryAddress
    });
    
    // Get category - try from form first, then from orderData
    let categoryId = values.categoryId;
    if (!categoryId && orderData?.categoryName) {
      const matchedCategory = categories.find(c => c.categoryName === orderData.categoryName);
      categoryId = matchedCategory?.id;
    }
    const category = categories.find(c => c.id === categoryId);
    
    console.log('🔍 Overview Step - Resolved Data:', {
      receiverName,
      receiverPhone,
      receiverIdentity,
      pickupAddressText,
      deliveryAddressText,
      category
    });
    
    const activePackages = packageDetails.filter(p => !p.toDelete);
    const totalWeight = calculateTotalWeight(activePackages.map(pkg => ({
      weight: pkg.weight,
      unit: pkg.unit,
      quantity: pkg.quantity,
    })));
    const totalDeclaredValue = activePackages.reduce((sum, pkg) => sum + (pkg.declaredValue * pkg.quantity), 0);
    const totalPackages = activePackages.reduce((sum, pkg) => sum + pkg.quantity, 0);
    const insuranceFee = hasInsurance ? Math.round(totalDeclaredValue * rates.normalRate) : 0;


    return (
      <>
        <Alert
          message="Xác nhận thông tin đơn hàng"
          description="Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi xác nhận. Sau khi cập nhật, đơn hàng sẽ được xử lý theo thông tin mới."
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Thông tin người nhận */}
          <Card title="Thông tin người nhận" className="shadow-sm" size="small">
            <div className="space-y-2">
              <div className="flex items-start">
                <IdcardOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Tên người nhận</Text>
                  <Text>{receiverName || "Chưa cung cấp"}</Text>
                </div>
              </div>

              <div className="flex items-start">
                <PhoneOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Số điện thoại</Text>
                  <Text>{receiverPhone || "Chưa cung cấp"}</Text>
                </div>
              </div>

              <div className="flex items-start">
                <IdcardOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">CMND/CCCD</Text>
                  <Text>{receiverIdentity || "Chưa cung cấp"}</Text>
                </div>
              </div>

              <div className="flex items-start">
                <ShopOutlined className="text-blue-500 mt-1 mr-2" />
                <div className="flex-1">
                  <Text strong className="block text-sm">Loại hàng hóa</Text>
                  <Text>
                    {category ? getCategoryDisplayName(category.categoryName) : "Không xác định"}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Thông tin địa chỉ */}
          <Card title="Thông tin địa chỉ" className="shadow-sm" size="small">
            <div className="space-y-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <div className="flex items-start">
                  <EnvironmentOutlined className="text-blue-500 mt-1 mr-2" />
                  <div>
                    <Text strong className="block text-sm">Địa chỉ lấy hàng</Text>
                    <Text className="text-sm">{pickupAddressText}</Text>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-2 rounded-md">
                <div className="flex items-start">
                  <EnvironmentOutlined className="text-red-500 mt-1 mr-2" />
                  <div>
                    <Text strong className="block text-sm">Địa chỉ giao hàng</Text>
                    <Text className="text-sm">{deliveryAddressText}</Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Thông tin bổ sung */}
          <Card title="Thông tin bổ sung" className="shadow-sm" size="small">
            <div className="space-y-2">
              <div className="flex items-start">
                <CalendarOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Thời gian lấy hàng</Text>
                  <Text>{estimateStartTime ? dayjs(estimateStartTime).format('DD/MM/YYYY') : 'Không xác định'}</Text>
                </div>
              </div>

              <div className="flex items-start">
                <FileTextOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Mô tả đơn hàng</Text>
                  <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }} className="text-sm mb-1">
                    {packageDescription || "Không có mô tả"}
                  </Paragraph>
                </div>
              </div>

              <div className="flex items-start">
                <InfoCircleOutlined className="text-blue-500 mt-1 mr-2" />
                <div>
                  <Text strong className="block text-sm">Ghi chú</Text>
                  <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: "Xem thêm" }} className="text-sm mb-1">
                    {notes || "Không có ghi chú"}
                  </Paragraph>
                </div>
              </div>
            </div>
          </Card>

          {/* Thông tin kiện hàng */}
          <Card title="Thông tin kiện hàng" className="shadow-sm md:col-span-3" size="small">
            {activePackages.length > 0 ? (
              <div>
                {/* Hiển thị tổng quan */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Text strong className="block text-sm text-blue-700">Tổng số kiện</Text>
                      <Text className="text-lg font-semibold text-blue-800">
                        {totalPackages} kiện
                      </Text>
                    </div>
                    <div>
                      <Text strong className="block text-sm text-blue-700">Tổng trọng lượng</Text>
                      <Text className="text-lg font-semibold text-blue-800">
                        {totalWeight.toFixed(2)} tấn
                      </Text>
                    </div>
                    <div>
                      <Text strong className="block text-sm text-blue-700">Tổng giá trị khai báo</Text>
                      <Text className="text-lg font-semibold text-blue-800">
                        {formatCurrency(totalDeclaredValue)}
                      </Text>
                    </div>
                    <div>
                      <Text strong className="block text-sm text-blue-700">Loại hàng</Text>
                      <Text className="text-lg font-semibold text-blue-800">
                        {category ? getCategoryDisplayName(category.categoryName) : "Không xác định"}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePackages.map((pkg, index) => {
                    const size = orderSizes.find(s => s.id === pkg.orderSizeId);
                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center mb-2">
                          <Tag color="blue" className="mr-2">
                            Kiện hàng {index + 1}
                          </Tag>
                          <Text strong>Kích thước & Trọng lượng</Text>
                        </div>
                        <Row gutter={[8, 8]}>
                          <Col span={8}>
                            <Text strong className="block text-sm">Trọng lượng</Text>
                            <Text>{pkg.weight} {pkg.unit}</Text>
                          </Col>
                          <Col span={8}>
                            <Text strong className="block text-sm">Số lượng</Text>
                            <Text className="text-blue-600 font-semibold">
                              {pkg.quantity}
                            </Text>
                          </Col>
                          <Col span={8}>
                            <Text strong className="block text-sm">Kích thước</Text>
                            <Text className="text-sm">
                              {size ? `${size.minLength}-${size.maxLength} x ${size.minHeight}-${size.maxHeight} x ${size.minWidth}-${size.maxWidth} (m)` : "Không xác định"}
                            </Text>
                          </Col>
                          <Col span={24}>
                            <Text strong className="block text-sm">Giá trị khai báo</Text>
                            <Text className="text-sm font-semibold text-green-600">
                              {formatCurrency(pkg.declaredValue || 0)}
                            </Text>
                          </Col>
                          <Col span={24}>
                            <Text strong className="block text-sm">Mô tả chi tiết</Text>
                            <Paragraph
                              ellipsis={{
                                rows: 2,
                                expandable: true,
                                symbol: "Xem thêm",
                              }}
                              className="text-sm mb-0"
                            >
                              {pkg.description || "Không có mô tả"}
                            </Paragraph>
                          </Col>
                        </Row>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Text>Chưa có thông tin kiện hàng</Text>
              </div>
            )}
          </Card>

          {/* Thông tin bảo hiểm */}
          <Card 
            title={
              <Space>
                <SafetyCertificateOutlined className="text-green-500" />
                <span>Thông tin bảo hiểm hàng hóa</span>
              </Space>
            } 
            className="shadow-sm md:col-span-3" 
            size="small"
          >
            {hasInsurance ? (
              <div>
                <Alert
                  message="Đã đăng ký bảo hiểm hàng hóa"
                  description="Hàng hóa của bạn được bảo vệ theo chính sách bảo hiểm của chúng tôi."
                  type="success"
                  showIcon
                  className="mb-3"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center mb-2">
                      <InboxOutlined className="text-green-600 mr-2" />
                      <Text strong className="text-green-700">Tổng giá trị bảo hiểm</Text>
                    </div>
                    <Text className="text-xl font-bold text-green-800">
                      {formatCurrency(totalDeclaredValue)}
                    </Text>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <DollarOutlined className="text-blue-600 mr-2" />
                      <Text strong className="text-blue-700">Phí bảo hiểm</Text>
                    </div>
                    <Text className="text-xl font-bold text-blue-800">
                      {formatCurrency(insuranceFee)}
                    </Text>
                    <Text className="block text-xs text-blue-600 mt-1">
                      {normalRatePercent.toFixed(3)}% - Đã bao gồm VAT
                    </Text>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="flex items-center mb-2">
                      <WarningOutlined className="text-orange-600 mr-2" />
                      <Text strong className="text-orange-700">Mức bồi thường tối đa</Text>
                    </div>
                    <Text className="text-xl font-bold text-orange-800">
                      {formatCurrency(totalDeclaredValue)}
                    </Text>
                    <Text className="block text-xs text-orange-600 mt-1">
                      Khi có đầy đủ chứng từ hợp lệ
                    </Text>
                  </div>
                </div>

                <Alert
                  message="Lưu ý quan trọng về bảo hiểm"
                  description={
                    <div>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Khi xảy ra sự cố, bạn cần cung cấp hóa đơn VAT hoặc chứng từ mua bán hợp pháp để chứng minh giá trị hàng hóa</li>
                        <li>Nếu không có chứng từ hợp lệ, bảo hiểm sẽ bị vô hiệu hóa và bồi thường tối đa 10 lần cước phí vận chuyển</li>
                        <li>Phải báo cáo sự cố ngay tại thời điểm nhận hàng</li>
                      </ul>
                    </div>
                  }
                  type="warning"
                  showIcon
                  className="mt-3"
                />
              </div>
            ) : (
              <div>
                <Alert
                  message="Chưa đăng ký bảo hiểm hàng hóa"
                  description="Hàng hóa của bạn chưa được bảo hiểm. Rủi ro sẽ được giải quyết theo giới hạn pháp lý (tối đa 10 lần cước phí vận chuyển)."
                  type="warning"
                  showIcon
                  className="mb-3"
                />
                
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <WarningOutlined className="text-gray-600 mr-2" />
                    <Text strong className="text-gray-700">Mức bồi thường khi không có bảo hiểm</Text>
                  </div>
                  <Text className="text-lg font-semibold text-gray-800">
                    Tối đa 10 × Cước phí vận chuyển
                  </Text>
                  <Text className="block text-sm text-gray-600 mt-1">
                    Theo Điều 546 Luật Thương mại 2005
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </div>

        <Alert
          message="Bạn đã sẵn sàng cập nhật đơn hàng?"
          description="Nhấn 'Cập nhật đơn hàng' để hoàn tất quá trình và lưu thông tin mới."
          type="success"
          showIcon
          className="mt-4"
        />
      </>
    );
  };

  const steps = [
    { title: 'Thông tin cơ bản' },
    { title: 'Kiện hàng' },
    { title: 'Xác nhận' },
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderPackageInfoStep();
      case 2:
        return renderOverviewStep();
      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center">
            <EditOutlined className="mr-2" />
            <span>Chỉnh sửa đơn hàng - {orderData?.orderCode}</span>
          </div>
        }
        open={visible}
        onCancel={handleClose}
        width={1200}
        footer={null}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Spin spinning={loading}>
          <Steps current={currentStep} className="mb-6" items={steps} />

          <Form
            form={form}
            layout="vertical"
            className="mt-4"
          >
            <div style={{ minHeight: '500px', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto', paddingRight: '8px' }}>
              {renderCurrentStep()}
            </div>
          </Form>

          <Divider />

          <div className="flex justify-between">
            <Button onClick={handleClose}>
              Hủy
            </Button>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev}>
                  Quay lại
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={handleNext}>
                  Tiếp theo
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                  Cập nhật đơn hàng
                </Button>
              )}
            </Space>
          </div>
        </Spin>
      </Modal>

      <AddressModal
        visible={addressModalVisible}
        onCancel={() => {
          setAddressModalVisible(false);
          setEditingAddress(null);
        }}
        onSuccess={handleAddressAdded}
        initialValues={editingAddress}
        mode={editingAddress ? 'edit' : 'create'}
        showAddressType={true}
        defaultAddressType={addressType}
      />

      <StipulationModal
        visible={stipulationModalVisible}
        onCancel={() => setStipulationModalVisible(false)}
        onAccept={handleStipulationAccepted}
      />
    </>
  );
};

export default OrderEditModal;
