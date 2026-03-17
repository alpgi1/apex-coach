import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

interface SpiderChartProps {
    data: { label: string; value: number }[];
    size?: number;
    rings?: number;
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
}

export default function SpiderChart({
    data,
    size = 260,
    rings = 4,
    fillColor = '#FF6000',
    fillOpacity = 0.25,
    strokeColor = '#FF6000',
}: SpiderChartProps) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 35; // padding for labels
    const sides = data.length;

    if (sides === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.value), 1); // avoid /0

    /** Returns the (x, y) for a given axis index at a given distance from center. */
    const getPoint = (index: number, distance: number): [number, number] => {
        const angle = (2 * Math.PI * index) / sides - Math.PI / 2;
        return [cx + distance * Math.cos(angle), cy + distance * Math.sin(angle)];
    };

    /** Builds a polygon points string for a ring at a given fraction of the radius. */
    const ringPoints = (fraction: number): string =>
        Array.from({ length: sides }, (_, i) => getPoint(i, radius * fraction).join(','))
            .join(' ');

    /** Data polygon points. */
    const dataPoints = data
        .map((d, i) => {
            const normalized = d.value / maxValue;
            return getPoint(i, radius * normalized).join(',');
        })
        .join(' ');

    /** Label positioning with smart text-anchor. */
    const getTextAnchor = (index: number): 'start' | 'middle' | 'end' => {
        const angle = (2 * Math.PI * index) / sides - Math.PI / 2;
        const x = Math.cos(angle);
        if (x > 0.25) return 'start';
        if (x < -0.25) return 'end';
        return 'middle';
    };

    const getLabelOffset = (index: number): [number, number] => {
        const angle = (2 * Math.PI * index) / sides - Math.PI / 2;
        return [Math.cos(angle) * 16, Math.sin(angle) * 16];
    };

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Grid rings */}
                {Array.from({ length: rings }, (_, r) => (
                    <Polygon
                        key={`ring-${r}`}
                        points={ringPoints((r + 1) / rings)}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={1}
                    />
                ))}

                {/* Axis lines */}
                {data.map((_, i) => {
                    const [x, y] = getPoint(i, radius);
                    return (
                        <Line
                            key={`axis-${i}`}
                            x1={cx}
                            y1={cy}
                            x2={x}
                            y2={y}
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth={1}
                        />
                    );
                })}

                {/* Data polygon */}
                <Polygon
                    points={dataPoints}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                    stroke={strokeColor}
                    strokeWidth={2}
                />

                {/* Data dots */}
                {data.map((d, i) => {
                    const normalized = d.value / maxValue;
                    const [x, y] = getPoint(i, radius * normalized);
                    return (
                        <Circle
                            key={`dot-${i}`}
                            cx={x}
                            cy={y}
                            r={3}
                            fill={strokeColor}
                        />
                    );
                })}

                {/* Labels */}
                {data.map((d, i) => {
                    const [x, y] = getPoint(i, radius);
                    const [ox, oy] = getLabelOffset(i);
                    return (
                        <SvgText
                            key={`label-${i}`}
                            x={x + ox}
                            y={y + oy}
                            fill="rgba(255,255,255,0.7)"
                            fontSize={11}
                            fontWeight="600"
                            textAnchor={getTextAnchor(i)}
                            alignmentBaseline="central"
                        >
                            {d.label}
                        </SvgText>
                    );
                })}

                {/* Center dot */}
                <Circle cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.2)" />
            </Svg>
        </View>
    );
}
