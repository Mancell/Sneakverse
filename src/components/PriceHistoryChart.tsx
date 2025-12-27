"use client";

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AnimatedText } from '@/components/ui/animated-underline-text-one';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmazon } from '@fortawesome/free-brands-svg-icons';

export interface PriceHistoryPoint {
  date: string;
  price: number;
  salePrice?: number | null;
}

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  productName?: string;
}

type TimePeriod = '3months' | '6months' | '1year';

export default function PriceHistoryChart({ data, productName }: PriceHistoryChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1year');
  
  if (data.length === 0) {
    return (
      <div className="mt-6">
        <div className="mb-3">
          <AnimatedText 
            text="Price History" 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center gap-2.5">
            <div className="p-1.5 bg-[#FF9900]/10 rounded-md">
              <FontAwesomeIcon 
                icon={faAmazon} 
                className="text-[#FF9900] text-base"
              />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-sm leading-tight">Price History</h3>
              <p className="text-xs text-gray-500 mt-0.5">Track price changes over time</p>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600">No price history available for this product.</p>
          </div>
        </section>
      </div>
    );
  }

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= cutoffDate;
    });
  }, [data, selectedPeriod]);

  // Format data for chart
  const chartData = filteredData.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: point.date,
    price: point.price,
    salePrice: point.salePrice || point.price,
  }));

  // Calculate min and max for better Y-axis scaling
  const allPrices = [...chartData.map(d => d.price), ...chartData.map(d => d.salePrice)].filter(Boolean) as number[];
  if (allPrices.length === 0) {
    return (
      <div className="mt-6">
        <div className="mb-3">
          <AnimatedText 
            text="Price History" 
            textClassName="text-heading-3 text-dark-900 text-left"
            className="items-start"
          />
        </div>
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center gap-2.5">
            <div className="p-1.5 bg-[#FF9900]/10 rounded-md">
              <FontAwesomeIcon 
                icon={faAmazon} 
                className="text-[#FF9900] text-base"
              />
            </div>
            <div>
              <h3 className="text-gray-900 font-semibold text-sm leading-tight">Price History</h3>
              <p className="text-xs text-gray-500 mt-0.5">Track price changes over time</p>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-sm text-gray-600">No data available for the selected period.</p>
          </div>
        </section>
      </div>
    );
  }

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const yAxisMin = Math.max(0, minPrice - priceRange * 0.1);
  const yAxisMax = maxPrice + priceRange * 0.1;

  // Calculate statistics for selected period
  const currentPrice = filteredData.length > 0 ? (filteredData[filteredData.length - 1].salePrice || filteredData[filteredData.length - 1].price) : 0;
  const lowestPrice = Math.min(...filteredData.map(d => d.salePrice || d.price));
  const averagePrice = filteredData.reduce((sum, d) => sum + (d.salePrice || d.price), 0) / filteredData.length;

  // Calculate price trend
  const priceTrend = filteredData.length >= 2 
    ? filteredData[filteredData.length - 1].salePrice || filteredData[filteredData.length - 1].price 
    : 0;
  const previousPrice = filteredData.length >= 2
    ? filteredData[filteredData.length - 2].salePrice || filteredData[filteredData.length - 2].price
    : priceTrend;
  const trendPercentage = previousPrice > 0 
    ? ((priceTrend - previousPrice) / previousPrice) * 100 
    : 0;
  const isPriceUp = trendPercentage > 0;
  const isPriceDown = trendPercentage < 0;

  return (
    <div className="mt-6">
      <div className="mb-3">
        <AnimatedText 
          text="Price History" 
          textClassName="text-heading-3 text-dark-900 text-left"
          className="items-start"
        />
      </div>
      
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center gap-2.5">
          <div className="p-1.5 bg-[#FF9900]/10 rounded-md">
            <FontAwesomeIcon 
              icon={faAmazon} 
              className="text-[#FF9900] text-base"
            />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-sm leading-tight">Price History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Track price changes over time</p>
          </div>
        </div>

        <div className="p-5">
          {/* Current Price & Trend */}
          <div className="mb-5 flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Current Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">
                  ${currentPrice.toFixed(2)}
                </span>
                {filteredData.length >= 2 && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isPriceUp ? 'text-green-700 bg-green-50' : isPriceDown ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>
                    {isPriceUp ? '↑' : isPriceDown ? '↓' : '→'} {Math.abs(trendPercentage).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">vs. Average</p>
              <p className={`text-sm font-semibold ${currentPrice < averagePrice ? 'text-green-600' : currentPrice > averagePrice ? 'text-red-600' : 'text-gray-600'}`}>
                {currentPrice < averagePrice ? '↓' : currentPrice > averagePrice ? '↑' : '→'} ${Math.abs(currentPrice - averagePrice).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="mb-5 flex gap-0.5 border-b border-gray-200">
            <button
              onClick={() => setSelectedPeriod('3months')}
              className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 ${
                selectedPeriod === '3months'
                  ? 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/5'
                  : 'border-transparent text-gray-600 hover:text-[#FF9900] hover:bg-gray-50'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setSelectedPeriod('6months')}
              className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 ${
                selectedPeriod === '6months'
                  ? 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/5'
                  : 'border-transparent text-gray-600 hover:text-[#FF9900] hover:bg-gray-50'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setSelectedPeriod('1year')}
              className={`px-4 py-2 text-xs font-semibold transition-all border-b-2 ${
                selectedPeriod === '1year'
                  ? 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/5'
                  : 'border-transparent text-gray-600 hover:text-[#FF9900] hover:bg-gray-50'
              }`}
            >
              1 Year
            </button>
          </div>

          <div className="h-[220px] w-full mb-5 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 10 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9900" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#FF9900" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="saleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#146eb4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#146eb4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} strokeOpacity={0.6} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis 
                  domain={[yAxisMin, yAxisMax]}
                  stroke="#6b7280"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#6b7280' }}
                  width={55}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number | undefined, name: string | undefined) => {
                    if (value === undefined || name === undefined) return '';
                    const label = name === 'price' ? 'Regular Price' : 'Sale Price';
                    return `$${value.toFixed(2)} - ${label}`;
                  }}
                  labelFormatter={(label) => label}
                  labelStyle={{ fontWeight: 600, marginBottom: '6px', color: '#111' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="salePrice" 
                  stroke="#146eb4" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#146eb4', strokeWidth: 2, stroke: '#fff' }}
                  name="Sale Price"
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#FF9900" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#FF9900', strokeWidth: 2, stroke: '#fff' }}
                  name="Regular Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-4 border-t border-gray-200">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Lowest Price</p>
              <p className="text-lg font-bold text-gray-900">
                ${lowestPrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Best deal</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Average Price</p>
              <p className="text-lg font-bold text-gray-900">
                ${averagePrice.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{filteredData.length} data points</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5 font-medium">Price Range</p>
              <p className="text-lg font-bold text-gray-900">
                ${lowestPrice.toFixed(2)} - ${Math.max(...filteredData.map(d => d.salePrice || d.price)).toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">${(Math.max(...filteredData.map(d => d.salePrice || d.price)) - lowestPrice).toFixed(2)} difference</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

