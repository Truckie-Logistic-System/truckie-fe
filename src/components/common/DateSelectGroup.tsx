import React, { useState, useEffect } from 'react';
import { Select, Space, Form } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

interface DateSelectGroupProps {
    value?: dayjs.Dayjs;
    onChange?: (value: dayjs.Dayjs | null) => void;
    disabledDate?: (date: dayjs.Dayjs) => boolean;
    placeholder?: string;
}

const DateSelectGroup: React.FC<DateSelectGroupProps> = ({
    value,
    onChange,
    disabledDate,
    placeholder = 'Chọn ngày'
}) => {
    const [day, setDay] = useState<number | undefined>(value?.date());
    const [month, setMonth] = useState<number | undefined>(value ? value.month() + 1 : undefined);
    const [year, setYear] = useState<number | undefined>(value?.year());

    useEffect(() => {
        if (value) {
            setDay(value.date());
            setMonth(value.month() + 1);
            setYear(value.year());
        } else {
            setDay(undefined);
            setMonth(undefined);
            setYear(undefined);
        }
    }, [value]);

    const handleChange = (type: 'day' | 'month' | 'year', val: number | undefined) => {
        let newDay = type === 'day' ? val : day;
        let newMonth = type === 'month' ? val : month;
        let newYear = type === 'year' ? val : year;

        if (type === 'year') {
            setYear(val);
        } else if (type === 'month') {
            setMonth(val);
        } else if (type === 'day') {
            setDay(val);
        }

        if (newDay && newMonth && newYear) {
            // Kiểm tra ngày hợp lệ
            const daysInMonth = dayjs(`${newYear}-${newMonth}-01`).daysInMonth();
            if (newDay > daysInMonth) {
                newDay = daysInMonth;
                setDay(daysInMonth);
            }

            const newDate = dayjs(`${newYear}-${newMonth}-${newDay}`);

            // Kiểm tra disabledDate nếu có
            if (disabledDate && disabledDate(newDate)) {
                return;
            }

            onChange?.(newDate);
        } else {
            onChange?.(null);
        }
    };

    // Tạo danh sách ngày dựa trên tháng và năm đã chọn
    const getDaysInMonth = () => {
        if (!month || !year) return Array.from({ length: 31 }, (_, i) => i + 1);
        return Array.from({ length: dayjs(`${year}-${month}-01`).daysInMonth() }, (_, i) => i + 1);
    };

    // Tạo danh sách tháng (1-12)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Tạo danh sách năm (từ 1900 đến năm hiện tại)
    const currentYear = dayjs().year();
    const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

    return (
        <Space className="w-full">
            <Select
                placeholder="Ngày"
                value={day}
                onChange={(val) => handleChange('day', val)}
                className="w-1/3"
                showSearch
                optionFilterProp="children"
            >
                {getDaysInMonth().map((d) => (
                    <Option key={d} value={d}>
                        {d}
                    </Option>
                ))}
            </Select>
            <Select
                placeholder="Tháng"
                value={month}
                onChange={(val) => handleChange('month', val)}
                className="w-1/3"
                showSearch
                optionFilterProp="children"
            >
                {months.map((m) => (
                    <Option key={m} value={m}>
                        {m}
                    </Option>
                ))}
            </Select>
            <Select
                placeholder="Năm"
                value={year}
                onChange={(val) => handleChange('year', val)}
                className="w-1/3"
                showSearch
                optionFilterProp="children"
            >
                {years.map((y) => (
                    <Option key={y} value={y}>
                        {y}
                    </Option>
                ))}
            </Select>
        </Space>
    );
};

export default DateSelectGroup; 