import React, { useEffect, useState } from 'react';
import { Select, Space, Form } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

interface DateSelectGroupProps {
    value?: dayjs.Dayjs;
    onChange?: (value: dayjs.Dayjs) => void;
    minDate?: dayjs.Dayjs;
    disabled?: boolean;
    mode?: 'birthdate' | 'delivery';
    maxYear?: number;
    minYear?: number;
}

const DateSelectGroup: React.FC<DateSelectGroupProps> = ({
    value,
    onChange,
    minDate,
    disabled = false,
    mode = 'delivery',
    maxYear = dayjs().year(),
    minYear = maxYear - 100,
}) => {
    // Initialize with appropriate default date based on mode
    const getDefaultDate = () => {
        if (mode === 'birthdate') {
            return dayjs().subtract(18, 'year');
        } else {
            return minDate || dayjs().add(2, 'day');
        }
    };

    const initialDate = value || getDefaultDate();

    const [selectedDay, setSelectedDay] = useState<number>(initialDate.date());
    const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.month() + 1); // dayjs months are 0-indexed
    const [selectedYear, setSelectedYear] = useState<number>(initialDate.year());
    const [selectedHour, setSelectedHour] = useState<number>(initialDate.hour());
    const [selectedMinute, setSelectedMinute] = useState<number>(initialDate.minute());
    // Always use 0 for seconds
    const selectedSecond = 0;

    // Generate options for days based on selected month and year
    const getDaysInMonth = (year: number, month: number): number => {
        return new Date(year, month, 0).getDate();
    };

    // Update the internal state when the external value changes
    useEffect(() => {
        if (value) {
            setSelectedDay(value.date());
            setSelectedMonth(value.month() + 1);
            setSelectedYear(value.year());
            setSelectedHour(value.hour());
            setSelectedMinute(value.minute());
        }
    }, [value]);

    // Call the onChange prop when any of the selects change
    const handleChange = (type: 'day' | 'month' | 'year' | 'hour' | 'minute', newValue: number) => {
        let day = selectedDay;
        let month = selectedMonth;
        let year = selectedYear;
        let hour = selectedHour;
        let minute = selectedMinute;

        // Update the specific value based on type
        switch (type) {
            case 'day':
                day = newValue;
                setSelectedDay(newValue);
                break;
            case 'month':
                month = newValue;
                setSelectedMonth(newValue);
                break;
            case 'year':
                year = newValue;
                setSelectedYear(newValue);
                break;
            case 'hour':
                hour = newValue;
                setSelectedHour(newValue);
                break;
            case 'minute':
                minute = newValue;
                setSelectedMinute(newValue);
                break;
        }

        // Create the new date object
        if (onChange) {
            const newDate = dayjs()
                .year(year)
                .month(month - 1)
                .date(day)
                .hour(hour)
                .minute(minute)
                .second(selectedSecond);

            onChange(newDate);
        }
    };

    // Get valid days for the selected month and year
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

    // Generate arrays for options based on mode
    let years;
    if (mode === 'birthdate') {
        years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
    } else {
        years = Array.from({ length: 5 }, (_, i) => dayjs().year() + i);
    }

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // Filter days based on minDate (only for delivery mode)
    const validDays = mode === 'delivery' && minDate && selectedYear === minDate.year() && selectedMonth === minDate.month() + 1
        ? days.filter(day => day >= minDate.date())
        : days;

    // Filter months based on minDate (only for delivery mode)
    const validMonths = mode === 'delivery' && minDate && selectedYear === minDate.year()
        ? months.filter(month => month >= minDate.month() + 1)
        : months;

    // Adjust day if it exceeds days in month
    useEffect(() => {
        const maxDays = getDaysInMonth(selectedYear, selectedMonth);
        if (selectedDay > maxDays) {
            setSelectedDay(maxDays);
            handleChange('day', maxDays);
        }
    }, [selectedMonth, selectedYear]);

    return (
        <Space>
            <Select
                value={selectedDay}
                onChange={(value) => handleChange('day', value)}
                style={{ width: 70 }}
                disabled={disabled}
            >
                {validDays.map(day => (
                    <Option key={day} value={day}>{day}</Option>
                ))}
            </Select>
            <span>/</span>
            <Select
                value={selectedMonth}
                onChange={(value) => handleChange('month', value)}
                style={{ width: 70 }}
                disabled={disabled}
            >
                {validMonths.map(month => (
                    <Option key={month} value={month}>{month}</Option>
                ))}
            </Select>
            <span>/</span>
            <Select
                value={selectedYear}
                onChange={(value) => handleChange('year', value)}
                style={{ width: 90 }}
                disabled={disabled}
            >
                {years.map(year => (
                    <Option key={year} value={year}>{year}</Option>
                ))}
            </Select>

            {mode === 'delivery' && (
                <>
                    <span>-</span>
                    <Select
                        value={selectedHour}
                        onChange={(value) => handleChange('hour', value)}
                        style={{ width: 70 }}
                        disabled={disabled}
                    >
                        {hours.map(hour => (
                            <Option key={hour} value={hour}>{hour.toString().padStart(2, '0')}</Option>
                        ))}
                    </Select>
                    <span>:</span>
                    <Select
                        value={selectedMinute}
                        onChange={(value) => handleChange('minute', value)}
                        style={{ width: 70 }}
                        disabled={disabled}
                    >
                        {minutes.map(minute => (
                            <Option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</Option>
                        ))}
                    </Select>
                </>
            )}
        </Space>
    );
};

export default DateSelectGroup; 